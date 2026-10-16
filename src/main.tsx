import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {MotionSystem} from './components/MotionSystem';

import 'katex/dist/katex.min.css';
import './styles.css';
import './modern.css';
import './notation.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><MotionSystem><App/></MotionSystem></React.StrictMode>);
