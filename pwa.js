const installButton=document.getElementById('installApp');
const installHelp=document.getElementById('installHelp');
let installRequest=null;
function standalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}
function syncInstall(){installButton.hidden=standalone();installButton.innerHTML=icon('install');installButton.setAttribute('aria-label','Cài đặt Đấu Thầu 430 câu');installButton.title='Cài đặt ứng dụng';}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installRequest=event;syncInstall();});
window.addEventListener('appinstalled',()=>{installRequest=null;installButton.hidden=true;toast('Đã cài đặt Đấu Thầu 430 câu.');});
matchMedia('(display-mode: standalone)').addEventListener('change',syncInstall);
installButton.addEventListener('click',async()=>{if(installRequest){const request=installRequest;installRequest=null;try{await request.prompt();await request.userChoice;}catch{installHelp.showModal();}syncInstall();}else installHelp.showModal();});
document.getElementById('closeInstallHelp').addEventListener('click',()=>installHelp.close());
syncInstall();
function connectionStatus(){const status=document.getElementById('connectionStatus');status.hidden=navigator.onLine;status.textContent='Ngoại tuyến · tiếp tục học câu hỏi đã lưu. PDF và liên kết luật cần kết nối mạng.';}
window.addEventListener('online',connectionStatus);window.addEventListener('offline',connectionStatus);connectionStatus();
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
 window.addEventListener('load',()=>{navigator.serviceWorker.register(new URL('./sw.js',document.baseURI),{scope:'./'}).catch(()=>{document.getElementById('offlineStatus').textContent='Trình duyệt chưa bật được chế độ ngoại tuyến. Bạn vẫn có thể học trực tuyến.';});});
}
