export function chunkArray<T>(items: T[], size = 100): T[][] {
  if (size <= 0) throw new Error("chunk size must be > 0");
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function runWithPool<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  maxConcurrency = 10
): Promise<R[]> {
  if (maxConcurrency <= 0) throw new Error("maxConcurrency must be > 0");
  if (items.length === 0) return [];

  const results = new Array<R>(items.length);
  let nextIdx = 0;

  const runWorker = async () => {
    while (true) {
      const idx = nextIdx++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  };

  const pool = Array.from(
    { length: Math.min(maxConcurrency, items.length) },
    runWorker
  );
  await Promise.all(pool);
  return results;
}
