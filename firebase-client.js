(function(){
 'use strict';
 const config={apiKey:'AIzaSyCkC49tuwJNpuz242O_qL_HP_B1QtvgWyM',authDomain:'dauthau-430.firebaseapp.com',projectId:'dauthau-430',storageBucket:'dauthau-430.firebasestorage.app',messagingSenderId:'872139121059',appId:'1:872139121059:web:d6147288fb0f502a8e7a16',measurementId:'G-HXKBBN7H4T'};
 const M=window.CourseSyncModel,host=window.CourseState,base=host.key;
 const el=id=>document.getElementById(id),copy=M.clone;
 const person='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>';
 let sdk,auth,db,http,loading,user=null,account=null,stop=null,baseline=host.read(),events=new Map(),outbox=[],ready=false,busy=false,replace=false,epoch=0,retryTimer,status='Đăng nhập để đồng bộ',error='',guest=null;
 let connectTimer,pollTimer,pollNow=null,transport='realtime',lastCloudAt=null,lastError=null;
 const client=crypto.randomUUID(),clock=M.clock(client);
 function message(err){
  const code=String(err?.code||''),reason=err?.reason||'';
  if(/configuration-not-found|operation-not-allowed/.test(code))return 'Firebase chưa bật đăng nhập Google. Vui lòng bật Authentication trong Firebase Console.';
  if(/unauthorized-domain/.test(code))return 'Tên miền này chưa được thêm vào Authorized domains trong Firebase Authentication.';
  if(reason==='SERVICE_DISABLED')return 'Cloud Firestore API chưa bật. Hãy tạo database (default) và bật API trong Firebase Console.';
  if(/permission-denied/.test(code))return 'Firestore từ chối truy cập. Hãy kiểm tra rules trên database (default), trạng thái API và App Check.';
  if(/unauthenticated|user-token-expired|invalid-user-token/.test(code))return 'Phiên đăng nhập cần được xác nhận lại. Hãy đăng xuất và đăng nhập Google lại.';
  if(/not-found|failed-precondition/.test(code))return 'Không truy cập được database Firestore (default). Hãy kiểm tra tên database và trạng thái dịch vụ.';
  if(/popup-blocked/.test(code))return 'Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép popup và thử lại.';
  if(/timeout/.test(code))return 'Kết nối Firestore quá thời gian chờ. Tiến độ vẫn lưu trên máy; app sẽ tự thử lại.';
  if(/network|unavailable/.test(code)||!navigator.onLine)return 'Chưa kết nối Firebase. Tiến độ được giữ trên thiết bị và sẽ thử đồng bộ lại.';
  if(err?.name==='QuotaExceededError')return 'Bộ nhớ trình duyệt đã đầy. Hãy xuất JSON để giữ bản sao tiến độ.';
  return 'Chưa kết nối được Firebase. Tiến độ vẫn lưu trên máy. '+(code?'('+code+')':'');
 }
 function diagnostics(){return{projectId:config.projectId,database:'(default)',authenticated:!!auth?.currentUser,online:navigator.onLine,transport,pending:outbox.length,lastCloudAt,error:lastError?{code:lastError.code||lastError.name||'unknown',reason:lastError.reason||''}:null};}
 function report(err){lastError=err;ui('Chưa đồng bộ',message(err));}
 function synced(){ui(!navigator.onLine?'Ngoại tuyến · đã lưu trên máy':outbox.length?'Đang đồng bộ…':'Đã đồng bộ');}
 function ui(text,err=''){status=text;error=err;if(!err)lastError=null;el('accountName').textContent=user?.displayName||user?.email||'Đăng nhập';el('accountStatus').textContent=status;el('accountButton').setAttribute('aria-label',user?'Hồ sơ '+(user.displayName||user.email)+'. '+status:'Đăng nhập và đồng bộ tiến độ');el('accountAvatar').innerHTML=person;if(user?.photoURL){try{const url=new URL(user.photoURL);if(url.protocol==='https:'){const img=document.createElement('img');img.src=url.href;img.alt='';img.referrerPolicy='no-referrer';img.onerror=()=>{el('accountAvatar').innerHTML=person;};el('accountAvatar').replaceChildren(img);}}catch{}}el('profileName').textContent=user?.displayName||'Học trên mọi thiết bị';el('profileEmail').textContent=user?.email||'Đăng nhập Google để tự động đồng bộ tiến độ học, flashcard và lịch sử ôn luyện.';el('profileStatus').textContent=error||status;el('profileStatus').classList.toggle('sync-error',!!error);el('googleLogin').hidden=!!user;el('logoutAccount').hidden=!user;el('retrySync').hidden=!user||(ready&&!error);el('syncFallbackNote').hidden=!account||transport!=='https';el('syncDiagnostic').textContent=JSON.stringify(diagnostics(),null,2);}
 const pendingKey=(uid,id)=>base+':pending:'+uid+':'+id;
 function readPending(uid){const found=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith(base+':pending:'+uid+':')){try{const e=JSON.parse(localStorage.getItem(key));if(M.valid(e))found.push(e);}catch{}}}return found;}
 function persist(){if(account)for(const e of outbox)localStorage.setItem(pendingKey(account,e.id),JSON.stringify(e));}
 function make(change,kind='edit'){const attempts=change.attempts||[];const result=[];for(let i=0;i<Math.max(1,Math.ceil(attempts.length/20));i++){const e={version:1,id:crypto.randomUUID(),stamp:clock.next(),kind:i===0?kind:'edit',items:i===0?change.items:{},attempts:attempts.slice(i*20,i*20+20)};if(e.kind==='reset'||Object.keys(e.items).length||e.attempts.length){if(!M.valid(e))throw Error('Invalid sync event');result.push(e);}}return result;}
 function capture(state){if(!account){baseline=copy(state);replace=false;return;}const before=replace?host.fresh():baseline,delta=M.diff(before,state),ops=make(delta,replace?'reset':'edit');if(ops.length){for(const e of ops)localStorage.setItem(pendingKey(account,e.id),JSON.stringify(e));outbox.push(...ops);for(const e of ops)events.set(e.id,e);if(lastError)ui('Chưa đồng bộ',message(lastError));else ui(!navigator.onLine?'Ngoại tuyến · đã lưu trên máy':ready?'Đang đồng bộ…':'Đã lưu trên máy · chờ kết nối');schedule();}replace=false;baseline=copy(state);}
 function apply(){const state=M.materialize(events.values());baseline={...host.read(),items:state.items,attempts:state.attempts};host.apply(state.items,state.attempts);}
 function schedule(){clearTimeout(retryTimer);retryTimer=setTimeout(flush,300);}
 async function flush(){
  if(!account||!auth?.currentUser||auth.currentUser.uid!==account||!ready||busy||!navigator.onLine||!outbox.length)return;
  const run=epoch,owner=account;busy=true;
  try{
   while(outbox.length&&epoch===run){
    const batch=outbox.slice(0,50);
    // HTTPS commits are bounded; stable IDs and identical events make retries idempotent.
    await http.write(owner,batch);
    if(epoch!==run)return;
    const sent=new Set(batch.map(e=>e.id));for(const id of sent)localStorage.removeItem(pendingKey(owner,id));outbox=outbox.filter(e=>!sent.has(e.id));
   }
   if(epoch===run){lastCloudAt=new Date().toISOString();synced();}
  }catch(err){if(epoch===run){report(err);clearTimeout(retryTimer);retryTimer=setTimeout(flush,15000);}}
  finally{if(epoch===run)busy=false;}
 }
 function cachedProfile(){try{const v=JSON.parse(localStorage.getItem(base+':account'));if(v&&/^[\w-]{1,128}$/.test(v.uid))return v;}catch{}return null;}
 function switchScope(uid){account=uid;baseline=host.scope(uid?base+':user:'+uid:base);events=new Map();outbox=uid?readPending(uid):[];replace=false;for(const e of outbox){events.set(e.id,e);clock.observe(e.stamp);}}
 async function changed(next){
  const run=++epoch;stop?.();stop=null;ready=false;busy=false;transport='realtime';lastCloudAt=null;lastError=null;pollNow=null;
  clearTimeout(retryTimer);clearTimeout(connectTimer);clearTimeout(pollTimer);
  const previous=account;user=next;
  if(!next){localStorage.removeItem(base+':account');switchScope(null);ui('Đăng nhập để đồng bộ');return;}
  const owner=next.uid,adoptionKey=base+':guest-adoption:'+owner,importedKey=base+':guest-imported:'+owner;
  guest=null;let guestSource=null;
  if(!previous){
   guestSource=host.read();let imported=host.fresh();try{const saved=JSON.parse(localStorage.getItem(importedKey));if(host.valid(saved))imported=saved;}catch{}
   guest={...host.fresh(),...M.guestDelta(imported,guestSource)};localStorage.setItem(adoptionKey,JSON.stringify({state:guest,source:guestSource}));
  }else{try{const saved=JSON.parse(localStorage.getItem(adoptionKey));if(host.valid(saved?.state)&&host.valid(saved?.source)){guest=saved.state;guestSource=saved.source;}}catch{}}
  if(previous!==owner)switchScope(owner);
  if(guest){const provisional=M.adopt(baseline,guest);baseline={...baseline,...provisional};host.apply(provisional.items,provisional.attempts);}
  localStorage.setItem(base+':account',JSON.stringify({uid:owner,displayName:next.displayName,email:next.email,photoURL:next.photoURL}));
  ui(navigator.onLine?'Đang kết nối…':'Ngoại tuyến · đã lưu trên máy');
  let initial=true,polling=false;
  function receive(list){
   if(epoch!==run)return;
   for(const e of list)if(M.valid(e)){events.set(e.id,e);clock.observe(e.stamp);}
   for(const e of outbox)events.set(e.id,e);
   if(initial){
    if(!events.size&&(Object.keys(baseline.items).length||baseline.attempts.length)){const ops=make(M.diff(host.fresh(),baseline));outbox.push(...ops);for(const e of ops)events.set(e.id,e);}
    if(guest){const current=M.materialize(events.values()),merged=M.adopt(current,guest),ops=make(M.diff(current,merged));outbox.push(...ops);for(const e of ops)events.set(e.id,e);}
    persist();if(guestSource)localStorage.setItem(importedKey,JSON.stringify(guestSource));guest=null;localStorage.removeItem(adoptionKey);initial=false;
   }
   ready=true;lastCloudAt=new Date().toISOString();apply();synced();schedule();
  }
  async function poll(){
   if(epoch!==run||transport!=='https'||polling)return;
   clearTimeout(pollTimer);
   if(!navigator.onLine||document.hidden&&ready){pollTimer=setTimeout(poll,15000);return;}
   polling=true;
   try{const list=await http.read(owner);if(epoch===run)receive(list);}
   catch(err){if(epoch===run&&transport==='https')report(err);}
   finally{polling=false;if(epoch===run&&transport==='https')pollTimer=setTimeout(poll,15000);}
  }
  function fallback(){if(epoch!==run)return;transport='https';ui('Đang kiểm tra kết nối…');poll();}
  pollNow=()=>{if(transport==='https')poll();};
  connectTimer=setTimeout(fallback,8000);
  try{
   const ref=sdk.collection(db,'users',owner,'courses','dauthau-430','events');
   stop=sdk.onSnapshot(ref,{includeMetadataChanges:true},snap=>{
    if(epoch!==run)return;
    if(snap.metadata.fromCache){if(ready){clearTimeout(connectTimer);connectTimer=setTimeout(fallback,8000);}return;}
    try{clearTimeout(connectTimer);clearTimeout(pollTimer);transport='realtime';receive(snap.docs.map(d=>{const e=d.data();return e.id===d.id?e:null;}));}
    catch(err){report(err);}
   },()=>{if(epoch===run){clearTimeout(connectTimer);fallback();}});
  }catch{fallback();}
 }
 async function load(){if(loading)return loading;if(sdk)return;loading=(async()=>{const version='13.2.0',url='https://www.gstatic.com/firebasejs/'+version+'/';const [app,a,f]=await Promise.all([import(url+'firebase-app.js'),import(url+'firebase-auth.js'),import(url+'firebase-firestore.js')]);sdk={...a,...f};const instance=app.initializeApp(config);auth=a.getAuth(instance);db=f.initializeFirestore(instance,{localCache:f.memoryLocalCache(),experimentalForceLongPolling:true,experimentalLongPollingOptions:{timeoutSeconds:5}});http=window.CourseSyncHttp.create({projectId:config.projectId,getToken:async owner=>{if(auth.currentUser?.uid!==owner)throw Object.assign(Error('Account changed'),{code:'unauthenticated'});return a.getIdToken(auth.currentUser);}});await a.setPersistence(auth,a.browserLocalPersistence);a.onAuthStateChanged(auth,n=>{changed(n).catch(err=>ui('Chưa đồng bộ',message(err)));},err=>ui('Chưa kết nối',message(err)));})();try{await loading;}catch(err){sdk=null;loading=null;ui('Chưa kết nối',message(err));throw err;}}
 window.CourseSync={capture,replace(){replace=true;},diagnostics};
 el('accountButton').onclick=()=>el('accountDialog').showModal();el('closeAccount').onclick=()=>el('accountDialog').close();
 el('googleLogin').onclick=async()=>{const button=el('googleLogin');button.disabled=true;try{await load();const provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await sdk.signInWithPopup(auth,provider);}catch(err){if(!/popup-closed-by-user|cancelled-popup-request/.test(err.code||''))ui('Chưa đăng nhập',message(err));}finally{button.disabled=false;}};
 el('logoutAccount').onclick=async()=>{if(!auth){ui('Chưa kết nối','Cần kết nối mạng để đăng xuất Firebase.');return;}el('logoutAccount').disabled=true;try{await sdk.signOut(auth);el('accountDialog').close();}catch(err){ui('Chưa đăng xuất',message(err));}finally{el('logoutAccount').disabled=false;}};
 el('retrySync').onclick=async()=>{try{await load();if(auth.currentUser)await changed(auth.currentUser);else ui('Đăng nhập để đồng bộ');}catch{}};
 addEventListener('online',()=>{if(sdk&&auth.currentUser){if(ready){flush();pollNow?.();}else changed(auth.currentUser).catch(err=>ui('Chưa đồng bộ',message(err)));}else load().catch(()=>{});});
 addEventListener('offline',()=>{if(account)ui('Ngoại tuyến · đã lưu trên máy');});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&account){pollNow?.();flush();}});
 addEventListener('storage',e=>{if(e.key===base+':account'&&!e.newValue&&account){/* Auth listener also signs out; hide cached account immediately. */user=null;epoch++;stop?.();stop=null;ready=false;busy=false;clearTimeout(connectTimer);clearTimeout(pollTimer);switchScope(null);ui('Đăng nhập để đồng bộ');}else if(account&&e.key?.startsWith(base+':pending:'+account+':')){outbox=readPending(account);for(const op of outbox){events.set(op.id,op);clock.observe(op.stamp);}if(ready){apply();schedule();}}});
 const cached=cachedProfile();if(cached){user=cached;switchScope(cached.uid);ui(navigator.onLine?'Đang khôi phục đăng nhập…':'Ngoại tuyến · đã lưu trên máy');}else ui('Đăng nhập để đồng bộ');if(navigator.onLine)load().catch(()=>{});
})();
