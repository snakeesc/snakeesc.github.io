const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../game-js/06-leaderboard.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function boot({ storage = new Map(), online = true, platform = 'android', fetch, failWrites = false } = {}) {
  const listeners = {}, intervals = [], timers = new Map(), status = {textContent:'',hidden:false};
  let seq = 0;
  const node = () => ({style:{},classList:{add(){}},appendChild(){},addEventListener(){}});
  const doc = { body:node(), visibilityState:'visible', createElement:node,
    getElementById(){return null;}, querySelectorAll(){return [status];},
    addEventListener(type, fn){(listeners[type] ||= []).push(fn);} };
  const win = { Capacitor:{getPlatform:()=>platform}, crypto:{randomUUID:()=>`id-${++seq}`},
    addEventListener:doc.addEventListener, dispatchEvent(e){for(const fn of listeners[e.type] || [])fn(e);} };
  const context = vm.createContext({ window:win, document:doc,
    navigator:{onLine:online,userAgent:platform==='android'?'Android':'Desktop'},
    localStorage:{getItem:k=>storage.get(k)??null,setItem(k,v){if(failWrites)throw Error('quota');storage.set(k,String(v));}},
    fetch:fetch || (async()=>{throw Error('offline');}), AbortController,
    CustomEvent:class {constructor(type, options){this.type=type;this.detail=options?.detail;}},
    setTimeout(fn,ms){const id=++seq;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},
    setInterval(fn){intervals.push(fn);},console:{warn(){},error(){}} });
  vm.runInContext(source, context);
  return {api:win.FrogGameLeaderboard, storage, context, intervals, status,
    fire(type){for(const fn of listeners[type] || [])fn();},
    timeout(){for(const {fn} of [...timers.values()])fn();} };
}
const response = (data, status=200) => ({ok:status>=200&&status<300,status,json:async()=>data});
function server() {
  let best=null;const posts=[];
  return {posts,fetch:async(url,opt)=>{
    assert(url.includes('platform=android'));
    if(opt.method==='POST'){
      const p=JSON.parse(opt.body);posts.push(p);
      if(!best || p.score>best.score || (p.score===best.score && p.time>best.time)) best={...p,userId:p.clientId};
      if(p.tag) best.tag=p.tag;
    }
    return response({entries:best?[best]:[],myEntry:best});
  }};
}
const cases=[];const test=(name,fn)=>cases.push([name,fn]);
test('confirmed board and identity survive cold offline restart',async()=>{
  const a=boot({fetch:async()=>response({entries:[{userId:'u',score:420,time:60,tag:'Player'}],myEntry:{userId:'u',score:420,time:60,tag:'Player'}})});
  await a.api.fetchLeaderboard();
  const b=boot({storage:a.storage,online:false});
  assert.equal((await b.api.fetchLeaderboard())[0].score,420);
  assert.equal(b.api._lastMyEntry.userId,'u');assert(b.api.getStatusText().includes('last updated'));
});
test('offline first launch gives honest empty-cache message',async()=>{
  const a=boot({online:false});assert.equal((await a.api.fetchLeaderboard()).length,0);
  assert(a.api.getStatusText().includes('Connect once'));
});
test('best score, tie time and matching run stats persist; lower run never replaces them',async()=>{
  const a=boot({online:false});
  await a.api.submitScoreToServer(400,30,{orbs:4},'Frogger');
  await a.api.submitScoreToServer(200,100,{orbs:2},'Frogger');
  await a.api.submitScoreToServer(400,40,{orbs:9},'Frogger');
  const remote=server();const b=boot({storage:a.storage,fetch:remote.fetch});
  await b.api.fetchLeaderboard();
  assert.equal(remote.posts.length,1);assert.equal(remote.posts[0].score,400);
  assert.equal(remote.posts[0].time,40);assert.equal(remote.posts[0].stats.orbs,9);
  assert.equal(b.api.getSyncStatus().pending,false);
  const c=boot({storage:b.storage,fetch:remote.fetch});await c.api.fetchLeaderboard();assert.equal(remote.posts.length,1);
});
test('score is saved before POST and failed requests retain it',async()=>{
  let a; a=boot({fetch:async()=>{assert([...a.storage.keys()].some(k=>k.endsWith('_pending')));throw Error('no connection');}});
  const r=await a.api.submitScoreToServer(99,10,{orbs:3});assert(r._queued);assert(a.api.getSyncStatus().pending);
  assert(boot({storage:a.storage,online:false}).api.getSyncStatus().pending);
});
test('online, resume and foreground timer retry automatically',async()=>{
  for(const trigger of ['online','visibilitychange','resume','focus','timer']){
    const remote=server(),a=boot({online:false,fetch:remote.fetch});a.api.initLeaderboard();
    await a.api.submitScoreToServer(77,20);a.context.navigator.onLine=true;
    if(trigger==='timer')a.intervals[0]();else a.fire(trigger);
    await tick();await tick();assert.equal(remote.posts.length,1,trigger);assert(!a.api.getSyncStatus().pending);
  }
});
test('new high score arriving during upload is also sent, with no parallel uploads',async()=>{
  let release;let active=0,max=0;const scores=[];
  const a=boot({fetch:async(url,opt)=>{
    active++;max=Math.max(max,active);const p=JSON.parse(opt.body);scores.push(p.score);
    if(scores.length===1)await new Promise(r=>release=r);
    active--;return response({entries:[p],myEntry:p});
  }});
  const p1=a.api.submitScoreToServer(10,5);await tick();const p2=a.api.submitScoreToServer(20,6);
  release();await Promise.all([p1,p2]);assert.deepEqual(scores,[10,20]);assert.equal(max,1);assert(!a.api.getSyncStatus().pending);
});
test('server 500, invalid JSON, timeout, malformed success, and unconfirmed score keep best queued',async()=>{
  const failures=[async()=>response({},500),async()=>({ok:true,status:200,json:async()=>{throw Error('json');}}),
    async()=>response({entries:[]}),async()=>response({entries:[],myEntry:{score:1,time:0}}),async()=>new Promise(()=>{})];
  for(let i=0;i<failures.length;i++){
    const a=boot({fetch:failures[i]});const result=a.api.submitScoreToServer(99,10);
    if(i===failures.length-1){await tick();a.timeout();}
    await result;assert(a.api.getSyncStatus().pending,`failure ${i}`);
  }
});
test('failed GET does not erase cached board; valid empty GET does replace it',async()=>{
  let mode='good';const a=boot({fetch:async()=>mode==='bad'?response({},503):response({entries:mode==='empty'?[]:[{score:99,time:20}]})});
  await a.api.fetchLeaderboard();mode='bad';assert.equal((await a.api.fetchLeaderboard())[0].score,99);
  mode='empty';assert.equal((await a.api.fetchLeaderboard()).length,0);assert.equal(a.api.getSyncStatus().hasCache,true);
});
test('tag conflict preserves score and retries without the conflicting rename',async()=>{
  let first=true;const posts=[];const a=boot({fetch:async(u,o)=>{const p=JSON.parse(o.body);posts.push(p);
    if(first){first=false;return response({error:'tag_taken'},409);}return response({entries:[p],myEntry:p});}});
  const r=await a.api.submitScoreToServer(123,45,null,'Taken');assert.equal(r.error,'tag_taken');
  await a.api.syncPendingScores();assert.equal(posts[1].score,123);assert.equal(posts[1].tag,undefined);assert(!a.api.getSyncStatus().pending);
});
test('Android queue/cache are isolated from web and other player IDs',async()=>{
  const a=boot({online:false});await a.api.submitScoreToServer(44,4);
  const b=boot({storage:a.storage,online:false,platform:'web'});assert(!b.api.getSyncStatus().pending);
  a.storage.set('frogSnake_playerId','different-player');const c=boot({storage:a.storage,online:false});assert(!c.api.getSyncStatus().pending);
});
test('storage failure never claims durable offline save; corrupt saved data does not crash',async()=>{
  const a=boot({online:false,failWrites:true});await a.api.submitScoreToServer(10,10);
  assert(a.api.getStatusText().includes('Unable to save'));
  const b=boot({online:false});await b.api.submitScoreToServer(12,1);
  for(const k of b.storage.keys())if(k.endsWith('_pending')||k.endsWith('_snapshot'))b.storage.set(k,'{broken');
  const c=boot({storage:b.storage,online:false});assert(!c.api.getSyncStatus().pending);await c.api.fetchLeaderboard();
});
(async()=>{for(const [name,fn] of cases){await fn();console.log('PASS',name);}console.log(`${cases.length} offline behavior tests passed`);})().catch(e=>{console.error(e);process.exitCode=1;});
