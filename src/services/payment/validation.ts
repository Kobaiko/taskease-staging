import { PAYMENT_STATUS } from '../../lib/constants';
import type { PaymentResponse } from '../../types/payment';
import { PaymentError } from '../../lib/errors';

export function validatePaymentResponse(response: PaymentResponse): boolean {
  if (!response) {
    throw new PaymentError('Invalid payment response', 'INVALID_RESPONSE');
  }

  // Check for valid response codes
  const validCodes = [
    PAYMENT_STATUS.SUCCESS,
    PAYMENT_STATUS.POSTPONED,
    PAYMENT_STATUS.CARD_CHECK,
    PAYMENT_STATUS.APPROVED_NO_CHARGE
  ];

  return validCodes.includes(response.CCode);
}

export function getPaymentErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    // Success codes
    [PAYMENT_STATUS.SUCCESS]: 'Transaction successful',
    [PAYMENT_STATUS.POSTPONED]: 'Transaction pending approval',
    [PAYMENT_STATUS.CARD_CHECK]: 'Card verification successful',
    [PAYMENT_STATUS.APPROVED_NO_CHARGE]: 'Approval received without charge',
    
    // Error codes
    [PAYMENT_STATUS.NO_PERMISSION]: 'Permission denied - Invalid terminal configuration',
    [PAYMENT_STATUS.AUTH_ERROR]: 'Authentication failed - Check credentials',
    [PAYMENT_STATUS.COMM_ERROR]: 'Communication error - Please try again',
    
    // Common Shva errors
    '001': 'Card is blocked',
    '002': 'Card reported stolen',
    '003': 'Contact credit card company',
    '004': 'Transaction declined',
    '005': 'Forged card',
    '006': 'CVV error',
    '015': 'Card expired',
    '033': 'Invalid refund amount',
    '039': 'Invalid card number',
    '401': 'Missing customer name',
    '402': 'Missing transaction description',
    '434': 'Card not allowed for this terminal'
  };

  return errorMessages[code] || `Unknown error (Code: ${code})`;
}

export function parsePaymentResponse(response: PaymentResponse): {
  success: boolean;
  message: string;
  data?: Partial<PaymentResponse>;
} {
  const success = validatePaymentResponse(response);
  const message = getPaymentErrorMessage(response.CCode);

  if (!success) {
    return { success, message };
  }

  // Extract relevant data for successful transactions
  const { Id, Amount, ACode, Hesh, Brand, L4digit, Payments } = response;
  
  return {
    success,
    message,
    data: { Id, Amount, ACode, Hesh, Brand, L4digit, Payments }
  };
}