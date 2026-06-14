import { StoreType } from '@/lib/types';

interface StoreUICopy {
  addToCartLabel: string;
  orderConfirmMessage: string;
  preparingMessage: string;
  readyMessage: string;
  itemLabel: string;
  categoryLabel: string;
}

const COPY: Record<StoreType, StoreUICopy> = {
  restaurant: {
    addToCartLabel: 'Add',
    orderConfirmMessage: 'Your order has been confirmed!',
    preparingMessage: 'Your food is being prepared',
    readyMessage: 'Your food is ready!',
    itemLabel: 'dish',
    categoryLabel: 'category',
  },
  cafe: {
    addToCartLabel: 'Add',
    orderConfirmMessage: 'Your order has been confirmed!',
    preparingMessage: 'Your order is being prepared',
    readyMessage: 'Your order is ready!',
    itemLabel: 'item',
    categoryLabel: 'category',
  },
  cloud_kitchen: {
    addToCartLabel: 'Add',
    orderConfirmMessage: 'Your order is confirmed!',
    preparingMessage: 'Your order is being packed',
    readyMessage: 'Order packed and ready!',
    itemLabel: 'item',
    categoryLabel: 'category',
  },
  retail: {
    addToCartLabel: 'Add to bag',
    orderConfirmMessage: 'Your order is confirmed!',
    preparingMessage: 'Your items are being packed',
    readyMessage: 'Your order is ready for pickup!',
    itemLabel: 'product',
    categoryLabel: 'category',
  },
  salon: {
    addToCartLabel: 'Book',
    orderConfirmMessage: 'Appointment confirmed!',
    preparingMessage: 'Getting ready for you',
    readyMessage: 'Ready for you!',
    itemLabel: 'service',
    categoryLabel: 'service type',
  },
  hotel: {
    addToCartLabel: 'Add',
    orderConfirmMessage: 'Your order is confirmed!',
    preparingMessage: 'Your order is being prepared',
    readyMessage: 'Your order is on its way!',
    itemLabel: 'item',
    categoryLabel: 'category',
  },
  service: {
    addToCartLabel: 'Select',
    orderConfirmMessage: 'Payment confirmed!',
    preparingMessage: 'Processing',
    readyMessage: 'Done!',
    itemLabel: 'service',
    categoryLabel: 'service type',
  },
  general: {
    addToCartLabel: 'Add',
    orderConfirmMessage: 'Payment confirmed!',
    preparingMessage: 'Processing your order',
    readyMessage: 'Ready!',
    itemLabel: 'item',
    categoryLabel: 'category',
  },
};

export function getUICopy(storeType: StoreType): StoreUICopy {
  return COPY[storeType] || COPY.general;
}
