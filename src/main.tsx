import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/tokens.css';
import './index.css';
import App from './App';
import { Capacitor } from '@capacitor/core';

if (Capacitor.getPlatform() === 'ios') document.documentElement.classList.add('ios');

// 画面確認用: ?theme=dark / ?theme=light で色を固定する(E2E の撮影で使う)
const theme = new URLSearchParams(location.search).get('theme');
if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
