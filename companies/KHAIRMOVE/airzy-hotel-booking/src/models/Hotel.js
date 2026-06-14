/**
 * Hotel Model
 * Defines the structure for hotel data
 */

class Hotel {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description || '';
    this.location = {
      city: data.location?.city || data.city || '',
      state: data.location?.state || data.state || '',
      country: data.location?.country || data.country || '',
      address: data.location?.address || data.address || '',
      coordinates: data.location?.coordinates || { lat: 0, lng: 0 }
    };
    this.starRating = data.starRating || data.star_rating || 3;
    this.amenities = data.amenities || [];
    this.images = data.images || [];
    this.priceRange = {
      min: data.priceRange?.min || data.priceRange?.minPrice || data.minPrice || 0,
      max: data.priceRange?.max || data.priceRange?.maxPrice || data.maxPrice || 1000
    };
    this.rooms = data.rooms || [];
    this.reviews = data.reviews || [];
    this.policies = data.policies || {
      checkIn: '14:00',
      checkOut: '11:00',
      cancellation: 'Free cancellation up to 24 hours before check-in',
      childPolicy: 'Children welcome',
      petPolicy: 'Pets allowed with fee'
    };
    this.contact = data.contact || {
      phone: '',
      email: '',
      website: ''
    };
    this.ratings = data.ratings || {
      overall: 0,
      cleanliness: 0,
      service: 0,
      location: 0,
      value: 0
    };
    this.reviewCount = data.reviewCount || data.review_count || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      location: this.location,
      starRating: this.starRating,
      amenities: this.amenities,
      images: this.images,
      priceRange: this.priceRange,
      rooms: this.rooms,
      policies: this.policies,
      contact: this.contact,
      ratings: this.ratings,
      reviewCount: this.reviewCount,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(doc) {
    return new Hotel(doc);
  }
}

module.exports = Hotel;