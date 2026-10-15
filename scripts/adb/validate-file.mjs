import fs from 'node:fs';
import path from 'node:path';
import { validateObservation, volumeFromName } from './validate.mjs';
const [productsFile, databaseFile, reportFile] = process.argv.slice(2);
if (!productsFile || !databaseFile || !reportFile) throw Error('사용법: node scripts/adb/validate-file.mjs products.json db-before.json validation.json');
const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
const db = JSON.parse(fs.readFileSync(databaseFile, 'utf8'));
const checks = products.map(p => validateObservation(p, db.liquor, db.liquor_price));
const anomalies = db.liquor.filter(l => volumeFromName(l.product_name || '') !== null && volumeFromName(l.product_name) !== l.volume_ml)
  .map(l => ({id:l.id,name:l.product_name,stored_volume:l.volume_ml,name_volume:volumeFromName(l.product_name)}));
const report = { checked_at:new Date().toISOString(), total:checks.length,
  eligible_for_detail_review:checks.filter(c=>c.identity_and_price_checks_passed).length,
  blocked:checks.filter(c=>!c.identity_and_price_checks_passed).length,
  database_volume_anomalies:anomalies, checks, database_writes:0 };
fs.mkdirSync(path.dirname(path.resolve(reportFile)),{recursive:true});
fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
console.log(JSON.stringify({total:report.total,eligible_for_detail_review:report.eligible_for_detail_review,blocked:report.blocked,database_volume_anomalies:anomalies.length,report:reportFile}));
