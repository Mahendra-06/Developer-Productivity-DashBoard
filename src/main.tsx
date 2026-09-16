import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { DashboardProvider } from './context/DashboardContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <DashboardProvider>
          <App />
        </DashboardProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
