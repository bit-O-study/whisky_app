const money = value => /^\s*-?\s*[\d,]+\s*원?\s*$/.test(value || '') ? Number(value.replace(/[^\d]/g, '')) : NaN;

export function discountPrices(texts) {
  const start = texts.indexOf('상품금액'), end = texts.indexOf('최대할인가');
  if (start < 0 || end <= start) throw Error('discount_breakdown_missing');
  const original = money(texts[start + 1]), total = money(texts[end + 1]);
  let ordinary = 0, conditional = 0;
  const deductions = [];
  for (let i = start + 2; i < end; i += 2) {
    const label = texts[i], amount = money(texts[i + 1]);
    if (!Number.isSafeInteger(amount) || amount < 0) throw Error('discount_amount_invalid');
    if (label === '가격할인') ordinary += amount;
    else if (/신세계포인트|카드|쿠폰|회원/.test(label)) conditional += amount;
    else throw Error('discount_type_unknown');
    deductions.push({ label, amount });
  }
  if (![original, total].every(n => Number.isSafeInteger(n) && n > 0)
      || original - ordinary - conditional !== total) throw Error('discount_arithmetic_mismatch');
  return { original_price: original, standard_price: original - ordinary, conditional_price: total, deductions };
}

export function listedPrice(texts, discountTexts) {
  const at = texts.indexOf('판매가');
  const shown = money(texts[at + 1]);
  if (at < 0 || !Number.isSafeInteger(shown) || shown <= 0) throw Error('Missing product/price');
  if (texts.includes('최대할인가')) {
    const parsed = discountPrices(discountTexts || []);
    if (parsed.conditional_price !== shown) throw Error('discount_display_mismatch');
    return { ...parsed, displayed_price: parsed.standard_price, price_basis: 'STANDARD_BREAKDOWN' };
  }
  if (texts.some(t => /카드할인가|쿠폰가|회원가/.test(t))) throw Error('conditional_price_unresolved');
  const originalText = texts.find(t => /^정상가\s*[\d,]+원$/.test(t));
  const original = originalText ? Number(originalText.replace(/[^\d]/g,'')) : shown;
  if (original < shown) throw Error('original_price_below_sale');
  return { original_price: original, standard_price: shown, displayed_price: shown, price_basis: 'LISTED_SALE' };
}

export function pickupState(texts) {
  if(texts.some(t=>/판매종료/.test(t)))return 'discontinued';
  if(texts.some(t=>/품절|픽업불가/.test(t)))return 'unavailable';
  return texts.some(t=>/픽업가능/.test(t))?'available':'unknown';
}
