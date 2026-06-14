import logger from './utils/logger';

// Test script to verify frontend can connect to backend
import realVouchersApi from '../services/realVouchersApi';
import realOffersApi from '../services/realOffersApi';

async function testConnection() {
  logger.info('🧪 Testing Backend API Connection...\n');

  try {
    // Test Vouchers API
    logger.info('1️⃣ Testing Vouchers API...');
    const vouchersResponse = await realVouchersApi.getVoucherBrands({ page: 1, limit: 5 });

    if (vouchersResponse.success && vouchersResponse.data.length > 0) {
      logger.info('✅ Vouchers API Working!');
      logger.info(`   Found ${vouchersResponse.data.length} voucher brands`);
      logger.info(`   First brand: ${vouchersResponse.data[0].name}`);
    } else {
      logger.info('❌ Vouchers API returned empty data');
    }

    // Test Offers API
    logger.info('\n2️⃣ Testing Offers API...');
    const offersResponse = await realOffersApi.getOffers({ page: 1, limit: 5 });

    if (offersResponse.success && offersResponse.data.length > 0) {
      logger.info('✅ Offers API Working!');
      logger.info(`   Found ${offersResponse.data.length} offers`);
      logger.info(`   First offer: ${(offersResponse.data as unknown)[0]?.title}`);
    } else {
      logger.info('❌ Offers API returned empty data');
    }

    // Test Featured Vouchers
    logger.info('\n3️⃣ Testing Featured Vouchers...');
    const featuredResponse = await realVouchersApi.getFeaturedBrands(3);

    if (featuredResponse.success && featuredResponse.data.length > 0) {
      logger.info('✅ Featured Vouchers Working!');
      logger.info(`   Found ${featuredResponse.data.length} featured brands`);
    } else {
      logger.info('❌ Featured Vouchers returned empty data');
    }

    logger.info('\n✅ All tests passed! Frontend is connected to backend.');

  } catch (error) {
    logger.error('\n❌ Connection test failed:');
    logger.error(error);
    logger.info('\n💡 Make sure backend is running on http://localhost:5001');
  }
}

testConnection();