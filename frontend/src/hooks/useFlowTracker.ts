/**
 * useFlowTracker — Analytics hook for tracking user flow and drop-off points.
 *
 * Designed for iframe environments (LUKSO Grid) where cookie-based analytics
 * don't work well. Can be connected to:
 *   - A custom indexer endpoint: POST /api/analytics
 *   - sessionStorage for dev inspection
 *   - A service like Plausible or Mixpanel (with proper headers)
 *
 * Emits events like:
 *   - view_enter: User enters a view
 *   - view_exit: User leaves a view
 *   - action_click: User clicks a significant button
 *   - form_submitted: User submits a form
 *   - error_occurred: An error happened during a transaction
 *   - claim_success: User claimed a drop
 */

import { useEffect } from "react";

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_URL ?? null;
const DEV_MODE = import.meta.env.DEV;

interface AnalyticsEvent {
  timestamp: number;
  eventType: string;
  viewName?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

let sessionId: string | null = null;

/**
 * Generate a unique session ID for this grid iframe session
 */
function getSessionId(): string {
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return sessionId;
}

/**
 * Send an analytics event to the backend or log locally
 */
function trackEvent(event: AnalyticsEvent) {
  const enriched: AnalyticsEvent = {
    ...event,
    sessionId: getSessionId(),
    timestamp: event.timestamp || Date.now(),
  };

  if (DEV_MODE) {
    // Log to console in dev
    console.debug("[Analytics]", enriched.eventType, enriched.metadata);
  }

  // Store in sessionStorage for inspection
  const events = JSON.parse(sessionStorage.getItem("__celebr_analytics") || "[]");
  events.push(enriched);
  sessionStorage.setItem("__celebr_analytics", JSON.stringify(events));

  // Optional: send to analytics endpoint if configured
  if (ANALYTICS_ENDPOINT) {
    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enriched),
    }).catch((e) => {
      if (DEV_MODE) console.warn("[Analytics] Failed to send event:", e);
    });
  }
}

/**
 * Hook: track view enter/exit
 * Call once on mount, optionally cleanup on unmount
 */
export function useTrackView(viewName: string) {
  useEffect(() => {
    trackEvent({
      eventType: "view_enter",
      viewName,
      timestamp: Date.now(),
    });

    return () => {
      trackEvent({
        eventType: "view_exit",
        viewName,
        timestamp: Date.now(),
      });
    };
  }, [viewName]);
}

/**
 * Hook: track button/CTA clicks with optional metadata
 * Usage: const track = useTrackAction(); track("claim_drop", { dropId: "0x..." })
 */
export function useTrackAction() {
  return (actionName: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: "action_click",
      metadata: { actionName, ...metadata },
      timestamp: Date.now(),
    });
  };
}

/**
 * Hook: track form submission
 */
export function useTrackFormSubmit(formName: string) {
  return (metadata?: Record<string, any>) => {
    trackEvent({
      eventType: "form_submitted",
      metadata: { formName, ...metadata },
      timestamp: Date.now(),
    });
  };
}

/**
 * Hook: track transaction errors
 */
export function useTrackError(viewName: string) {
  return (errorType: string, errorMessage: string) => {
    trackEvent({
      eventType: "error_occurred",
      viewName,
      metadata: { errorType, errorMessage },
      timestamp: Date.now(),
    });
  };
}

/**
 * Hook: track successful claims
 */
export function useTrackClaim() {
  return (dropId: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: "claim_success",
      metadata: { dropId, ...metadata },
      timestamp: Date.now(),
    });
  };
}

// For debugging: expose analytics data globally in dev
if (DEV_MODE && typeof window !== "undefined") {
  (window as any).__celebrAnalytics = {
    getSessionId,
    getEvents: () => JSON.parse(sessionStorage.getItem("__celebr_analytics") || "[]"),
    clearEvents: () => sessionStorage.removeItem("__celebr_analytics"),
  };
}
