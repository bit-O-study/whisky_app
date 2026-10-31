import { test } from 'node:test';
import assert from 'node:assert/strict';
import { databaseBase } from './database.mjs';

test('only the internal whisky project is writable after cutover', () => {
  assert.equal(databaseBase('https://api.helthssu.co.kr/whisky/'), 'https://api.helthssu.co.kr/whisky');
  assert.equal(databaseBase('http://127.0.0.1:4200/whisky'), 'http://127.0.0.1:4200/whisky');
  for (const url of [undefined, 'https://jeqvxzkvumkiraclauvo.supabase.co',
    'https://api.helthssu.co.kr/health', 'https://api.helthssu.co.kr/whisky-other',
    'https://api.helthssu.co.kr.evil.test/whisky', 'http://api.helthssu.co.kr/whisky',
    'https://user@api.helthssu.co.kr/whisky', 'https://api.helthssu.co.kr/whisky?key=x',
    'https://api.helthssu.co.kr/whisky#x']) assert.throws(() => databaseBase(url), /wrong_database/);
});
