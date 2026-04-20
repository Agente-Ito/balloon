import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { NotificationsProvider } from "@/app/providers/NotificationsProvider";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#fff", background: "#1A1B1E", minHeight: "100vh", fontFamily: "monospace", fontSize: 13 }}>
          <div style={{ color: "#FE005B", marginBottom: 8 }}>⚠ Runtime error</div>
          <div style={{ marginBottom: 4 }}>{this.state.error.message}</div>
          <pre style={{ color: "#aaa", whiteSpace: "pre-wrap", fontSize: 11 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          <App />
          <Analytics />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "linear-gradient(135deg, #6A1B9A 0%, #9C4EDB 45%, #6A1B9A 100%)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.24)",
                boxShadow: "0 8px 24px rgba(106,27,154,0.35), inset 0 1px 0 rgba(255,255,255,0.25)",
                fontWeight: 600,
              },
            }}
          />
        </NotificationsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
