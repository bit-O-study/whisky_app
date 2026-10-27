export function validateLoginPayload(payload, keyId) {
  if (!payload || payload.key_id !== keyId) throw Error('invalid_login_payload');
  for (const field of ['username', 'password']) {
    if (typeof payload[field] !== 'string' || !/^[\x20-\x7e]{1,128}$/.test(payload[field])) throw Error('unsupported_login_characters');
  }
  return { username: payload.username, password: payload.password };
}
const quote = text => "'" + text.replaceAll("'", "'\\''") + "'";
export function textInputCommands(text) {
  // Separate characters preserve literal %s and prevent shell interpolation.
  return [...text].map(char => char === ' ' ? 'input keyevent 62' : 'input text ' + quote(char));
}
export function tapCommand(node) {
  const [x1, y1, x2, y2] = node.box;
  if (![x1, y1, x2, y2].every(Number.isSafeInteger) || x2 <= x1 || y2 <= y1 || x1 < 0 || y1 < 0) throw Error('invalid_login_bounds');
  return `input tap ${Math.round((x1 + x2) / 2)} ${Math.round((y1 + y2) / 2)}`;
}
export function fieldCommands(node, text) {
  return [tapCommand(node), 'input keyevent 123', ...Array.from({ length: Math.min(128, (node.text || '').length + 2) }, () => 'input keyevent 67'), ...textInputCommands(text)];
}
