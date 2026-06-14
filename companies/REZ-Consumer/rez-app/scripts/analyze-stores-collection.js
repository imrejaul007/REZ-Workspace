import logger from './utils/logger';

const { MongoClient } = require('mongodb');

// MongoDB connection details
const MONGODB_URI = 'mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'test';

async function analyzeStoresCollection() {
  const client = new MongoClient(MONGODB_URI);

  try {
    logger.info('🔌 Connecting to MongoDB...\n');
    await client.connect();
    logger.info('✅ Connected successfully!\n');

    const db = client.db(DB_NAME);
    const storesCollection = db.collection('stores');

    // 1. Get total count of stores
    logger.info('📊 STORE STATISTICS');
    console.log('='.repeat(80));
    const totalStores = await storesCollection.countDocuments();
    logger.info(`Total Stores: ${totalStores}\n`);

    // 2. Get sample stores (first 5 with all fields)
    logger.info('📋 SAMPLE STORES (First 3)');
    console.log('='.repeat(80));
    const sampleStores = await storesCollection.find({}).limit(3).toArray();
    sampleStores.forEach((store, index) => {
      logger.info(`\n--- Store ${index + 1}: ${store.name || 'Unnamed'} ---`);
      console.log(JSON.stringify(store, null, 2));
    });

    // 3. Distribution by delivery categories
    logger.info('\n\n🏷️  DELIVERY CATEGORY DISTRIBUTION');
    console.log('='.repeat(80));

    const categories = [
      'fastDelivery',
      'budgetFriendly',
      'premium',
      'organic',
      'alliance',
      'lowestPrice',
      'mall',
      'cashStore'
    ];

    for (const category of categories) {
      const count = await storesCollection.countDocuments({ [category]: true });
      const percentage = totalStores > 0 ? ((count / totalStores) * 100).toFixed(2) : 0;
      logger.info(`${category.padEnd(20)}: ${count.toString().padStart(4)} stores (${percentage}%)`);
    }

    // 4. Check stores with location coordinates
    logger.info('\n\n📍 LOCATION DATA');
    console.log('='.repeat(80));

    const storesWithCoordinates = await storesCollection.countDocuments({
      'location.coordinates': { $exists: true, $ne: null }
    });
    const storesWithLatLng = await storesCollection.countDocuments({
      'location.latitude': { $exists: true, $ne: null },
      'location.longitude': { $exists: true, $ne: null }
    });
    const storesWithAddress = await storesCollection.countDocuments({
      'location.address': { $exists: true, $ne: null }
    });
    const storesWithCity = await storesCollection.countDocuments({
      'location.city': { $exists: true, $ne: null }
    });

    logger.info(`Stores with coordinates array:     ${storesWithCoordinates} (${((storesWithCoordinates/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with latitude/longitude:    ${storesWithLatLng} (${((storesWithLatLng/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with address:               ${storesWithAddress} (${((storesWithAddress/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with city:                  ${storesWithCity} (${((storesWithCity/totalStores)*100).toFixed(2)}%)`);

    // 5. Check operational info
    logger.info('\n\n⚙️  OPERATIONAL INFORMATION');
    console.log('='.repeat(80));

    const storesWithDeliveryTime = await storesCollection.countDocuments({
      deliveryTime: { $exists: true, $ne: null }
    });
    const storesWithMinOrder = await storesCollection.countDocuments({
      minimumOrder: { $exists: true, $ne: null }
    });
    const storesWithPaymentMethods = await storesCollection.countDocuments({
      paymentMethods: { $exists: true, $ne: null }
    });
    const storesWithRating = await storesCollection.countDocuments({
      rating: { $exists: true, $ne: null }
    });
    const storesWithImage = await storesCollection.countDocuments({
      image: { $exists: true, $ne: null }
    });

    logger.info(`Stores with deliveryTime:          ${storesWithDeliveryTime} (${((storesWithDeliveryTime/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with minimumOrder:          ${storesWithMinOrder} (${((storesWithMinOrder/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with paymentMethods:        ${storesWithPaymentMethods} (${((storesWithPaymentMethods/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with rating:                ${storesWithRating} (${((storesWithRating/totalStores)*100).toFixed(2)}%)`);
    logger.info(`Stores with image:                 ${storesWithImage} (${((storesWithImage/totalStores)*100).toFixed(2)}%)`);

    // 6. Get all unique field names across all stores
    logger.info('\n\n📝 SCHEMA ANALYSIS');
    console.log('='.repeat(80));

    const allStores = await storesCollection.find({}).toArray();
    const allFields = new Set();
    allStores.forEach(store => {
      Object.keys(store).forEach(key => allFields.add(key));
    });

    logger.info('All fields found in stores collection:');
    console.log(Array.from(allFields).sort().join(', '));

    // 7. Check for missing critical fields
    logger.info('\n\n⚠️  DATA QUALITY ISSUES');
    console.log('='.repeat(80));

    const storesWithoutName = await storesCollection.countDocuments({
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' }
      ]
    });

    const storesWithoutCategory = await storesCollection.countDocuments({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: '' }
      ]
    });

    const storesWithoutLocation = await storesCollection.countDocuments({
      $or: [
        { location: { $exists: false } },
        { location: null }
      ]
    });

    logger.info(`❌ Stores without name:             ${storesWithoutName}`);
    logger.info(`❌ Stores without category:         ${storesWithoutCategory}`);
    logger.info(`❌ Stores without location object:  ${storesWithoutLocation}`);

    // 8. Category distribution
    logger.info('\n\n🏪 STORE CATEGORIES');
    console.log('='.repeat(80));

    const categoryAggregation = await storesCollection.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    categoryAggregation.forEach(cat => {
      const percentage = ((cat.count / totalStores) * 100).toFixed(2);
      logger.info(`${(cat._id || 'Uncategorized').padEnd(30)}: ${cat.count.toString().padStart(4)} stores (${percentage}%)`);
    });

    // 9. Sample location structure
    logger.info('\n\n📍 SAMPLE LOCATION STRUCTURES');
    console.log('='.repeat(80));

    const storeWithLocation = await storesCollection.findOne({
      'location': { $exists: true, $ne: null }
    });

    if (storeWithLocation && storeWithLocation.location) {
      logger.info('Sample location object:');
      console.log(JSON.stringify(storeWithLocation.location, null, 2));
    } else {
      logger.info('No stores with location data found');
    }

    logger.info('\n\n✅ Analysis Complete!\n');

  } catch (error) {
    console.error('❌ Error analyzing stores collection:', error);
    throw error;
  } finally {
    await client.close();
    logger.info('🔌 Database connection closed');
  }
}

// Run the analysis
analyzeStoresCollection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
