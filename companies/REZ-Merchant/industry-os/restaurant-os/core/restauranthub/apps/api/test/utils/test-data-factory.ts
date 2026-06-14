import { faker } from '@faker-js/faker';
import { UserRole } from '../../src/types/user.types';

export class TestDataFactory {
  static generateUser(overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      passwordHash: '$2b$12$test.hash.value.for.testing',
      role: faker.helpers.arrayElement(['CUSTOMER', 'RESTAURANT', 'VENDOR', 'ADMIN']) as UserRole,
      status: 'ACTIVE',
      isActive: true,
      emailVerifiedAt: faker.date.past(),
      lastLoginAt: faker.date.recent(),
      loginCount: faker.number.int({ min: 1, max: 50 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateUserProfile(userId?: string, overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      userId: userId || faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number('91##########'),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: 'India',
      avatar: faker.image.avatar(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateRestaurant(userId?: string, overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      userId: userId || faker.string.uuid(),
      name: faker.company.name() + ' Restaurant',
      description: faker.lorem.paragraph(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      phone: faker.phone.number('91##########'),
      email: faker.internet.email(),
      cuisineType: faker.helpers.arrayElements(['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai'], { min: 1, max: 3 }),
      averagePrice: faker.number.int({ min: 100, max: 1000 }),
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      isActive: true,
      status: 'ACTIVE',
      openingHours: {
        monday: { open: '09:00', close: '22:00' },
        tuesday: { open: '09:00', close: '22:00' },
        wednesday: { open: '09:00', close: '22:00' },
        thursday: { open: '09:00', close: '22:00' },
        friday: { open: '09:00', close: '23:00' },
        saturday: { open: '09:00', close: '23:00' },
        sunday: { open: '10:00', close: '22:00' },
      },
      images: [faker.image.url(), faker.image.url()],
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateProduct(restaurantId?: string, overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      restaurantId: restaurantId || faker.string.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.number.int({ min: 50, max: 500 }),
      category: faker.helpers.arrayElement(['Appetizer', 'Main Course', 'Dessert', 'Beverage']),
      isVegetarian: faker.datatype.boolean(),
      isVegan: faker.datatype.boolean(),
      isGlutenFree: faker.datatype.boolean(),
      isAvailable: true,
      preparationTime: faker.number.int({ min: 10, max: 60 }),
      ingredients: faker.helpers.arrayElements(['Tomato', 'Onion', 'Garlic', 'Spices', 'Oil', 'Salt'], { min: 3, max: 6 }),
      allergens: faker.helpers.arrayElements(['Nuts', 'Dairy', 'Gluten'], { min: 0, max: 2 }),
      nutritionInfo: {
        calories: faker.number.int({ min: 100, max: 800 }),
        protein: faker.number.int({ min: 5, max: 50 }),
        carbs: faker.number.int({ min: 10, max: 100 }),
        fat: faker.number.int({ min: 2, max: 30 }),
      },
      images: [faker.image.url(), faker.image.url()],
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateOrder(customerId?: string, restaurantId?: string, overrides: Partial<unknown> = {}) {
    const subtotal = faker.number.int({ min: 200, max: 2000 });
    const taxRate = 0.18; // 18% GST
    const deliveryFee = faker.number.int({ min: 20, max: 80 });
    const taxAmount = Math.round(subtotal * taxRate);
    const totalAmount = subtotal + taxAmount + deliveryFee;

    return {
      id: faker.string.uuid(),
      customerId: customerId || faker.string.uuid(),
      restaurantId: restaurantId || faker.string.uuid(),
      status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
      orderType: faker.helpers.arrayElement(['DELIVERY', 'PICKUP', 'DINE_IN']),
      subtotal,
      taxAmount,
      deliveryFee,
      discount: faker.number.int({ min: 0, max: 200 }),
      totalAmount,
      currency: 'INR',
      paymentStatus: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']),
      paymentMethod: faker.helpers.arrayElement(['CARD', 'UPI', 'WALLET', 'COD']),
      deliveryAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        landmark: faker.location.secondaryAddress(),
        contactNumber: faker.phone.number('91##########'),
      },
      estimatedDeliveryTime: faker.date.future(),
      actualDeliveryTime: null,
      notes: faker.lorem.sentence(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateOrderItem(orderId?: string, productId?: string, overrides: Partial<unknown> = {}) {
    const quantity = faker.number.int({ min: 1, max: 5 });
    const price = faker.number.int({ min: 50, max: 500 });

    return {
      id: faker.string.uuid(),
      orderId: orderId || faker.string.uuid(),
      productId: productId || faker.string.uuid(),
      quantity,
      price,
      totalPrice: quantity * price,
      specialInstructions: faker.lorem.sentence(),
      customizations: {},
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateReview(customerId?: string, restaurantId?: string, orderId?: string, overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      customerId: customerId || faker.string.uuid(),
      restaurantId: restaurantId || faker.string.uuid(),
      orderId: orderId || faker.string.uuid(),
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.paragraph(),
      foodRating: faker.number.int({ min: 1, max: 5 }),
      serviceRating: faker.number.int({ min: 1, max: 5 }),
      deliveryRating: faker.number.int({ min: 1, max: 5 }),
      images: faker.helpers.maybe(() => [faker.image.url(), faker.image.url()], { probability: 0.3 }),
      isVerified: true,
      response: faker.helpers.maybe(() => faker.lorem.paragraph(), { probability: 0.4 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateVerificationAttempt(userId?: string, type: 'AADHAAR' | 'PAN' = 'AADHAAR', overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      userId: userId || faker.string.uuid(),
      type,
      requestData: {
        hashedNumber: faker.string.hexadecimal({ length: 64 }),
        name: faker.person.fullName(),
        hasDateOfBirth: faker.datatype.boolean(),
        hasAddress: type === 'AADHAAR' ? faker.datatype.boolean() : undefined,
        hasPhone: type === 'AADHAAR' ? faker.datatype.boolean() : undefined,
        hasFatherName: type === 'PAN' ? faker.datatype.boolean() : undefined,
      },
      success: faker.datatype.boolean({ probability: 0.8 }),
      matchScore: faker.number.float({ min: 0.5, max: 1, fractionDigits: 2 }),
      verificationId: `${type.toLowerCase()}_verify_${Date.now()}_${faker.string.alphanumeric(6)}`,
      details: {
        nameMatch: faker.datatype.boolean({ probability: 0.9 }),
        dobMatch: faker.helpers.maybe(() => faker.datatype.boolean({ probability: 0.8 }), { probability: 0.7 }),
        addressMatch: type === 'AADHAAR' ? faker.helpers.maybe(() => faker.datatype.boolean({ probability: 0.7 }), { probability: 0.6 }) : undefined,
        phoneMatch: type === 'AADHAAR' ? faker.helpers.maybe(() => faker.datatype.boolean({ probability: 0.8 }), { probability: 0.5 }) : undefined,
        fatherNameMatch: type === 'PAN' ? faker.helpers.maybe(() => faker.datatype.boolean({ probability: 0.8 }), { probability: 0.6 }) : undefined,
        panStatus: type === 'PAN' ? faker.helpers.arrayElement(['VALID', 'INVALID', 'DEACTIVATED', 'BLOCKED']) : undefined,
      },
      errorMessage: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
      createdAt: faker.date.past(),
      ...overrides,
    };
  }

  static generatePayment(orderId?: string, overrides: Partial<unknown> = {}) {
    const amount = faker.number.int({ min: 100, max: 5000 });

    return {
      id: faker.string.uuid(),
      orderId: orderId || faker.string.uuid(),
      amount,
      currency: 'INR',
      status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']),
      method: faker.helpers.arrayElement(['STRIPE', 'RAZORPAY']),
      provider: faker.helpers.arrayElement(['CARD', 'UPI', 'NETBANKING', 'WALLET']),
      transactionId: faker.string.alphanumeric(20),
      providerTransactionId: faker.string.alphanumeric(30),
      gatewayResponse: {
        status: 'success',
        message: 'Payment completed successfully',
        reference: faker.string.alphanumeric(15),
      },
      refundAmount: 0,
      refundReason: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static generateNotification(userId?: string, overrides: Partial<unknown> = {}) {
    return {
      id: faker.string.uuid(),
      userId: userId || faker.string.uuid(),
      type: faker.helpers.arrayElement(['ORDER_UPDATE', 'PAYMENT_SUCCESS', 'VERIFICATION_STATUS', 'PROMOTION', 'SYSTEM']),
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      message: faker.lorem.paragraph(),
      data: {
        orderId: faker.helpers.maybe(() => faker.string.uuid(), { probability: 0.5 }),
        amount: faker.helpers.maybe(() => faker.number.int({ min: 100, max: 2000 }), { probability: 0.3 }),
        actionUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.4 }),
      },
      isRead: faker.datatype.boolean({ probability: 0.3 }),
      readAt: null,
      channels: faker.helpers.arrayElements(['PUSH', 'EMAIL', 'SMS'], { min: 1, max: 2 }),
      priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      expiresAt: faker.date.future(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  // Test scenario helpers
  static generateCompleteUserWithProfile(role: UserRole = 'CUSTOMER') {
    const user = this.generateUser({ role });
    const profile = this.generateUserProfile(user.id);
    
    return { user, profile };
  }

  static generateRestaurantWithProducts(productCount: number = 5) {
    const { user, profile } = this.generateCompleteUserWithProfile('RESTAURANT');
    const restaurant = this.generateRestaurant(user.id);
    const products = Array.from({ length: productCount }, () => 
      this.generateProduct(restaurant.id)
    );

    return { user, profile, restaurant, products };
  }

  static generateCompleteOrderScenario() {
    const { user: customer, profile: customerProfile } = this.generateCompleteUserWithProfile('CUSTOMER');
    const { user: restaurantUser, restaurant, products } = this.generateRestaurantWithProducts(3);
    
    const order = this.generateOrder(customer.id, restaurant.id, { status: 'PENDING' });
    const orderItems = products.slice(0, 2).map(product => 
      this.generateOrderItem(order.id, product.id)
    );
    const payment = this.generatePayment(order.id, { status: 'COMPLETED' });

    return {
      customer,
      customerProfile,
      restaurantUser,
      restaurant,
      products,
      order,
      orderItems,
      payment,
    };
  }

  static generateVerificationScenario(userId?: string) {
    const aadhaarAttempt = this.generateVerificationAttempt(userId, 'AADHAAR', { success: true });
    const panAttempt = this.generateVerificationAttempt(userId, 'PAN', { success: true });
    
    return {
      aadhaarAttempt,
      panAttempt,
    };
  }

  // Validation helpers
  static isValidAadhaarNumber(aadhaar: string): boolean {
    return /^[0-9]{12}$/.test(aadhaar);
  }

  static isValidPanNumber(pan: string): boolean {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan);
  }

  static isValidPhoneNumber(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(phone);
  }

  static isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}