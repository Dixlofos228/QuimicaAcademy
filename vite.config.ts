import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules/katex'))return 'math';if(id.includes('node_modules/react'))return 'react';if(id.includes('course-a.json'))return 'organic-content';if(id.includes('course-b.json'))return 'thermo-content';if(id.includes('course-c.json'))return 'biochem-content';}}}},server:{host:'127.0.0.1'},preview:{host:'127.0.0.1',port:4173,strictPort:true}});
