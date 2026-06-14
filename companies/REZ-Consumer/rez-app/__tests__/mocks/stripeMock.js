// Minimal stub for @stripe/stripe-react-native
// This package is not installed in the project but is referenced in jest.setup.js.
// The moduleNameMapper in jest.config.js points here so the mock call resolves.
module.exports = {
  StripeProvider: jest.fn(({ children }) => children),
  CardField: jest.fn(() => null),
  useStripe: jest.fn(() => ({
    confirmPayment: jest.fn(() => Promise.resolve({ paymentIntent: {} })),
    createPaymentMethod: jest.fn(() => Promise.resolve({ paymentMethod: {} })),
  })),
};
