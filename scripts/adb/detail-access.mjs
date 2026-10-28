export function detailAccessIssue(texts) {
  return texts.some(text => /로그인\s*후\s*이용|로그인이\s*필요|로그인해\s*주세요/.test(text)) ? 'emart_login_required' : null;
}

const labels = rows => rows.map(n => n.text || n['content-desc'] || '');
const naverButton = rows => rows.find(n => n.clickable === 'true'
  && ['네이버', '네이버 로그인', '네이버로 로그인', '네이버로 시작하기'].includes(n.text || n['content-desc'] || ''));
const challenge = rows => rows.some(n => n['resource-id'] === 'pw' && n.password === 'true')
  || labels(rows).some(t => /인증번호|본인인증|동의하기|동의하고|보안문자/.test(t));

// Renew the existing Naver session through the app's provider selector only.
// Never fill credentials, submit a password form, or approve consent/challenges.
export async function recoverExistingSession(nodes, { tap, capture, reopen }) {
  if (challenge(nodes)) throw Error('emart_login_required');
  if (!detailAccessIssue(labels(nodes)) && !naverButton(nodes)) return nodes;
  let after = nodes;
  if (detailAccessIssue(labels(nodes))) {
    const button = nodes.find(n => n.text === '로그인하기' && n.clickable === 'true');
    if (!button) throw Error('emart_login_required');
    await tap(button);
    after = await capture();
  }
  if (challenge(after)) throw Error('emart_login_required');
  const provider = naverButton(after);
  if (provider) {
    await tap(provider);
    after = await capture();
  }
  if ((!provider && !after.some(n => n.text === '상품 정보'))
      || challenge(after) || detailAccessIssue(labels(after)) || naverButton(after)
      || after.some(n => n.class === 'android.widget.EditText' || n.password === 'true')) throw Error('emart_login_required');
  // The app may return to another product: always reopen the requested link.
  await reopen();
  const resumed = await capture();
  if (challenge(resumed) || detailAccessIssue(labels(resumed)) || !resumed.some(n => n.text === '상품 정보')
      || resumed.some(n => n.password === 'true')) throw Error('emart_login_required');
  return resumed;
}
