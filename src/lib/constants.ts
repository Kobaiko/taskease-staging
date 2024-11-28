export const API_ENDPOINTS = {
  PAYMENT: {
    YAAD_URL: 'https://pay.hyp.co.il/p/',
    BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions' 
      : 'https://staging.gettaskease.com/.netlify/functions'
  }
} as const;