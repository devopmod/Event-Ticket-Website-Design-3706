import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Дополнительный перехватчик в main.jsx (выполняется после index.html)
const _origFetch = window.fetch;
window.fetch = async (url, opts = {}) => {
  if (url.includes('event_seats_fanaticka_7a3x9d') && opts.method === 'PATCH') {
    const bodyText = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    console.log('%cMAIN.JSX FETCH PATCH BODY →', 'color:orange', bodyText);
    
    // Print stack trace for "hold" values
    if (bodyText.includes('"hold"')) {
      console.error('❌ FOUND "hold" IN REQUEST BODY FROM MAIN.JSX!');
      console.error('Body:', bodyText);
      console.error('Stack trace:', new Error().stack);
    }
    
    // Monkey-patch to fix the issue - replace "hold" with "held"
    if (typeof opts.body === 'string' && opts.body.includes('"hold"')) {
      opts.body = opts.body.replace('"hold"', '"held"');
      console.log('%cFIXED BODY IN MAIN.JSX →', 'color:green', opts.body);
    }
  }
  
  return _origFetch(url, opts);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);