import { Elysia } from "elysia";
import { getRecentLogs, subscribeLogs } from "../services/logger";

export function registerLogRoutes(app: Elysia): void {
  app.get("/api/logs", ({ query }) => {
    if (query.stream !== "1") {
      return getRecentLogs();
    }

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enqueue = (chunk: string) => {
          try {
            controller.enqueue(encoder.encode(chunk));
          } catch {
            // client disconnected, cleanup handled in cancel
          }
        };

        unsubscribe = subscribeLogs((entry) => {
          enqueue(`event: log\ndata: ${JSON.stringify(entry)}\n\n`);
        });

        keepaliveTimer = setInterval(() => {
          enqueue(": ping\n\n");
        }, 15_000);
      },
      cancel() {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        if (keepaliveTimer !== null) {
          clearInterval(keepaliveTimer);
          keepaliveTimer = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  });
}
