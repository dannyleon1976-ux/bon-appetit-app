import React from 'react'; import { createRoot } from 'react-dom/client'; import App from './App'; import './styles.css';

const container = document.getElementById('root') || (() => { const el = document.createElement('div'); el.id = 'root'; document.body.appendChild(el); return el; })();

const root = createRoot(container); root.render( <React.StrictMode> <App /> </React.StrictMode> );