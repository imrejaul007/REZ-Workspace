"use strict";
/**
 * HOJAI AI Recommendation Engine - In-Memory Data Store
 *
 * Mock data store for development.
 * In production, this would connect to a real database.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMockData = initializeMockData;
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.getProductsByIds = getProductsByIds;
exports.addPurchase = addPurchase;
exports.getTrendingItems = getTrendingItems;
exports.getFrequentlyBoughtTogether = getFrequentlyBoughtTogether;
exports.getUserPurchaseHistory = getUserPurchaseHistory;
exports.getUserPurchasedProductIds = getUserPurchasedProductIds;
exports.getProductsByCategory = getProductsByCategory;
exports.getAllCategories = getAllCategories;
exports.recordPurchase = recordPurchase;
exports.getDataStats = getDataStats;
const embedding_js_1 = require("../utils/embedding.js");
const logger_js_1 = require("../utils/logger.js");
// In-memory stores
const products = new Map();
const purchases = [];
const purchasePatterns = new Map();
const trendingItems = new Map();
/**
 * Initialize mock product data
 */
function initializeMockData() {
    logger_js_1.logger.info('Initializing mock product data...');
    const mockProducts = [
        { id: 'p1', name: 'Wireless Headphones', category: 'electronics', price: 99.99, tags: ['audio', 'wireless', 'bluetooth'] },
        { id: 'p2', name: 'Bluetooth Speaker', category: 'electronics', price: 49.99, tags: ['audio', 'portable', 'wireless'] },
        { id: 'p3', name: 'Smart Watch', category: 'electronics', price: 199.99, tags: ['wearable', 'fitness', 'smart'] },
        { id: 'p4', name: 'Laptop Stand', category: 'accessories', price: 39.99, tags: ['office', 'ergonomic'] },
        { id: 'p5', name: 'USB-C Hub', category: 'accessories', price: 59.99, tags: ['connectivity', 'usb', 'laptop'] },
        { id: 'p6', name: 'Mechanical Keyboard', category: 'electronics', price: 129.99, tags: ['keyboard', 'gaming', 'mechanical'] },
        { id: 'p7', name: 'Wireless Mouse', category: 'electronics', price: 29.99, tags: ['mouse', 'wireless', 'ergonomic'] },
        { id: 'p8', name: 'Monitor Light Bar', category: 'accessories', price: 45.99, tags: ['lighting', 'desk', 'productivity'] },
        { id: 'p9', name: 'Webcam HD', category: 'electronics', price: 79.99, tags: ['video', 'streaming', 'camera'] },
        { id: 'p10', name: 'Desk Mat', category: 'accessories', price: 19.99, tags: ['desk', 'office', 'gaming'] },
        { id: 'p11', name: 'Phone Case', category: 'accessories', price: 15.99, tags: ['phone', 'protection'] },
        { id: 'p12', name: 'Screen Protector', category: 'accessories', price: 9.99, tags: ['phone', 'protection', 'screen'] },
        { id: 'p13', name: 'Charging Cable', category: 'accessories', price: 12.99, tags: ['charging', 'usb', 'cable'] },
        { id: 'p14', name: 'Power Bank', category: 'electronics', price: 35.99, tags: ['portable', 'charging', 'power'] },
        { id: 'p15', name: 'Earbuds', category: 'electronics', price: 149.99, tags: ['audio', 'wireless', 'earbuds'] },
        { id: 'p16', name: 'Smart Home Hub', category: 'electronics', price: 89.99, tags: ['smart-home', 'iot', 'automation'] },
        { id: 'p17', name: 'Fitness Tracker', category: 'electronics', price: 79.99, tags: ['fitness', 'wearable', 'health'] },
        { id: 'p18', name: 'Tablet Stand', category: 'accessories', price: 24.99, tags: ['tablet', 'stand', 'office'] },
        { id: 'p19', name: 'Laptop Sleeve', category: 'accessories', price: 29.99, tags: ['laptop', 'protection', 'travel'] },
        { id: 'p20', name: 'Portable SSD', category: 'electronics', price: 89.99, tags: ['storage', 'portable', 'ssd'] },
    ];
    const now = Date.now();
    for (const product of mockProducts) {
        const fullProduct = {
            ...product,
            embedding: (0, embedding_js_1.textToEmbedding)(product.name + ' ' + product.tags.join(' ')),
            createdAt: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        products.set(product.id, fullProduct);
    }
    // Initialize trending data based on categories
    for (const product of products.values()) {
        const purchaseCount = Math.floor(Math.random() * 100) + 10;
        const recentPurchases = Math.floor(Math.random() * 50);
        trendingItems.set(product.id, {
            productId: product.id,
            purchaseCount,
            recentPurchases,
            velocity: recentPurchases / 7, // purchases per day
        });
    }
    logger_js_1.logger.info(`Initialized ${products.size} products`);
}
/**
 * Get all products
 */
function getAllProducts() {
    return Array.from(products.values());
}
/**
 * Get product by ID
 */
function getProductById(id) {
    return products.get(id);
}
/**
 * Get multiple products by IDs
 */
function getProductsByIds(ids) {
    return ids
        .map(id => products.get(id))
        .filter((p) => p !== undefined);
}
/**
 * Add a purchase record
 */
function addPurchase(purchase) {
    purchases.push(purchase);
    // Update purchase patterns
    updatePurchasePatterns(purchase);
    // Update trending
    updateTrending(purchase.productId);
}
/**
 * Update purchase patterns for co-purchase analysis
 */
function updatePurchasePatterns(purchase) {
    const userPurchases = purchases.filter(p => p.userId === purchase.userId);
    const productIds = userPurchases.map(p => p.productId);
    for (const otherProductId of productIds) {
        if (otherProductId === purchase.productId)
            continue;
        let pattern = purchasePatterns.get(purchase.productId);
        if (!pattern) {
            pattern = {
                productId: purchase.productId,
                relatedProducts: new Map(),
                totalPurchases: 0,
            };
            purchasePatterns.set(purchase.productId, pattern);
        }
        const currentFreq = pattern.relatedProducts.get(otherProductId) ?? 0;
        pattern.relatedProducts.set(otherProductId, currentFreq + 1);
        pattern.totalPurchases++;
    }
}
/**
 * Update trending data for a product
 */
function updateTrending(productId) {
    const item = trendingItems.get(productId);
    if (item) {
        item.purchaseCount++;
        item.recentPurchases++;
        item.velocity = item.recentPurchases / 7;
    }
}
/**
 * Get trending items for the last N days
 */
function getTrendingItems(days = 7, limit = 10) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentPurchases = purchases.filter(p => new Date(p.timestamp).getTime() > cutoff);
    // Count purchases per product
    const counts = new Map();
    for (const purchase of recentPurchases) {
        const count = counts.get(purchase.productId) ?? 0;
        counts.set(purchase.productId, count + purchase.quantity);
    }
    // Convert to array and sort
    const trending = Array.from(counts.entries())
        .map(([productId, purchaseCount]) => {
        return {
            productId,
            purchaseCount,
            recentPurchases: purchaseCount,
            velocity: purchaseCount / days,
        };
    })
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, limit);
    return trending;
}
/**
 * Get purchase patterns for a product (frequently bought together)
 */
