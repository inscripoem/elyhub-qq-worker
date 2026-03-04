import { Cron } from "croner";

type Cancelable = { cancel: () => void };

export class Scheduler {
  private disposers = new Set<() => void>();

  every(
    ms: number,
    callback: () => void | Promise<void>,
    runImmediate = false
  ): Cancelable {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      try {
        await callback();
      } catch {
        // errors are caller's responsibility
      }
    };
    if (runImmediate) void run();
    const id = setInterval(() => void run(), ms);
    const cancel = () => {
      cancelled = true;
      clearInterval(id);
      this.disposers.delete(cancel);
    };
    this.disposers.add(cancel);
    return { cancel };
  }

  after(ms: number, callback: () => void | Promise<void>): Cancelable {
    let cancelled = false;
    const id = setTimeout(async () => {
      if (!cancelled) await callback();
      this.disposers.delete(cancel);
    }, ms);
    const cancel = () => {
      cancelled = true;
      clearTimeout(id);
      this.disposers.delete(cancel);
    };
    this.disposers.add(cancel);
    return { cancel };
  }

  cron(expression: string, callback: () => void | Promise<void>): Cancelable {
    const job = new Cron(expression, () => void callback());
    const cancel = () => {
      job.stop();
      this.disposers.delete(cancel);
    };
    this.disposers.add(cancel);
    return { cancel };
  }

  clearAll(): void {
    for (const cancel of [...this.disposers]) cancel();
    this.disposers.clear();
  }
}
