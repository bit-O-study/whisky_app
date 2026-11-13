import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const dateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(date);

export async function hasTodayDailySuccess(file: string | undefined, now = new Date()): Promise<boolean> {
  if (!file) return false;
  let raw: string;
  try { raw = await readFile(file, 'utf8'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
  const receipt = JSON.parse(raw) as { completedAt?: string; runId?: string };
  if (!receipt.completedAt || !Number.isFinite(Date.parse(receipt.completedAt)) || !/^\d+$/.test(receipt.runId ?? '')) {
    throw new Error('Invalid daily success receipt');
  }
  return dateKey(new Date(receipt.completedAt)) === dateKey(now);
}

export async function recordDailySuccess(
  file: string | undefined,
  run: { fullRun: boolean; dryRun: boolean; updated: number; failures: number; runId: string },
  now = new Date(),
): Promise<boolean> {
  if (!file || !run.fullRun || run.dryRun || run.updated < 1 || run.failures !== 0) return false;
  if (!/^\d+$/.test(run.runId)) throw new Error('GitHub run ID required for daily success receipt');
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify({ completedAt: now.toISOString(), runId: run.runId, updated: run.updated }), { mode: 0o600 });
  await rename(temporary, file);
  return true;
}
