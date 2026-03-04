import { Elysia } from "elysia";
import { runtimeManager } from "../core/runtime";
import { statusBroadcaster } from "../services/status-broadcaster";

export function registerStatusRoutes(app: Elysia): void {
  app.get("/api/status", ({ query }) => {
    if (query.stream !== "1") {
      return runtimeManager.getStatus();
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

        // send current status immediately on connect
        enqueue(
          `event: status\ndata: ${JSON.stringify(runtimeManager.getStatus())}\n\n`
        );

        unsubscribe = statusBroadcaster.subscribe((status) => {
          enqueue(`event: status\ndata: ${JSON.stringify(status)}\n\n`);
        });

        keepaliveTimer = setInterval(() => enqueue(": ping\n\n"), 15_000);
      },
      cancel() {
        unsubscribe?.();
        unsubscribe = null;
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
