export function getFlutterwaveSecret(): string {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: FLW_SECRET_KEY environment variable is not defined in production.');
    }
    console.warn('[Security Warning] FLW_SECRET_KEY environment variable is missing. Using a mock secret — Flutterwave payment initialization/verification calls will fail against the real API.');
    return 'FLWSECK_TEST-mock-secret-key-123';
  }
  return secret;
}
