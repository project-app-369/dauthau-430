from pathlib import Path
import json,hashlib,shutil,os,argparse,html as h
from urllib.parse import urljoin,urlparse
r=Path(__file__).parent
args=argparse.ArgumentParser()
args.add_argument('--site-url',default=os.environ.get('PUBLIC_SITE_URL'))
args.add_argument('--portable',action='store_true')
args.add_argument('--out-dir')
options=args.parse_args()
meta=json.loads((r/'app-metadata.json').read_text(encoding='utf8'))
base='' if options.portable else (options.site_url or meta['sites_url']).rstrip('/')+'/'
if base and urlparse(base).scheme!='https':raise ValueError('Publication URL must use HTTPS')
dist=Path(options.out_dir).resolve() if options.out_dir else r/'dist'
dist.mkdir(exist_ok=True,parents=True)
if dist!=r/'dist':
 for asset in list((r/'dist').glob('*.pdf'))+list((r/'dist').glob('bai-giang.html')):shutil.copy2(asset,dist/asset.name)
data={'questions':json.loads((r/'questions.json').read_text(encoding='utf8')),'topics':json.loads((r/'topics.json').read_text(encoding='utf8'))}
assert len(data['questions'])==430
html=(r/'template.html').read_text(encoding='utf8')
def tag(name,value,prop=False):return '<meta '+('property' if prop else 'name')+'="'+name+'" content="'+h.escape(value,quote=True)+'">'
image=urljoin(base,'icons/social-card.png') if base else './icons/social-card.png'
metadata=[tag('application-name',meta['short_name']),tag('description',meta['description']),tag('robots','index,follow'),tag('apple-mobile-web-app-capable','yes'),tag('apple-mobile-web-app-title',meta['short_name']),tag('apple-mobile-web-app-status-bar-style','default'),tag('mobile-web-app-capable','yes'),tag('msapplication-TileColor','#0067c0'),tag('og:title',meta['name'],True),tag('og:description',meta['description'],True),tag('og:site_name',meta['short_name'],True),tag('og:type','website',True),tag('og:locale',meta['locale'],True),tag('og:image',image,True),tag('og:image:width','1200',True),tag('og:image:height','630',True),tag('og:image:type','image/png',True),tag('og:image:alt',meta['name'],True),tag('twitter:card','summary_large_image'),tag('twitter:title',meta['name']),tag('twitter:description',meta['description']),tag('twitter:image',image)]
if base:metadata+=[tag('og:url',base,True),'<link rel="canonical" href="'+h.escape(base,quote=True)+'">']
metadata+=['<link rel="manifest" href="./manifest.webmanifest">','<link rel="icon" type="image/svg+xml" href="./icons/app-icon.svg">','<link rel="icon" type="image/png" sizes="32x32" href="./icons/favicon-32.png">','<link rel="icon" type="image/png" sizes="16x16" href="./icons/favicon-16.png">','<link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png">']
structured={'@context':'https://schema.org','@type':'WebApplication','name':meta['name'],'alternateName':meta['short_name'],'description':meta['description'],'applicationCategory':'EducationalApplication','operatingSystem':'Any','inLanguage':'vi'}
if base:structured.update(url=base,image=image)
metadata+=['<script type="application/ld+json">'+json.dumps(structured,ensure_ascii=False).replace('</','<\\/')+'</script>']
html=html.replace('/*METADATA*/','\n'.join(metadata))
for marker,name in [('STYLE','fluent.css'),('THEME','theme.js'),('APP','app.js'),('PWA','pwa.js')]:
 html=html.replace('/*'+marker+'*/',(r/name).read_text(encoding='utf8'))
html=html.replace('/*CONTENT*/',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))
(dist/'index.html').write_text(html,encoding='utf8')
shutil.copytree(r/'pwa-static',dist,dirs_exist_ok=True)
manifest=json.loads((dist/'manifest.webmanifest').read_text(encoding='utf8'))
manifest.update(name=meta['name'],short_name=meta['short_name'],description=meta['description'])
(dist/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
digest=hashlib.sha256(html.encode('utf8')+(r/'sw-template.js').read_bytes())
for asset in sorted((r/'pwa-static').rglob('*')):
 if asset.is_file():digest.update(str(asset.relative_to(r/'pwa-static')).encode());digest.update(asset.read_bytes())
version=digest.hexdigest()[:16]
shell=['./','./index.html','./manifest.webmanifest','./offline.html','./bai-giang.html','./icons/app-icon.svg','./icons/apple-touch-icon.png','./icons/favicon-32.png','./icons/favicon-16.png']+['./'+item['src'] for item in manifest['icons']]
(dist/'sw.js').write_text((r/'sw-template.js').read_text(encoding='utf8').replace('__VERSION__',version).replace('__SHELL_FILES__',json.dumps(shell)),encoding='utf8')
(dist/'.nojekyll').touch()
(dist/'version.json').write_text(json.dumps({'name':meta['short_name'],'title':meta['name'],'version':version,'questions':430,'publication_url':base or None},ensure_ascii=False),encoding='utf8')
print('Built dauthau-430 PWA:',len(data['questions']),'questions; version',version)
