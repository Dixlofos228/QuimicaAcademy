from pathlib import Path
import json,csv,hashlib,zipfile
root=Path(__file__).resolve().parents[1]
lessons=sum([json.loads((root/f'src/data/{f}.json').read_text()) for f in ['foundations','course-a','course-b','course-c']],[])
records=sum([json.loads((root/f'reports/archive-{p}.json').read_text()) for p in ['a','b','c']],[])
inventory=json.loads((root/'reports/inventory.json').read_text())
assert len(records)==len(inventory)==241
lookup={l['id']:l for l in lessons}
spanish_notes=json.loads((root/'src/data/source-notes-es.json').read_text())
for row in records:
 n=row['id'];im=next(x for x in inventory if x['id']==n)
 row.update({'file':im['file'],'url':im['url'],'originalUrl':f'/originals/{n:03}.jpg'})
 row['lessonKeys']=[l['id'] for l in lessons if n in l['sourceIds']]
 if isinstance(row['needsReview'],bool):row['needsReview']=[row['notes']] if row['needsReview'] else []
 row['notesEs']=spanish_notes.get(f'{n:03}','')
 if row['needsReview']:assert row['notesEs'],f'Missing Spanish review note {n}'
 row['courseExamples']=[e['title'] for id in row['lessonKeys'] for e in lookup[id]['examples']]
 row['courseExercises']=[e['id'] for id in row['lessonKeys'] for e in lookup[id]['exercises']]
 assert row['lessonKeys'],f'Unlinked photo {n}'
records.sort(key=lambda r:r['id'])
for file in ['src/data/coverage.json','reports/coverage.json','public/coverage.json']:(root/file).write_text(json.dumps(records,ensure_ascii=False,indent=2))
with (root/'reports/coverage.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.writer(f);w.writerow(['Номер','Файл','Тема','Уроки','Задания в источнике','Примеры курса по теме','Упражнения курса','Визуальная проверка','Замечания для сверки'])
 for r in records:w.writerow([r['id'],r['file'],r['topic'],' | '.join(r['lessonKeys']),' | '.join(r['exercises']),' | '.join(e['ru'] for e in r['courseExamples']),' | '.join(r['courseExercises']),r['verified'],' | '.join(r['needsReview'])])
(root/'public/coverage.csv').write_bytes((root/'reports/coverage.csv').read_bytes())
summary={'photos':len(inventory),'visuallyReviewed':sum(r['verified'] for r in records),'linked':sum(bool(r['lessonKeys']) for r in records),'flaggedPages':sum(bool(r['needsReview']) for r in records),'sections':len(set(l['group'] for l in lessons)),'lessons':len(lessons),'additionalLessons':sum(l.get('additional',False) for l in lessons),'exercises':sum(len(l['exercises']) for l in lessons),'workedExamples':sum(len(l['examples']) for l in lessons),'terms':len(set(t['id'] for l in lessons for t in l['terms'])),'simulationKinds':sorted(set(l['simulation'] for l in lessons)),'exerciseTypes':sorted(set(e['type'] for l in lessons for e in l['exercises']))}
(root/'reports/summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print(json.dumps(summary,ensure_ascii=False,indent=2))
archive=Path('/home/mirai/Downloads/Telegram Desktop/química.zip')
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for im in inventory:
  assert hashlib.sha256(z.read(im['file'])).hexdigest()==im['sha256']
  assert hashlib.sha256((root/f'public/originals/{im["id"]:03}.jpg').read_bytes()).hexdigest()==im['sha256']
(root/'reports/archive-integrity.json').write_text(json.dumps({'zip':str(archive),'sha256':hashlib.file_digest(archive.open('rb'),'sha256').hexdigest(),'CRC':'OK','originalPhotosMatch':241,'formats':['JPEG'],'resolution':[3000,4000]},indent=2))
print('CRC and all241 original hashes verified.')
