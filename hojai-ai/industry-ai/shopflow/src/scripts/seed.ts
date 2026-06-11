import { Product, Customer, Sale, Inventory } from '../models';
import mongoose from 'mongoose';
import { config } from '../config';

const sampleProducts = [
  { sku: 'ELEC001', name: 'Wireless Earbuds Pro', category: 'Electronics', price: 79.99, cost: 35.00, stock: 50, lowStockThreshold: 10 },
  { sku: 'ELEC002', name: 'Smart Watch Band', category: 'Electronics', price: 24.99, cost: 8.00, stock: 100, lowStockThreshold: 20 },
  { sku: 'CLOTH001', name: 'Premium Cotton T-Shirt', category: 'Clothing', price: 29.99, cost: 12.00, stock: 75, lowStockThreshold: 15 },
  { sku: 'CLOTH002', name: 'Denim Jeans Slim Fit', category: 'Clothing', price: 59.99, cost: 25.00, stock: 30, lowStockThreshold: 8 },
  { sku: 'HOME001', name: 'Scented Candle Set', category: 'Home', price: 19.99, cost: 6.00, stock: 200, lowStockThreshold: 30 },
  { sku: 'HOME002', name: 'Bamboo Organizer', category: 'Home', price: 34.99, cost: 12.00, stock: 5, lowStockThreshold: 10 },
  { sku: 'FOOD001', name: 'Organic Coffee Beans 500g', category: 'Food', price: 14.99, cost: 5.00, stock: 150, lowStockThreshold: 25 },
  { sku: 'FOOD002', name: 'Premium Tea Collection', category: 'Food', price: 22.99, cost: 8.00, stock: 0, lowStockThreshold: 15 },
  { sku: 'SPORT001', name: 'Yoga Mat Premium', category: 'Sports', price: 39.99, cost: 15.00, stock: 45, lowStockThreshold: 10 },
  { sku: 'SPORT002', name: 'Resistance Bands Set', category: 'Sports', price: 19.99, cost: 5.00, stock: 80, lowStockThreshold: 20 },
];

const sampleCustomers = [
  { name: 'John Smith', phone: '+1234567890', email: 'john.smith@email.com', loyaltyPoints: 2500, tier: 'silver', totalSpent: 1250.00, purchaseCount: 8 },
  { name: 'Sarah Johnson', phone: '+1234567891', email: 'sarah.j@email.com', loyaltyPoints: 8500, tier: 'gold', totalSpent: 5200.00, purchaseCount: 25 },
  { name: 'Mike Wilson', phone: '+1234567892', email: 'mike.w@email.com', loyaltyPoints: 500, tier: 'bronze', totalSpent: 320.00, purchaseCount: 3 },
  { name: 'Emily Davis', phone: '+1234567893', email: 'emily.d@email.com', loyaltyPoints: 18000, tier: 'platinum', totalSpent: 15000.00, purchaseCount: 85 },
  { name: 'Chris Brown', phone: '+1234567894', email: 'chris.b@email.com', loyaltyPoints: 1200, tier: 'silver', totalSpent: 980.00, purchaseCount: 6 },
];

export async function seedDatabase(): Promise<void> {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await Promise.all([
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Sale.deleteMany({}),
      Inventory.deleteMany({}),
    ]);

    console.log('Cleared existing data');

    // Insert products
    const products = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${products.length} products`);

    // Create inventory for each product
    const inventories = products.map((product, index) => ({
      productId: product._id,
      quantity: sampleProducts[index].stock,
      lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      minStock: sampleProducts[index].lowStockThreshold,
      maxStock: sampleProducts[index].stock * 5 || 100,
    }));

    await Inventory.insertMany(inventories);
    console.log(`Created ${inventories.length} inventory records`);

    // Insert customers
    const customers = await Customer.insertMany(sampleCustomers);
    console.log(`Inserted ${customers.length} customers`);

    // Create some sample sales
    const sales = [];
    for (let i = 0; i < 15; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const numItems = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const discount = Math.random() > 0.7 ? product.price * 0.1 : 0;
        const total = (product.price - discount) * quantity;
        subtotal += total;

        items.push({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          quantity,
          price: product.price,
          discount,
          total,
        });
      }

      const tax = subtotal * 0.08;
      const total = subtotal + tax;

      sales.push({
        customerId: customer._id,
        items,
        subtotal,
        tax,
        discount: items.reduce((sum, item) => sum + (item.discount || 0), 0),
        total,
        paymentMethod: ['cash', 'card', 'digital'][Math.floor(Math.random() * 3)],
        status: 'completed',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    await Sale.insertMany(sales);
    console.log(`Created ${sales.length} sample sales`);

    console.log('Database seeding completed successfully!');
    console.log(`Total products: ${products.length}`);
    console.log(`Total customers: ${customers.length}`);
    console.log(`Total sales: ${sales.length}`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  mongoose.connect(config.mongoUri)
    .then(() => seedDatabase())
    .then(() => mongoose.disconnect())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}