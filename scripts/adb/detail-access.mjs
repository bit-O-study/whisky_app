export function detailAccessIssue(texts) {
  return texts.some(text => /로그인\s*후\s*이용|로그인이\s*필요|로그인해\s*주세요/.test(text)) ? 'emart_login_required' : null;
}

// Renew an existing app session once. Never fill credentials or approve OAuth.
export async function recoverExistingSession(nodes, { tap, capture, reopen }) {
  const labels = rows => rows.map(n => n.text || n['content-desc'] || '');
  if (!detailAccessIssue(labels(nodes))) return nodes;
  const button = nodes.find(n => n.text === '로그인하기' && n.clickable === 'true');
  if (!button) throw Error('emart_login_required');
  await tap(button);
  const after = await capture();
  if (detailAccessIssue(labels(after)) || !after.some(n => n.text === '상품 정보')
      || after.some(n => n.class === 'android.widget.EditText' || n.password === 'true')
      || labels(after).some(t => /인증번호|본인인증|동의하기|동의하고|보안문자/.test(t))) throw Error('emart_login_required');
  // The app may return to another product: always reopen the requested link.
  await reopen();
  const resumed = await capture();
  if (detailAccessIssue(labels(resumed))) throw Error('emart_login_required');
  return resumed;
}
