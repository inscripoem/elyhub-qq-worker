import { join } from "node:path";
import { Elysia } from "elysia";
import { registerStatusRoutes } from "./routes-status";
import { registerConfigRoutes } from "./routes-config";
import { registerLogRoutes } from "./routes-logs";
import { registerControlRoutes } from "./routes-control";
import { registerSyncRoutes } from "./routes-sync";
import { registerGroupRoutes } from "./routes-groups";

const UI_DIR = join(process.cwd(), "dist");

const ADMIN_TOKEN = process.env.WORKER_ADMIN_TOKEN?.trim() ?? "";

export function createApp(): Elysia {
  const app = new Elysia();

  if (ADMIN_TOKEN) {
    app.onBeforeHandle(({ request, set }) => {
      const url = new URL(request.url);
      if (!url.pathname.startsWith("/api/")) return;
      const headerOk = request.headers.get("authorization") === `Bearer ${ADMIN_TOKEN}`;
      const queryOk = url.searchParams.get("token") === ADMIN_TOKEN;
      if (!headerOk && !queryOk) {
        set.status = 401;
        return { error: "unauthorized" };
      }
    });
  }

  registerStatusRoutes(app);
  registerConfigRoutes(app);
  registerLogRoutes(app);
  registerControlRoutes(app);
  registerSyncRoutes(app);
  registerGroupRoutes(app);

  app.get("/*", async ({ request }) => {
    const pathname = new URL(request.url).pathname;

    const filePath =
      pathname === "/" || pathname === ""
        ? join(UI_DIR, "index.html")
        : join(UI_DIR, pathname.replace(/^\//, ""));

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response(Bun.file(join(UI_DIR, "index.html")));
  });

  return app;
}
