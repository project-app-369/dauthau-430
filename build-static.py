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
shutil.copytree(r/'pwa-static',dist,dirs_exist_ok=True)
def public_url(relative):return urljoin(base,relative) if base else './'+relative
brand_digest=hashlib.sha256((r/'pwa-static/icons/app-icon.svg').read_bytes()+(r/'pwa-static/icons/app-icon-512.png').read_bytes()).hexdigest()[:10]
icon_assets={}
for source in ['icons/app-icon.svg','icons/app-icon-192.png','icons/app-icon-512.png','icons/app-maskable-512.png','icons/apple-touch-icon.png','icons/favicon-16.png','icons/favicon-32.png','favicon.ico']:
 target='icons/brand-'+brand_digest+'-'+Path(source).name
 shutil.copy2(r/'pwa-static'/source,dist/target)
 icon_assets[source]=target
social_assets=[]
for source,width,height in [('social/thumbnail-wide.jpg',1200,630),('social/thumbnail-square.jpg',1200,1200)]:
 digest=hashlib.sha256((r/'pwa-static'/source).read_bytes()).hexdigest()[:12]
 target='social/'+Path(source).stem+'-'+digest+'.jpg'
 shutil.copy2(r/'pwa-static'/source,dist/target)
 social_assets.append((target,width,height))
if dist!=r/'dist':
 for asset in list((r/'dist').glob('*.pdf'))+list((r/'dist').glob('bai-giang.html')):shutil.copy2(asset,dist/asset.name)
data={'questions':json.loads((r/'questions.json').read_text(encoding='utf8')),'topics':json.loads((r/'topics.json').read_text(encoding='utf8'))}
assert len(data['questions'])==430
html=(r/'template.html').read_text(encoding='utf8')
def tag(name,value,prop=False):return '<meta '+('property' if prop else 'name')+'="'+name+'" content="'+h.escape(value,quote=True)+'">'
image=public_url(social_assets[0][0])
metadata=[tag('application-name',meta['short_name']),tag('description',meta['description']),tag('robots','index,follow'),tag('apple-mobile-web-app-capable','yes'),tag('apple-mobile-web-app-title',meta['short_name']),tag('apple-mobile-web-app-status-bar-style','default'),tag('mobile-web-app-capable','yes'),tag('msapplication-TileColor','#0067c0'),tag('og:title',meta['name'],True),tag('og:description',meta['description'],True),tag('og:site_name',meta['short_name'],True),tag('og:type','website',True),tag('og:locale',meta['locale'],True),tag('og:image',image,True),tag('og:image:width','1200',True),tag('og:image:height','630',True),tag('og:image:type','image/png',True),tag('og:image:alt',meta['name'],True),tag('twitter:card','summary_large_image'),tag('twitter:title',meta['name']),tag('twitter:description',meta['description']),tag('twitter:image',image)]
metadata=[item for item in metadata if not item.startswith('<meta property="og:image')]
for source,width,height in social_assets:
 url=public_url(source)
 metadata.extend([tag('og:image',url,True),tag('og:image:url',url,True),tag('og:image:secure_url',url,True),tag('og:image:width',str(width),True),tag('og:image:height',str(height),True),tag('og:image:type','image/jpeg',True),tag('og:image:alt',meta['name']+' — Flashcard và ôn luyện 5–10–20 câu',True)])
metadata.extend([tag('twitter:image:alt',meta['name']),tag('msapplication-TileImage',public_url(icon_assets['icons/app-icon-192.png'])),'<link rel="image_src" href="'+h.escape(image,quote=True)+'">'])
if base:metadata+=[tag('og:url',base,True),'<link rel="canonical" href="'+h.escape(base,quote=True)+'">']
metadata+=['<link rel="manifest" href="./manifest.webmanifest">']
for source,mime,size,rel in [('icons/app-icon.svg','image/svg+xml',None,'icon'),('icons/favicon-32.png','image/png','32x32','icon'),('icons/favicon-16.png','image/png','16x16','icon'),('favicon.ico','image/x-icon',None,'shortcut icon'),('icons/apple-touch-icon.png','image/png','180x180','apple-touch-icon')]:
 metadata.append('<link rel="'+rel+'" type="'+mime+'" '+('sizes="'+size+'" ' if size else '')+'href="./'+icon_assets[source]+'">')
structured={'@context':'https://schema.org','@type':'WebApplication','name':meta['name'],'alternateName':meta['short_name'],'description':meta['description'],'applicationCategory':'EducationalApplication','operatingSystem':'Any','inLanguage':'vi'}
if base:structured.update(url=base,image=image)
metadata+=['<script type="application/ld+json">'+json.dumps(structured,ensure_ascii=False).replace('</','<\\/')+'</script>']
html=html.replace('/*METADATA*/','\n'.join(metadata))
html=html.replace('src="./icons/app-icon.svg"','src="./'+icon_assets['icons/app-icon.svg']+'"')
for marker,name in [('STYLE','fluent.css'),('THEME','theme.js'),('APP','app.js'),('PWA','pwa.js'),('SYNC_MODEL','sync-model.js'),('FIREBASE','firebase-client.js')]:
 html=html.replace('/*'+marker+'*/',(r/name).read_text(encoding='utf8'))
html=html.replace('/*CONTENT*/',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))
(dist/'index.html').write_text(html,encoding='utf8')
manifest=json.loads((dist/'manifest.webmanifest').read_text(encoding='utf8'))
manifest.update(name=meta['name'],short_name=meta['short_name'],description=meta['description'])
for entry in manifest['icons']:entry['src']=icon_assets[entry['src']]
(dist/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
digest=hashlib.sha256(html.encode('utf8')+(r/'sw-template.js').read_bytes())
for asset in sorted((r/'pwa-static').rglob('*')):
 if asset.is_file():digest.update(str(asset.relative_to(r/'pwa-static')).encode());digest.update(asset.read_bytes())
version=digest.hexdigest()[:16]
shell=['./','./index.html','./manifest.webmanifest','./offline.html','./bai-giang.html']+['./'+item for item in icon_assets.values()]
(dist/'sw.js').write_text((r/'sw-template.js').read_text(encoding='utf8').replace('__VERSION__',version).replace('__SHELL_FILES__',json.dumps(shell)),encoding='utf8')
(dist/'.nojekyll').touch()
robots='User-agent: *\nAllow: /\n'
if base:
 robots+='Sitemap: '+urljoin(base,'sitemap.xml')+'\n'
 (dist/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+h.escape(base)+'</loc></url></urlset>',encoding='utf8')
(dist/'robots.txt').write_text(robots,encoding='utf8')
(dist/'version.json').write_text(json.dumps({'name':meta['short_name'],'title':meta['name'],'version':version,'questions':430,'publication_url':base or None},ensure_ascii=False),encoding='utf8')
print('Built dauthau-430 PWA:',len(data['questions']),'questions; version',version)
