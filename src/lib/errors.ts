export class PaymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class SignatureError extends PaymentError {
  constructor(message: string, details?: unknown) {
    super(message, 'SIGNATURE_ERROR', details);
    this.name = 'SignatureError';
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}