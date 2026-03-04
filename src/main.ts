import { configStore } from "./services/config-store";
import { stateStore } from "./services/state-store";
import { createLogger } from "./services/logger";
import { createApp } from "./api/app";
import { runtimeManager } from "./core/runtime";

const logger = createLogger("main");

async function bootstrap(): Promise<void> {
  await configStore.init();
  await stateStore.init();
  runtimeManager.loadState();

  const app = createApp();
  const port = Number(process.env.PORT ?? 3188);
  const hostname = process.env.HOST ?? "127.0.0.1";
  app.listen({ port, hostname });
  logger.info({ port, hostname, url: `http://${hostname}:${port}` }, "ElyHub QQ Worker ready");

  // Auto-start only when essential fields are configured.
  // A fresh install has empty secret/URL, so we skip to avoid misleading errors.
  const cfg = configStore.get();
  if (cfg.elyhubBaseUrl && cfg.secret) {
    try {
      await runtimeManager.start();
    } catch (err) {
      logger.warn({ err }, "auto-start failed, worker is in error state");
    }
  } else {
    logger.info("config not set up, skipping auto-start");
  }

  const shutdown = async () => {
    logger.info("shutdown signal received");
    await runtimeManager.dispose();
    await stateStore.flush();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("fatal bootstrap error", err);
  process.exit(1);
});
