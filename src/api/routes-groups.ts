import { Elysia } from "elysia";
import { searchElyHubGroups } from "../services/group-search";

export function registerGroupRoutes(app: Elysia): void {
  app.get("/api/groups/search", async ({ query, set }) => {
    try {
      const keyword = typeof query.q === "string" ? query.q : "";
      const result = await searchElyHubGroups(keyword);
      return result;
    } catch (err) {
      set.status = 400;
      return {
        error: err instanceof Error ? err.message : "unknown error",
      };
    }
  });
}
