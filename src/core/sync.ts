import { Cron } from "croner";
import { createLogger } from "../services/logger";
import { napcatService } from "../services/napcat";
import { elyHubClient } from "../services/elyhub-client";
import { configStore } from "../services/config-store";
import { chunkArray, runWithPool } from "../services/chunker";
import { stateStore } from "../services/state-store";
import { shouldUseWorker, type WorkerGroupBatchUpdate } from "../types/api";
import type { RecentGroup } from "../types/status";
import {
  BATCH_LIMIT,
  CONCURRENCY_LIMIT,
  RECENT_GROUPS_LIMIT,
  SYNC_EXPIRE_GRACE_FACTOR,
} from "./constants";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const logger = createLogger("sync");

export class SyncService {
  private stats = stateStore.getSync();

  loadState(): void {
    this.stats = stateStore.getSync();
  }

  async runOnce(): Promise<number> {
    const cfg = configStore.get();
    this.stats.lastRunAt = new Date().toISOString();
    logger.info("sync started");

    const remote = await elyHubClient.getWorkerConfig(cfg);
    if (!remote.enabled) {
      logger.debug("worker disabled, skipping sync");
      this.stats.lastUpdatedCount = 0;
      return 0;
    }

    const job = new Cron(cfg.syncCron);
    const next1 = job.nextRun();
    const next2 = next1 ? job.nextRun(next1) : null;
    const intervalMs =
      next1 && next2
        ? next2.getTime() - next1.getTime()
        : 5 * 60 * 1000;
    const expireAt = new Date(
      Date.now() + intervalMs * SYNC_EXPIRE_GRACE_FACTOR
    ).toISOString();

    const { updates: partialUpdates, recentGroups: partialRecent } = await this.fillPartialGroups(cfg, cfg.napcatGroupDelay, cfg.napcatIntraGroupDelay);
    const { updates, recentGroups: fullRecent } = await this.fullSync(cfg, expireAt, cfg.napcatGroupDelay, cfg.napcatIntraGroupDelay);

    const allUpdates = [...partialUpdates, ...updates];
    // Deduplicate by id — fullSync wins (has status + expireAt)
    const updatesMap = new Map<string, WorkerGroupBatchUpdate>();
    for (const u of allUpdates) updatesMap.set(u.id, u);
    const deduplicatedUpdates = [...updatesMap.values()];

    let updatedCount = 0;
    for (const batch of chunkArray(deduplicatedUpdates, BATCH_LIMIT)) {
      const result = await elyHubClient.postBatch(cfg, batch);
      updatedCount += result.updated.length;
      if (result.notFound.length > 0) {
        logger.warn({ notFound: result.notFound }, "some group IDs not found");
      }
    }

    this.stats.lastUpdatedCount = updatedCount;
    this.stats.lastSuccessAt = new Date().toISOString();
    // Deduplicate by id — fullRecent wins (has correct post-sync status)
    const recentMap = new Map<string, RecentGroup>();
    for (const g of [...partialRecent, ...fullRecent]) recentMap.set(g.id, g);
    this.stats.recentGroups = [...recentMap.values()].slice(0, RECENT_GROUPS_LIMIT);
    stateStore.setSync(this.stats);
    logger.info({ updatedCount }, "sync completed");
    return updatedCount;
  }

  getStats() {
    return { ...this.stats, recentGroups: [...this.stats.recentGroups] };
  }

  private async fillPartialGroups(
    cfg: Parameters<typeof elyHubClient.getPartialGroups>[0],
    groupDelayMs = 0,
    intraGroupDelayMs = 0
  ): Promise<{ updates: WorkerGroupBatchUpdate[]; recentGroups: RecentGroup[] }> {
    const partial = await elyHubClient.getPartialGroups(cfg, [
      "name",
      "avatar_url",
    ]);
    const groups = partial.data.filter(
      (g) => shouldUseWorker(g.useWorker) && g.qqNumber
    );

    const infos = await runWithPool(
      groups,
      async (group) => {
        if (groupDelayMs > 0) await sleep(groupDelayMs);
        return napcatService.getGroupInfo(group.qqNumber!, 5000, intraGroupDelayMs);
      },
      CONCURRENCY_LIMIT
    );

    const now = new Date().toISOString();
    const updates: WorkerGroupBatchUpdate[] = [];
    const recentGroups: RecentGroup[] = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const info = infos[i];
      if (info.status !== "success") continue;
      updates.push({ id: group.id, name: info.groupName, avatarUrl: info.groupPicUrl });
      recentGroups.push({
        id: group.id,
        alias: group.alias,
        qqNumber: group.qqNumber,
        name: info.groupName ?? group.name,
        status: group.status,
        updatedAt: now,
      });
    }

    return { updates, recentGroups };
  }

  private async fullSync(
    cfg: Parameters<typeof elyHubClient.getGroups>[0],
    expireAt: string,
    groupDelayMs = 0,
    intraGroupDelayMs = 0
  ): Promise<{ updates: WorkerGroupBatchUpdate[]; recentGroups: RecentGroup[] }> {
    const groupsRes = await elyHubClient.getGroups(cfg);
    const groups = groupsRes.data.filter(
      (g) => shouldUseWorker(g.useWorker) && g.qqNumber
    );

    const infos = await runWithPool(
      groups,
      async (group) => {
        if (groupDelayMs > 0) await sleep(groupDelayMs);
        return napcatService.getGroupInfo(group.qqNumber!, 5000, intraGroupDelayMs);
      },
      CONCURRENCY_LIMIT
    );

    const updates: WorkerGroupBatchUpdate[] = groups.map((group, i) => {
      const info = infos[i];
      if (info.status === "success") {
        return {
          id: group.id,
          status: "ACTIVE",
          name: info.groupName,
          avatarUrl: info.groupPicUrl,
          joinLink: info.groupUrl,
          expireAt,
        };
      }
      return {
        id: group.id,
        status: info.status === "not_found" ? "INVALID" : "UNKNOWN",
        expireAt,
      };
    });

    const now = new Date().toISOString();
    const recentGroups: RecentGroup[] = groups
      .slice(0, RECENT_GROUPS_LIMIT)
      .map((g, i) => ({
        id: g.id,
        alias: g.alias,
        qqNumber: g.qqNumber,
        name:
          infos[i].status === "success"
            ? (infos[i] as { status: "success"; groupName: string | null })
                .groupName
            : g.name,
        status: updates[i].status ?? g.status,
        updatedAt: now,
      }));

    return { updates, recentGroups };
  }
}
