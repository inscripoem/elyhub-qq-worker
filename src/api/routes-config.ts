import { Elysia } from "elysia";
import { configStore, validateConfig } from "../services/config-store";

export function registerConfigRoutes(app: Elysia): void {
  app
    .get("/api/config", () => configStore.getMasked())
    .put("/api/config", async ({ body, set }) => {
      try {
        const current = configStore.get();
        validateConfig({ ...current, ...(body as Record<string, unknown>) });
        await configStore.update(body as Record<string, unknown>);
        return configStore.getMasked();
      } catch (err) {
        set.status = 400;
        return {
          error: "Invalid config",
          message:
            err instanceof Error ? err.message : "Unknown validation error",
        };
      }
    });
}
