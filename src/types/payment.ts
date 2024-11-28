export interface PaymentResponse {
  Id: string;
  CCode: string;
  Amount: string;
  ACode: string;
  Fild1?: string;
  Fild2?: string;
  Fild3?: string;
  Bank?: string;
  Payments?: string;
  UserId?: string;
  Brand?: string;
  Issuer?: string;
  L4digit?: string;
  Coin?: string;
  Tmonth?: string;
  Tyear?: string;
  Hesh?: string;
  errMsg?: string;
  TransType?: string;
  UID?: string;
  spType?: string;
  bincard?: string;
}

export interface PaymentParams {
  // Required parameters
  Masof: string;
  PassP: string;
  Amount: string;
  Info: string;
  Order: string;
  UserId: string;
  
  // Action and encoding
  action: string;
  UTF8: string;
  UTF8out: string;
  
  // Optional parameters
  ClientName?: string;
  ClientLName?: string;
  email?: string;
  phone?: string;
  cell?: string;
  street?: string;
  city?: string;
  zip?: string;
  
  // Payment specific
  Coin?: string;
  Tash?: string;
  tashType?: string;
  FixTash?: string;
  TashFirstPayment?: string;
  
  // Features
  MoreData?: string;
  Sign?: string;
  J5?: string;
  HK?: string;
  freq?: string;
  OnlyOnApprove?: string;
  
  // Additional
  [key: string]: string | undefined;
}

export interface PaymentOptions {
  isSubscription?: boolean;
  isYearly?: boolean;
  installments?: number;
  firstPayment?: number;
  currency?: string;
  sendEmail?: boolean;
  language?: 'HEB' | 'ENG';
}

export interface PaymentError {
  code: string;
  message: string;
  details?: unknown;
}