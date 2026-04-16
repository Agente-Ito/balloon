import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
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
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#252629",
                color: "#fff",
                border: "1px solid #3A3B3E",
              },
            }}
          />
        </NotificationsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
