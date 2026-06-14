/**
 * Model exports for AI Front Desk Service
 */

export { Guest, IGuest } from './Guest';
export { ServiceRequest, IServiceRequest, ServiceRequestTypeEnum, ServiceRequestStatusEnum, ServiceRequestPriorityEnum } from './ServiceRequest';
export { Booking, IBooking, BookingStatusEnum } from './Booking';
export { Conversation, IConversation, IConversationMessage, MessageRole } from './Conversation';

import { Guest } from './Guest';
import { ServiceRequest } from './ServiceRequest';
import { Booking } from './Booking';
import { Conversation } from './Conversation';

export const models = {
  Guest,
  ServiceRequest,
  Booking,
  Conversation,
};

export default models;