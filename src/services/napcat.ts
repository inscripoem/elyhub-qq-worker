import { NCWebsocket } from "node-napcat-ts";
import { createLogger } from "./logger";

type ArkShareContact = {
  nickname?: string;
  jumpUrl?: string;
  legacyUrl?: string;
  avatar?: string;
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type NapcatGroupInfoResult =
  | {
      status: "success";
      groupName: string | null;
      groupUrl: string | null;
      groupPicUrl: string | null;
    }
  | {
      status: "not_found" | "error";
      error?: string;
    };

export class NapcatService {
  private client: NCWebsocket | null = null;
  private connected = false;
  private params: { host: string; port: number; token: string } | null = null;
  private lastError: string | null = null;
  private readonly logger = createLogger("napcat");

  async connect(
    host: string,
    port: number,
    token: string,
    reconnectAttempts = 5,
    reconnectDelay = 3000
  ): Promise<void> {
    if (
      this.connected &&
      this.params?.host === host &&
      this.params?.port === port &&
      this.params?.token === token
    ) {
      return;
    }

    if (this.connected) {
      await this.disconnect();
    }

    this.lastError = null;

    this.client = new NCWebsocket(
      {
        protocol: "ws",
        host,
        port,
        accessToken: token,
        throwPromise: true,
        reconnection: {
          enable: reconnectAttempts > 0,
          attempts: reconnectAttempts,
          delay: reconnectDelay,
        },
      },
      false
    );

    this.client.on("socket.error", (err) => {
      const msg =
        err.error_type === "response_error"
          ? err.info.message
          : `connect_error (${err.reconnection.nowAttempts}/${err.reconnection.attempts})`;
      this.lastError = msg;
      this.logger.warn({ error_type: err.error_type }, `napcat socket error: ${msg}`);
    });

    try {
      await this.client.connect();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.lastError = msg;
      this.client = null;
      this.connected = false;
      throw err;
    }

    this.connected = true;
    this.params = { host, port, token };
    this.logger.info({ host, port }, "connected to napcat");
  }

  async reconnect(
    host: string,
    port: number,
    token: string,
    reconnectAttempts = 5,
    reconnectDelay = 3000
  ): Promise<void> {
    await this.disconnect();
    await this.connect(host, port, token, reconnectAttempts, reconnectDelay);
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      this.connected = false;
      return;
    }
    try {
      this.client.disconnect();
    } catch (err) {
      this.logger.warn({ err }, "napcat disconnect error");
    } finally {
      this.client = null;
      this.connected = false;
      this.params = null;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionInfo(): { host: string; port: number; error: string | null } {
    return {
      host: this.params?.host ?? "",
      port: this.params?.port ?? 0,
      error: this.lastError,
    };
  }

  async getGroupInfo(
    groupId: string,
    timeoutMs = 5000,
    intraGroupDelayMs = 0
  ): Promise<NapcatGroupInfoResult> {
    if (!this.client) {
      return { status: "error", error: "napcat not connected" };
    }

    const withTimeout = <T>(promise: Promise<T>): Promise<T> => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("napcat timeout")),
            timeoutMs
          );
        }),
      ]).finally(() => {
        if (timer !== undefined) clearTimeout(timer);
      });
    };

    const groupIdNum = parseInt(groupId, 10);

    try {
      // ArkShareGroup: get join link and avatar
      const arkResult = await withTimeout(
        this.client.ArkShareGroup({ group_id: groupId })
      );
      const parsed = JSON.parse(String(arkResult)) as {
        meta?: { contact?: ArkShareContact };
      };
      const contact = parsed?.meta?.contact;
      if (!contact) return { status: "not_found" };

      // Wait between the two calls within the same group
      if (intraGroupDelayMs > 0) await sleep(intraGroupDelayMs);

      // get_group_info: get the full group name
      const groupInfo = await withTimeout(
        this.client.get_group_info({ group_id: groupIdNum })
      );

      return {
        status: "success",
        groupName: groupInfo.group_name ?? null,
        groupUrl: contact.legacyUrl ?? null,
        groupPicUrl: contact.avatar ?? null,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : "unknown error";
      this.logger.warn({ groupId, error }, "failed to query group info");
      return {
        status: error.includes("timeout") ? "not_found" : "error",
        error,
      };
    }
  }
}

export const napcatService = new NapcatService();
