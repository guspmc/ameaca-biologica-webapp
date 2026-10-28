import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// O cache offline guarda somente o shell estático; nunca dados pessoais/API.
// A prévia de teste e o servidor de desenvolvimento não registram este worker.
function registrarShellOffline() {
  if (!import.meta.env.PROD || import.meta.env.MODE === 'teste' || !('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
    scope: import.meta.env.BASE_URL,
  }).catch(() => {
    // Falha no service worker não deve impedir o uso online do WebApp.
  });
}
if (document.readyState === 'complete') registrarShellOffline();
else window.addEventListener('load', registrarShellOffline, { once: true });

const root = document.querySelector<HTMLDivElement>('#root');
if (!root) throw new Error('Elemento principal indisponível.');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
