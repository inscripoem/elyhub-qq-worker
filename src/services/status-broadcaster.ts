import type { StatusResponse } from "../types/status";

type StatusSubscriber = (status: StatusResponse) => void;

class StatusBroadcaster {
  private readonly subs = new Set<StatusSubscriber>();

  subscribe(sub: StatusSubscriber): () => void {
    this.subs.add(sub);
    return () => this.subs.delete(sub);
  }

  notify(status: StatusResponse): void {
    for (const sub of this.subs) sub(status);
  }
}

export const statusBroadcaster = new StatusBroadcaster();