function getFrequentlyBoughtTogether(productId, limit = 10) {
    const pattern = purchasePatterns.get(productId);
    if (!pattern) {
        return [];
    }
    const related = Array.from(pattern.relatedProducts.entries())
        .map(([id, frequency]) => ({ productId: id, frequency }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, limit);
    return related;
}
/**
 * Get user's purchase history
 */
function getUserPurchaseHistory(userId) {
    return purchases.filter(p => p.userId === userId);
}
/**
 * Get user's purchased product IDs
 */
function getUserPurchasedProductIds(userId) {
    const purchases = getUserPurchaseHistory(userId);
    return new Set(purchases.map(p => p.productId));
}
/**
 * Get products by category
 */
function getProductsByCategory(category) {
    return Array.from(products.values()).filter(p => p.category === category);
}
/**
 * Get all unique categories
 */
function getAllCategories() {
    const categories = new Set();
    for (const product of products.values()) {
        categories.add(product.category);
    }
    return Array.from(categories);
}
/**
 * Record a purchase (for API usage)
 */
function recordPurchase(userId, productId, quantity = 1) {
    addPurchase({
        userId,
        productId,
        quantity,
        timestamp: new Date().toISOString(),
    });
}
/**
 * Get data store stats
 */
function getDataStats() {
    return {
        productCount: products.size,
        purchaseCount: purchases.length,
        patternCount: purchasePatterns.size,
        categories: getAllCategories(),
    };
}
// Initialize data on module load
initializeMockData();
//# sourceMappingURL=dataStore.js.map