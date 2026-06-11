export { Product, IProduct } from './Product';
export { Customer, ICustomer, LoyaltyTier } from './Customer';
export { Sale, ISale, ISaleItem, SaleStatus, PaymentMethod } from './Sale';
export { Inventory, IInventory } from './Inventory';

import { Product } from './Product';
import { Customer } from './Customer';
import { Sale } from './Sale';
import { Inventory } from './Inventory';

export const models = {
  Product,
  Customer,
  Sale,
  Inventory,
};

export default models;
