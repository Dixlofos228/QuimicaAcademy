from pathlib import Path
import math
out=Path(__file__).resolve().parents[1]/'public/art'
out.mkdir(parents=True,exist_ok=True)
shapes={
'foundation':'<circle cx="200" cy="110" r="40" fill="url(#warm)"/><ellipse cx="200" cy="110" rx="95" ry="60" fill="none" stroke="#9ab5df" transform="rotate(-25 200 110)"/><circle cx="283" cy="60" r="12" fill="url(#blue)"/><circle cx="120" cy="165" r="10" fill="url(#blue)"/>',
'organic':'<path d="M100 120 145 82 200 115 255 82 310 120" stroke="#8995a7" stroke-width="8" fill="none"/><path d="m151 97 42 26" stroke="#d49d6d" stroke-width="4"/>'+''.join(f'<circle cx="{x}" cy="{y}" r="19" fill="url(#blue)"/>' for x,y in [(100,120),(145,82),(200,115),(255,82),(310,120)]),
'carbs':'<path d="m110 115 35-55h68l36 55-36 53h-68Z" stroke="#9bbce9" stroke-width="5" fill="#46618940"/><path d="m248 115 28-45h58l30 45-30 45h-58Z" stroke="#d49d6d" stroke-width="4" fill="#9b745e30"/><circle cx="248" cy="115" r="10" fill="url(#warm)"/>',
'thermo':'<path d="M120 50v108q0 20 20 20h130q20 0 20-20V50" stroke="#9cb5d9" stroke-width="4" fill="none"/><path d="M122 130h166v28q0 18-18 18H140q-18 0-18-18Z" fill="url(#blue)"/><path d="M200 85c-20-26 10-28-4-50m31 48c-20-26 10-28-4-50" stroke="#d49d6d" stroke-width="3" fill="none"/>',
'equilibrium':'<path d="M110 100h180m-20-20 20 20-20 20M290 142H110m20-20-20 20 20 20" stroke="#9bbce9" stroke-width="4" fill="none"/><circle cx="83" cy="100" r="20" fill="url(#warm)"/><circle cx="319" cy="142" r="20" fill="url(#blue)"/>',
'acidbase':'<path d="M195 36s-65 67-65 106a65 65 0 0 0 130 0c0-39-65-106-65-106Z" fill="url(#blue)" stroke="#9bbce9"/><path d="M165 139h60m-30-30v60" stroke="#e5ecf5" stroke-width="4"/>',
'protein':'<path d="M80 100C110 20 150 180 180 100S250 20 280 100s40 80 50 0" fill="none" stroke="url(#blue)" stroke-width="15" stroke-linecap="round"/><path d="M90 150C120 70 160 230 190 150s70-80 100 0" fill="none" stroke="#d49d6d" stroke-width="5" opacity=".65"/>',
'lipids':'<path d="M105 58v110M105 66l40-10 35 24 45-8 50 36 35-3M105 112l40-10 35 24 45-8 50 36 35-3M105 158l40-10 35 24 45-8 50 36 35-3" fill="none" stroke="#93b3df" stroke-width="5"/><circle cx="105" cy="112" r="15" fill="url(#warm)"/>',
'colloids':''.join(f'<line x1="{200+70*math.cos(i*.785)}" y1="{110+70*math.sin(i*.785)}" x2="{200+32*math.cos(i*.785)}" y2="{110+32*math.sin(i*.785)}" stroke="#d49d6d" stroke-width="5"/><circle cx="{200+70*math.cos(i*.785)}" cy="{110+70*math.sin(i*.785)}" r="11" fill="url(#blue)"/>' for i in range(8))}
for group,art in shapes.items():
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220"><defs><radialGradient id="blue" cx="30%" cy="25%"><stop stop-color="#c9ddf5"/><stop offset=".5" stop-color="#6887b1"/><stop offset="1" stop-color="#35445d"/></radialGradient><radialGradient id="warm" cx="30%" cy="25%"><stop stop-color="#f1d3b2"/><stop offset=".5" stop-color="#c48c5a"/><stop offset="1" stop-color="#78563e"/></radialGradient><radialGradient id="ambient"><stop stop-color="#668cc8" stop-opacity=".18"/><stop offset="1" stop-color="#668cc8" stop-opacity="0"/></radialGradient></defs><ellipse cx="200" cy="110" rx="190" ry="110" fill="url(#ambient)"/>{art}</svg>'
 (out/f'section-{group}.svg').write_text(svg)
