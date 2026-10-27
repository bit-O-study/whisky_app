export function detailAccessIssue(texts) {
  return texts.some(text => /로그인\s*후\s*이용|로그인이\s*필요|로그인해\s*주세요/.test(text)) ? 'emart_login_required' : null;
}
