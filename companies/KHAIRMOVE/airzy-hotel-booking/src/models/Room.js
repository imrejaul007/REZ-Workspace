/**
 * Room Model
 * Defines the structure for hotel room data
 */

class Room {
  constructor(data) {
    this.id = data.id;
    this.hotelId = data.hotelId || data.hotel_id;
    this.name = data.name;
    this.type = data.type || 'standard';
    this.description = data.description || '';
    this.capacity = {
      adults: data.capacity?.adults || data.maxAdults || 2,
      children: data.capacity?.children || data.maxChildren || 0,
      total: data.capacity?.total || data.maxGuests || 2
    };
    this.bedConfiguration = data.bedConfiguration || {
      king: 0,
      queen: 0,
      twin: 0,
      description: '1 King bed'
    };
    this.price = {
      base: data.price?.base || data.basePrice || 0,
      perNight: data.price?.perNight || data.pricePerNight || 0,
      currency: data.price?.currency || 'USD'
    };
    this.availability = {
      total: data.availability?.total || data.totalRooms || 10,
      available: data.availability?.available || data.availableRooms || 10
    };
    this.amenities = data.amenities || [];
    this.images = data.images || [];
    this.size = data.size || {
      sqm: 25,
      sqft: 269
    };
    this.view = data.view || 'City view';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      hotelId: this.hotelId,
      name: this.name,
      type: this.type,
      description: this.description,
      capacity: this.capacity,
      bedConfiguration: this.bedConfiguration,
      price: this.price,
      availability: this.availability,
      amenities: this.amenities,
      images: this.images,
      size: this.size,
      view: this.view,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  calculateTotalPrice(nights, guests) {
    const basePrice = this.price.perNight * nights;
    const extraGuestFee = guests > this.capacity.adults ? (guests - this.capacity.adults) * 20 : 0;
    const taxes = basePrice * 0.12; // 12% tax
    return {
      base: basePrice,
      extraGuestFee,
      taxes,
      total: basePrice + extraGuestFee + taxes,
      currency: this.price.currency
    };
  }

  isAvailableForDates(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return this.availability.available > 0 && checkInDate < checkOutDate;
  }

  static fromDatabase(doc) {
    return new Room(doc);
  }
}

module.exports = Room;