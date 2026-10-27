// Operator inspection: no purchases, authentication input, or database mutations.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { device } from './device.mjs';
import { parseNodes, activeScreen, visible } from './winegrab-parser.mjs';
import { recoverExistingSession } from './detail-access.mjs';
const { adb, serial, run } = device();
const pause = ms => new Promise(r => setTimeout(r, ms));
const root = path.resolve('artifacts/adb/corrections-20261027');
fs.mkdirSync(root, {recursive:true});
const [mode='snapshot', value] = process.argv.slice(2);
const read = () => {
 const xml=run(['exec-out','uiautomator','dump','/dev/tty']);
 try{return activeScreen(xml).nodes.filter(n=>visible(n));}catch{return parseNodes(xml).filter(n=>visible(n));}
};
const tap = n => {
 if(!n)throw Error('node_not_found');
 const [a,b,c,d]=n.box;
 run(['shell','input','tap',String(Math.round((a+c)/2)),String(Math.round((b+d)/2))]);
};
if(mode==='reset') {
 run(['shell','am','force-stop','com.emart.today']);
 run(['shell','am','start','-a','android.intent.action.VIEW','-d',"'emart-today://open_main_webpage/?link=https://eapp.emart.com/webapp/wine/view/5000267190525?storeType=E'",'-p','com.emart.today']);
 await pause(4500);
} else if(mode==='open') {
 const latest=JSON.parse(fs.readFileSync('artifacts/adb/automation/latest.json','utf8'));
 const queue=JSON.parse(fs.readFileSync(path.join(latest.run_directory,'queue.json'),'utf8'));
 let url=value?.startsWith('https://eapp.emart.com/webapp/wine/view/')?value:queue.find(r=>r.id===Number(value))?.product_url;
 if(!url)throw Error('unknown_queue_id');
 for(let n=0;n<5&&new URL(url).hostname==='emart.kr';n++){
  const r=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});const l=r.headers.get('location');await r.body?.cancel();if(!l)throw Error('no_redirect');url=new URL(l,url).href;
 }
 let parsed=new URL(url);if(parsed.pathname==='/app/appLink.do')parsed=new URL(parsed.searchParams.get('link'),parsed.origin);
 if(parsed.hostname!=='eapp.emart.com'||!/^\/webapp\/wine\/view\/\d+$/.test(parsed.pathname))throw Error('unexpected_url');
 const safe=parsed.origin+parsed.pathname+'?storeType='+parsed.searchParams.get('storeType');
 console.log(JSON.stringify({queue_id:Number(value),resolved_url:safe}));
 run(['shell','input','keyevent','224']);
 run(['shell','am','start','-a','android.intent.action.VIEW','-d',"'emart-today://open_main_webpage/?link="+safe+"'",'-p','com.emart.today']);
 await pause(3500);
} else if(mode==='recover') {
 const nodes=read();await recoverExistingSession(nodes,{tap:async n=>{tap(n);await pause(3500);},capture:async()=>read(),reopen:async()=>{}});
} else if(mode==='tap') {
 if(/구매|장바구니|결제|주문|동의|로그인/.test(value))throw Error('prohibited_action');
 const nodes=read();const n=nodes.find(n=>(n.text===value||n['content-desc']===value)&&n.clickable==='true')||nodes.find(n=>n.text===value||n['content-desc']===value);
 tap(n);await pause(2000);
} else if(mode==='index') {
 const nodes=read();const n=nodes.find(n=>n.index===Number(value));
 if(!n||/구매|장바구니|결제|주문|동의|로그인/.test(n.text||n['content-desc']||''))throw Error('prohibited_action');tap(n);await pause(2000);
} else if(mode==='input') {
 if(!/^[a-zA-Z0-9 ]{1,60}$/.test(value))throw Error('search_ascii_only');
 const n=read().find(n=>n.class==='android.widget.EditText'&&n.password!=='true');
 if(!n)throw Error('search_field_missing');tap(n);run(['shell','input','text',value.replaceAll(' ','%s')]);run(['shell','input','keyevent','66']);await pause(2500);
} else if(mode==='back') {run(['shell','input','keyevent','4']);await pause(1000);}
else if(mode==='scroll') {run(['shell','input','swipe','420','1500','420','650','500']);await pause(800);}
else if(mode!=='snapshot') throw Error('unsupported_mode');
const nodes=read();
if(nodes.some(n=>n.password==='true'))throw Error('authentication_screen_no_capture');
const report=nodes.map(n=>({index:n.index,text:n.text,desc:n['content-desc'],class:n.class,clickable:n.clickable,selected:n.selected,box:n.box})).filter(n=>n.text||n.desc||n.class==='android.widget.EditText');
fs.writeFileSync(path.join(root,'screen.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(root,'screen.png'),execFileSync(adb,['-s',serial,'exec-out','screencap','-p'],{maxBuffer:24*1024*1024,timeout:25000,windowsHide:true}));
console.log(JSON.stringify(report));
