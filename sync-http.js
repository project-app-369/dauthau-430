/* Firestore HTTPS transport uses the same Firebase ID token and owner-only rules. */
(function(root){
 'use strict';
 const encode=value=>value===null?{nullValue:'NULL_VALUE'}:typeof value==='boolean'?{booleanValue:value}:typeof value==='string'?{stringValue:value}:typeof value==='number'?(Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value}):Array.isArray(value)?{arrayValue:{values:value.map(encode)}}:{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,encode(v)]))}};
 function decode(value){if('nullValue'in value)return null;if('booleanValue'in value)return value.booleanValue;if('stringValue'in value)return value.stringValue;if('integerValue'in value)return Number(value.integerValue);if('doubleValue'in value)return value.doubleValue;if('arrayValue'in value)return(value.arrayValue.values||[]).map(decode);if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,decode(v)]));throw Error('Unsupported Firestore value');}
 function create({projectId,getToken,getAppCheckToken,fetcher=(...args)=>fetch(...args),timeoutMs=12000}){
  const database='projects/'+projectId+'/databases/(default)',documents=database+'/documents',url='https://firestore.googleapis.com/v1/';
  async function request(owner,path,body){
   const controller=new AbortController();let timer;
   const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(Error('Firestore request timed out'),{code:'sync/timeout'}));},timeoutMs);});
   const work=async()=>{const token=await getToken(owner);const headers={Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})};if(getAppCheckToken){const attestation=await getAppCheckToken();if(!attestation)throw Object.assign(Error('Missing App Check token'),{code:'appcheck/no-token'});headers['X-Firebase-AppCheck']=attestation;}const response=await fetcher(url+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store',credentials:'omit'});const data=await response.json();if(!response.ok){const e=Error(data.error?.message||'Firestore HTTP '+response.status);e.code=data.error?.status?.toLowerCase().replaceAll('_','-')||'http-'+response.status;e.reason=data.error?.details?.find(d=>d.reason)?.reason||'';throw e;}return data;};
   try{return await Promise.race([work(),timeout]);}catch(e){if(e.name==='AbortError')throw Object.assign(Error('Firestore request timed out'),{code:'sync/timeout'});throw e;}finally{clearTimeout(timer);}
  }
  const collection=owner=>documents+'/users/'+encodeURIComponent(owner)+'/courses/dauthau-430/events';
  return{async read(owner){const events=[];let page='';do{const data=await request(owner,collection(owner)+'?pageSize=1000'+(page?'&pageToken='+encodeURIComponent(page):''));for(const d of data.documents||[]){const event=decode({mapValue:{fields:d.fields||{}}});if(event.id===d.name.split('/').pop())events.push(event);}page=data.nextPageToken||'';}while(page);return events;},async write(owner,events){return request(owner,documents+':commit',{writes:events.map(e=>({update:{name:collection(owner)+'/'+encodeURIComponent(e.id),fields:encode(e).mapValue.fields}}))});}};
 }
 root.CourseSyncHttp={encode,decode,create};
})(globalThis);
