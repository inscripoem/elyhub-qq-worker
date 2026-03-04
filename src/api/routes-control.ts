import { Elysia } from "elysia";
import { runtimeManager } from "../core/runtime";

type ControlAction = "start" | "stop" | "restart";

export function registerControlRoutes(app: Elysia): void {
  app.post("/api/control", async ({ body, set }) => {
    const action = (body as { action?: string })?.action;
    if (action !== "start" && action !== "stop" && action !== "restart") {
      set.status = 400;
      return { error: "action must be start | stop | restart" };
    }

    try {
      await ({ start: () => runtimeManager.start(),
               stop: () => runtimeManager.stop(),
               restart: () => runtimeManager.restart() } as Record<ControlAction, () => Promise<void>>)[action as ControlAction]();
      return { ok: true, state: runtimeManager.getState() };
    } catch (err) {
      set.status = 500;
      return {
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      };
    }
  });
}
