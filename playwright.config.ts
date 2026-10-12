import {defineConfig,firefox} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const cache=path.join(os.homedir(),'.cache/ms-playwright');
const firefoxExecutable=[process.env.QUIMICA_FIREFOX_EXECUTABLE,firefox.executablePath(),...(fs.existsSync(cache)?fs.readdirSync(cache).filter(n=>/^firefox-\d+$/.test(n)).map(n=>path.join(cache,n,'firefox/firefox')):[])].find((p):p is string=>!!p&&fs.existsSync(p));
export default defineConfig({testDir:'./tests/e2e',timeout:180000,expect:{timeout:10000},workers:1,fullyParallel:false,reporter:[['list'],['json',{outputFile:'reports/e2e-results.json'}]],use:{baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:4173',headless:true,viewport:{width:1600,height:1000},screenshot:'only-on-failure'},projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}}},{name:'firefox',use:{browserName:'firefox',launchOptions:{executablePath:firefoxExecutable}}}],outputDir:'reports/e2e-artifacts'});
