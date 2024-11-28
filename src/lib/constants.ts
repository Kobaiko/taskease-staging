export const API_ENDPOINTS = {
  PAYMENT: {
    YAAD_URL: 'https://pay.hyp.co.il/p/',
    BASE_URL: window.location.hostname === 'localhost' 
      ? 'http://localhost:8888/.netlify/functions' 
      : 'https://staging.gettaskease.com/.netlify/functions',
    SIGNATURE: '/payment-sign'
  }
} as const;

export const CURRENCY = {
  USD_TO_ILS: 3.7,
  TYPES: {
    ILS: '1',
    USD: '2',
    EUR: '3',
    GBP: '4'
  }
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

export const CARD_BRANDS = {
  PL: '0',
  MASTERCARD: '1',
  VISA: '2',
  DINERS: '3',
  AMEX: '4',
  ISRACARD: '5'
} as const;

export const CARD_ISSUERS = {
  ISRACARD: '1',
  VISA_CAL: '2',
  JCB: '5',
  LEUMI_CARD: '5'
} as const;