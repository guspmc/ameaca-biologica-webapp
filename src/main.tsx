import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const root = document.querySelector<HTMLDivElement>('#root');
if (!root) throw new Error('Elemento principal indisponível.');
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
