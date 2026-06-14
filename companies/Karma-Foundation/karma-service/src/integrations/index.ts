/**
 * RABTUL Integration Index
 *
 * Complete RABTUL integration for REZ-Media services
 */

export { rabtulAuth } from './rabtulAuth';
export { rabtulPayment } from './rabtulPayment';
export { default as rabtulWallet } from './rabtulWallet';

// Legacy exports for backwards compatibility
export const rabtul = {
  auth: require('./rabtulAuth').rabtulAuth,
  payment: require('./rabtulPayment').rabtulPayment,
  wallet: require('./rabtulWallet').default,
};

export default rabtul;
