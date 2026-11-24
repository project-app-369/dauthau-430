// Native inline icons keep navigation crisp at every display density.
function icon(name){const paths={
 learn:'<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3z"/>',
 lessons:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 11h8M8 15h5"/>',
 flash:'<rect x="6" y="3" width="14" height="16" rx="3"/><path d="M3 7v11a4 4 0 0 0 4 4h10M13 7l-3 5h5l-3 5"/>',
 quiz:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M12 2v3M18 5l2-2"/>',
 progress:'<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
 install:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
 moon:'<path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>'
};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.learn)+'</svg>';}

const themeButton=document.getElementById('themeToggle');
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let themeBusy=false;
function syncThemeButton(){const dark=document.documentElement.dataset.theme==='dark';themeButton.innerHTML=icon(dark?'sun':'moon');themeButton.setAttribute('aria-label',dark?'Chuyển sang giao diện sáng':'Chuyển sang giao diện tối');themeButton.setAttribute('aria-pressed',String(dark));document.querySelector('meta[name="theme-color"]').content=dark?'#101820':'#edf5fc';}
async function switchTheme(event){if(themeBusy)return;const buttonRect=themeButton.getBoundingClientRect();const x=event.detail===0?buttonRect.left+buttonRect.width/2:event.clientX,y=event.detail===0?buttonRect.top+buttonRect.height/2:event.clientY;
const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
const apply=()=>{document.documentElement.dataset.theme=next;try{localStorage.setItem('dau-thau-theme',next);}catch{}syncThemeButton();};
if(!document.startViewTransition||motionPreference.matches){apply();return;}
themeBusy=true;
try{const transition=document.startViewTransition(apply);await transition.ready;const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));const animation=document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},{duration:650,easing:'cubic-bezier(.2,.7,.15,1)',pseudoElement:'::view-transition-new(root)',fill:'both'});await animation.finished;animation.cancel();await transition.finished;}catch{apply();}finally{themeBusy=false;}}
themeButton.addEventListener('click',switchTheme);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e=>{let stored;try{stored=localStorage.getItem('dau-thau-theme');}catch{}if(!stored){document.documentElement.dataset.theme=e.matches?'dark':'light';syncThemeButton();}});
syncThemeButton();

globalThis.courseIcon=icon;
