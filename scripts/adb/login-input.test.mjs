import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLoginPayload, textInputCommands, tapCommand } from './login-input.mjs';
test('login input rejects controls, Unicode and mismatched one-time key', () => {
  for (const password of ['x\ny', 'x\0y', '한글']) assert.throws(() => validateLoginPayload({ key_id: 'k', username: 'demo', password }, 'k'));
  assert.throws(() => validateLoginPayload({ key_id: 'wrong', username: 'demo', password: 'sample' }, 'k'));
});
test('shell metacharacters stay in quoted one-character arguments and percent-s stays literal', () => {
  const commands = textInputCommands("%s';$() ");
  assert.equal(commands[0], "input text '%'");
  assert.equal(commands[1], "input text 's'");
  assert.equal(commands[2], "input text ''\\''' ".trim());
  assert.equal(commands.at(-1), 'input keyevent 62');
  assert.equal(commands.length, 8);
});
test('invalid screen coordinates cannot become shell commands', () => {
  assert.throws(() => tapCommand({ box: ['1;exit', 2, 3, 4] }));
  assert.equal(tapCommand({ box: [0, 0, 100, 100] }), 'input tap 50 50');
});
