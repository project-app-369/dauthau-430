from pathlib import Path
import json
r=Path(__file__).parent
data={'questions':json.loads((r/'questions.json').read_text(encoding='utf8')),'topics':json.loads((r/'topics.json').read_text(encoding='utf8'))}
html=(r/'template.html').read_text(encoding='utf8').replace('/*STYLE*/',(r/'styles.css').read_text(encoding='utf8')).replace('/*CONTENT*/',json.dumps(data,ensure_ascii=False).replace('</','<\\/')).replace('/*APP*/',(r/'app.js').read_text(encoding='utf8'))
(r/'dist'/'index.html').write_text(html,encoding='utf8')
print('Built static course with',len(data['questions']),'questions')
