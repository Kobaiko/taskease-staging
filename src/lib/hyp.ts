import { z } from 'zod';

// API Configuration
export const HYP_API = {
  BASE_URL: 'https://pay.hyp.co.il/p/',
  ACTIONS: {
    PAY: 'pay',
    API_SIGN: 'APISign',
    VERIFY: 'VERIFY',
    GET_TOKEN: 'getToken',
    COMMIT_TRANS: 'commitTrans',
    CANCEL_TRANS: 'CancelTrans',
    PRINT_HESH: 'PrintHesh'
  },
  CURRENCY: {
    ILS: '1',
    USD: '2',
    EUR: '3',
    GBP: '4'
  }
} as const;

// Validation Schemas
export const PaymentParamsSchema = z.object({
  action: z.enum(['pay', 'soft']),
  Masof: z.string().length(10),
  PassP: z.string().optional(),
  Amount: z.string(),
  Info: z.string(),
  UTF8: z.literal('True'),
  UTF8out: z.literal('True'),
  Sign: z.literal('True'),
  MoreData: z.literal('True'),
  UserId: z.string(),
  ClientName: z.string().optional(),
  ClientLName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  cell: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  Coin: z.enum(['1', '2', '3', '4']).optional(),
  Tash: z.string().optional(),
  FixTash: z.enum(['True', 'False']).optional(),
  TashFirstPayment: z.string().optional(),
  J5: z.enum(['True', 'False']).optional(),
  HK: z.enum(['True', 'False']).optional(),
  freq: z.string().optional(),
  OnlyOnApprove: z.enum(['True', 'False']).optional(),
  signature: z.string().optional()
});

export const PaymentResponseSchema = z.object({
  Id: z.string(),
  CCode: z.string(),
  Amount: z.string(),
  ACode: z.string(),
  Fild1: z.string().optional(),
  Fild2: z.string().optional(),
  Fild3: z.string().optional(),
  Bank: z.string().optional(),
  Payments: z.string().optional(),
  UserId: z.string().optional(),
  Brand: z.string().optional(),
  Issuer: z.string().optional(),
  L4digit: z.string().optional(),
  Coin: z.string().optional(),
  Tmonth: z.string().optional(),
  Tyear: z.string().optional(),
  Hesh: z.string().optional(),
  errMsg: z.string().optional()
});

// Error Codes
export const ERROR_CODES = {
  SUCCESS: '0',
  POSTPONED: '800',
  CARD_CHECK: '600',
  APPROVED_NO_CHARGE: '700',
  NO_PERMISSION: '901',
  AUTH_ERROR: '902',
  COMM_ERROR: '999'
} as const;

// Types
export type PaymentParams = z.infer<typeof PaymentParamsSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export interface PaymentOptions {
  isSubscription?: boolean;
  isYearly?: boolean;
  installments?: number;
  firstPayment?: number;
  currency?: keyof typeof HYP_API.CURRENCY;
  sendEmail?: boolean;
  language?: 'HEB' | 'ENG';
}

// Error Messages
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.SUCCESS]: 'Transaction successful',
  [ERROR_CODES.POSTPONED]: 'Transaction pending approval',
  [ERROR_CODES.CARD_CHECK]: 'Card verification successful',
  [ERROR_CODES.APPROVED_NO_CHARGE]: 'Approval received without charge',
  [ERROR_CODES.NO_PERMISSION]: 'Permission denied',
  [ERROR_CODES.AUTH_ERROR]: 'Authentication failed',
  [ERROR_CODES.COMM_ERROR]: 'Communication error',
  '001': 'Card is blocked',
  '002': 'Card reported stolen',
  '003': 'Contact credit card company',
  '004': 'Transaction declined',
  '005': 'Forged card',
  '006': 'CVV error',
  '015': 'Card expired'
};