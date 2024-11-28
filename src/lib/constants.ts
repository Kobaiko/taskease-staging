export const API_ENDPOINTS = {
  PAYMENT: {
    YAAD_URL: 'https://pay.hyp.co.il/p/',
    BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions' 
      : 'https://staging.gettaskease.com/.netlify/functions'
  }
} as const;

export const CURRENCY = {
  TYPES: {
    ILS: '1',
    USD: '2',
    EUR: '3',
    GBP: '4'
  },
  USD_TO_ILS: 3.7
} as const;

export const PAYMENT_STATUS = {
  SUCCESS: '0',
  POSTPONED: '800',
  CARD_CHECK: '600',
  APPROVED_NO_CHARGE: '700',
  NO_PERMISSION: '901',
  AUTH_ERROR: '902',
  COMM_ERROR: '999'
} as const;