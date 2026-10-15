// Strict identity matching for reviewed ADB observations. No fuzzy substitution.
export function volumeFromName(name) {
  const found = [...name.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(ml|l)\b/gi)];
  if (found.length !== 1) return null;
  return Number(found[0][1].replaceAll(',', '')) * (found[0][2].toLowerCase() === 'l' ? 1000 : 1);
}
export function identityName(name) {
  return name.normalize('NFKC').toLowerCase()
    .replace(/\d[\d,]*(?:\.\d+)?\s*(ml|l)\b/g, '')
    .replace(/[\s()[\]{}]/g, '');
}
export function validateObservation(product, liquors, prices, now = Date.now()) {
  const reasons = [];
  if (!['EMART', 'TRADERS'].includes(product.source) || product.channel !== 'WINEGRAB_APP') reasons.push('unsupported_source');
  if (product.price_kind !== 'DISPLAYED_SALE' || product.conditions?.length) reasons.push('conditional_price');
  if (!Number.isSafeInteger(product.displayed_price) || product.displayed_price <= 0) reasons.push('invalid_price');
  const age = now - Date.parse(product.observed_at);
  if (!Number.isFinite(age) || age < -60000 || age > 24 * 60 * 60 * 1000) reasons.push('stale_observation');
  if (!product.volume_ml || volumeFromName(product.name) !== product.volume_ml) reasons.push('observation_volume_mismatch');
  const matches = liquors.filter(row => identityName(row.product_name || '') === identityName(product.name)
    && row.volume_ml === product.volume_ml);
  if (matches.length !== 1) reasons.push(matches.length ? 'ambiguous_identity' : 'no_exact_identity');
  const match = matches.length === 1 ? matches[0] : null;
  if (match && volumeFromName(match.product_name) !== match.volume_ml) reasons.push('database_volume_mismatch');
  const existing = match ? prices.filter(row => row.liquor_id === match.id && row.source === product.source) : [];
  if (existing.length > 1) reasons.push('duplicate_vendor_price');
  const old = existing[0];
  if (old?.current_price > 0 && Math.abs(product.displayed_price / old.current_price - 1) > .4) reasons.push('large_price_change');
  return { key: product.key, name: product.name, source: product.source,
    liquor_id: match?.id ?? null, previous_price: old?.current_price ?? null,
    displayed_price: product.displayed_price, reasons,
    identity_and_price_checks_passed: reasons.length === 0,
    // A second on-device check must verify details/conditions before publishing.
    requires_detail_review: true };
}
