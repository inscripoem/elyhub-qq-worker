import { Elysia } from "elysia";
import { runtimeManager } from "../core/runtime";

export function registerSyncRoutes(app: Elysia): void {
  app.post("/api/sync", async ({ set }) => {
    try {
      const updatedCount = await runtimeManager.syncNow();
      return { ok: true, updatedCount };
    } catch (err) {
      set.status = 400;
      return {
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      };
    }
  });
}
