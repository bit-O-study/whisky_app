import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { hasTodayDailySuccess, recordDailySuccess } from '../dist/core/daily-receipt.js';

test('only a successful full write creates a receipt; Korea date controls reuse', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lotteon-receipt-'));
  const file = join(dir, 'success.json');
  const run = { fullRun: true, dryRun: false, updated: 100, failures: 0, runId: '123' };
  try {
    assert.equal(await hasTodayDailySuccess(file), false);
    for (const override of [{ fullRun: false }, { dryRun: true }, { updated: 0 }, { failures: 1 }]) {
      assert.equal(await recordDailySuccess(file, { ...run, ...override }), false);
    }
    assert.equal(await hasTodayDailySuccess(file), false);
    await recordDailySuccess(file, run, new Date('2026-11-12T23:00:00Z'));
    assert.equal(await hasTodayDailySuccess(file, new Date('2026-11-13T01:00:00Z')), true);
    assert.equal(await hasTodayDailySuccess(file, new Date('2026-11-13T15:00:00Z')), false);
    assert.equal(JSON.parse(await readFile(file, 'utf8')).runId, '123');
    await recordDailySuccess(file, { ...run, runId: '124' }, new Date('2026-11-13T15:00:00Z'));
    assert.equal(JSON.parse(await readFile(file, 'utf8')).runId, '124');
    await writeFile(file, '{"completedAt":"invalid","runId":"124"}');
    await assert.rejects(hasTodayDailySuccess(file), /Invalid daily success receipt/);
  } finally {
    await rm(file, { force: true });
    await rmdir(dir);
  }
});
