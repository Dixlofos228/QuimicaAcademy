#!/usr/bin/env python
"""Manage only QuimicaAcademy's loopback preview process, without system services."""
from pathlib import Path
import os,signal,subprocess,sys,time,urllib.request
root=Path(__file__).resolve().parents[1];pidfile=root/'work/server.pid';url='http://127.0.0.1:4173'
def available():
 try:
  with urllib.request.urlopen(url,timeout=1) as response:
   body=response.read(5000).decode('utf-8')
   return response.status==200 and 'Química Academy' in body
 except Exception:return False
def stop():
 if not pidfile.exists():return
 try:
  pid=int(pidfile.read_text());proc=Path(f'/proc/{pid}');cwd=proc.joinpath('cwd').resolve();cmd=proc.joinpath('cmdline').read_bytes()
  if cwd==root and (b'vite' in cmd or b'npm run dev' in cmd) and os.getpgid(pid)==pid:
   os.killpg(pid,signal.SIGTERM)
   for _ in range(30):
    if not proc.exists():break
    time.sleep(.1)
  elif proc.exists():raise RuntimeError('PID does not belong to this project; refusing to stop it')
 except (ProcessLookupError,FileNotFoundError):pass
 pidfile.unlink(missing_ok=True)
if len(sys.argv)<2:raise SystemExit('start | stop | restart | status')
mode=sys.argv[1]
if mode in ['stop','restart']:stop()
if mode=='stop':print('Química Academy stopped');raise SystemExit()
if mode=='status':print(url if available() else 'Stopped');raise SystemExit(0 if available() else 1)
if mode not in ['start','restart']:raise SystemExit('Unknown command')
if available():print(url);raise SystemExit()
if not (root/'dist/index.html').exists():raise SystemExit('Run npm run build first')
(root/'work').mkdir(exist_ok=True)
with (root/'work/server.log').open('a') as out:
 p=subprocess.Popen(['node',str(root/'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port','4173','--strictPort'],cwd=root,stdin=subprocess.DEVNULL,stdout=out,stderr=subprocess.STDOUT,start_new_session=True)
pidfile.write_text(str(p.pid))
for _ in range(50):
 if available():print(url);raise SystemExit()
 if p.poll() is not None:raise SystemExit('Server failed; check work/server.log. Port4173 may be occupied.')
 time.sleep(.1)
raise SystemExit('Server did not become ready; check work/server.log')
