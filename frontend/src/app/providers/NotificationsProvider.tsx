/**
 * NotificationsProvider — queues and displays in-app toast notifications.
 * Used to show feedback after on-chain transactions (badge minted, greeting sent, etc.)
 * without requiring every component to manage toast state independently.
 */
import {
  createContext,
  useContext,
  useCallback,
  useReducer,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = "success" | "error" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
}

interface NotificationsState {
  notifications: Notification[];
}

type NotificationsAction =
  | { type: "ADD"; notification: Notification }
  | { type: "REMOVE"; id: string };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: NotificationsState, action: NotificationsAction): NotificationsState {
  switch (action.type) {
    case "ADD":
      return { notifications: [...state.notifications, action.notification] };
    case "REMOVE":
      return { notifications: state.notifications.filter((n) => n.id !== action.id) };
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface NotificationsContextValue {
  notifications: Notification[];
  notify: (type: NotificationType, title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { notifications: [] });

  const notify = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      dispatch({ type: "ADD", notification: { id, type, title, message } });
      // Auto-dismiss after 5 seconds
      setTimeout(() => dispatch({ type: "REMOVE", id }), 5000);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications: state.notifications, notify, dismiss }}>
      {children}
      <NotificationToasts
        notifications={state.notifications}
        onDismiss={dismiss}
      />
    </NotificationsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within <NotificationsProvider>");
  return ctx;
}

// ── UI ────────────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<NotificationType, string> = {
  success: "border-amber-500/35 bg-amber-500/12",
  error:   "border-red-500/30 bg-red-500/10",
  info:    "border-lukso-purple/30 bg-lukso-purple/10",
};

const TYPE_ICONS: Record<NotificationType, string> = {
  success: "✓",
  error:   "✕",
  info:    "ℹ",
};

function NotificationToasts({
  notifications,
  onDismiss,
}: {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`card border ${TYPE_STYLES[n.type]} animate-slide-up flex items-start gap-3 p-4`}
        >
          <span className="text-lg leading-none mt-0.5">{TYPE_ICONS[n.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{n.title}</p>
            {n.message && <p className="text-xs text-white/50 mt-0.5">{n.message}</p>}
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="text-white/30 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
