import os, subprocess, json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
root=Path(__file__).resolve().parents[1]
env=os.environ.copy();env['LD_LIBRARY_PATH']=str(root/'work/ocr-runtime/usr/lib');env['OMP_THREAD_LIMIT']='1';env['TESSDATA_PREFIX']=str(root/'work/ocr-runtime/usr/share/tessdata')
def process(row):
 n=row['id'];out=root/f'reports/ocr/{n:03}'
 if out.with_suffix('.txt').exists():return
 subprocess.run([str(root/'work/ocr-runtime/usr/bin/tesseract'),str(root/f'public/sources/{n:03}.jpg'),str(out),'-l','spa','--psm','3'],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
 print(n,flush=True)
rows=json.loads((root/'reports/inventory.json').read_text())
with ThreadPoolExecutor(max_workers=6) as ex:list(ex.map(process,rows))
