import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize analytics if consent was previously given
const hasConsent = localStorage.getItem('cookieConsent') === 'accepted';
if (hasConsent) {
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-CEDBMXRBYX';
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-CEDBMXRBYX');
  `;
  document.head.appendChild(script2);
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);