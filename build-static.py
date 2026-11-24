from pathlib import Path
import json,hashlib,shutil
r=Path(__file__).parent
dist=r/'dist'
dist.mkdir(exist_ok=True)
data={'questions':json.loads((r/'questions.json').read_text(encoding='utf8')),'topics':json.loads((r/'topics.json').read_text(encoding='utf8'))}
assert len(data['questions'])==430
html=(r/'template.html').read_text(encoding='utf8')
for marker,name in [('STYLE','fluent.css'),('THEME','theme.js'),('APP','app.js'),('PWA','pwa.js')]:
 html=html.replace('/*'+marker+'*/',(r/name).read_text(encoding='utf8'))
html=html.replace('/*CONTENT*/',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))
(dist/'index.html').write_text(html,encoding='utf8')
shutil.copytree(r/'pwa-static',dist,dirs_exist_ok=True)
version=hashlib.sha256(html.encode('utf8')+(r/'sw-template.js').read_bytes()+(r/'pwa-static'/'manifest.webmanifest').read_bytes()).hexdigest()[:16]
(dist/'sw.js').write_text((r/'sw-template.js').read_text(encoding='utf8').replace('__VERSION__',version),encoding='utf8')
(dist/'.nojekyll').touch()
(dist/'version.json').write_text(json.dumps({'name':'dauthau-430','title':'430 Câu ôn luyện Đấu thầu','version':version,'questions':430},ensure_ascii=False),encoding='utf8')
print('Built dauthau-430 PWA:',len(data['questions']),'questions; version',version)
