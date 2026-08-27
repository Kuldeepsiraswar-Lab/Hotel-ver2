import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { PWAProvider } from './context/PWAContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PWAProvider>
        <App />
      </PWAProvider>
    </ThemeProvider>
  </StrictMode>,
);


