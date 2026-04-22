import { elyHubClient } from "./elyhub-client";
import { configStore } from "./config-store";
import type { WorkerGroupListResponse } from "../types/api";

/**
 * 调用 ElyHub 的群组搜索接口
 * 供前端 API 和后续 QQ 群消息交互 handler 复用
 */
export async function searchElyHubGroups(
  keyword: string
): Promise<WorkerGroupListResponse> {
  return elyHubClient.getGroups(configStore.get(), keyword);
}
