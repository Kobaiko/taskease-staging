import { CURRENCY } from '../../lib/constants';
import type { PaymentParams, PaymentOptions } from '../../types/payment';
import { ValidationError } from '../../lib/errors';
import { v4 as uuidv4 } from 'uuid';

export function convertUSDToILS(amount: number): number {
  return Math.round(amount * CURRENCY.USD_TO_ILS * 100) / 100;
}

export function validateAmount(amount: number): void {
  if (!amount || amount <= 0) {
    throw new ValidationError('Amount must be greater than 0');
  }
  if (amount > 99999999) {
    throw new ValidationError('Amount exceeds maximum allowed value');
  }
}

export function formatUserId(userId: string): string {
  // For testing, use a valid test ID
  if (process.env.NODE_ENV === 'development') {
    return '000000000';
  }

  // Remove any non-numeric characters
  const cleanId = userId.replace(/\D/g, '');

  // Pad with zeros if needed
  const paddedId = cleanId.padStart(9, '0');

  // Validate the length
  if (paddedId.length !== 9) {
    throw new ValidationError('User ID must be 9 digits');
  }

  return paddedId;
}

export function validateUserId(userId: string): string {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  try {
    return formatUserId(userId);
  } catch (error) {
    throw new ValidationError('Invalid User ID format - must be 9 digits');
  }
}

export function createPaymentParams(
  userId: string,
  amount: number,
  options: PaymentOptions = {}
): PaymentParams {
  validateAmount(amount);
  const formattedUserId = validateUserId(userId);

  const {
    isSubscription = false,
    isYearly = false,
    installments,
    firstPayment,
    currency = CURRENCY.TYPES.ILS,
    sendEmail = true,
    language = 'ENG'
  } = options;

  const amountInILS = currency === CURRENCY.TYPES.ILS 
    ? amount 
    : convertUSDToILS(amount);

  const orderId = uuidv4().replace(/-/g, '').slice(0, 15);

  const params: PaymentParams = {
    // Required parameters
    Masof: import.meta.env.VITE_YAAD_MASOF,
    PassP: import.meta.env.VITE_YAAD_PASSP,
    action: 'pay',
    Amount: amountInILS.toFixed(2),
    Info: isSubscription 
      ? `TaskEase ${isYearly ? 'Yearly' : 'Monthly'} Subscription` 
      : 'TaskEase Credits',
    Order: orderId,
    UserId: formattedUserId,

    // Encoding and format
    UTF8: 'True',
    UTF8out: 'True',
    PageLang: language,
    
    // Currency
    Coin: currency,
    
    // Features
    MoreData: 'True',
    Sign: 'True',
    J5: 'True',
    sendemail: sendEmail ? 'True' : 'False',
    tmp: '1'
  };

  // Add subscription parameters
  if (isSubscription) {
    Object.assign(params, {
      HK: 'True',
      Tash: isYearly ? '12' : '1',
      freq: isYearly ? 'yearly' : 'monthly',
      OnlyOnApprove: 'True'
    });
  }

  // Add installment parameters
  if (installments && installments > 1) {
    Object.assign(params, {
      Tash: installments.toString(),
      FixTash: 'True'
    });

    if (firstPayment) {
      params.TashFirstPayment = firstPayment.toString();
    }
  }

  return params;
}