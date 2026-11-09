import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@awesome.me/webawesome/dist/styles/webawesome.css';
import '@soar-awesome/soar/theme/soar.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
