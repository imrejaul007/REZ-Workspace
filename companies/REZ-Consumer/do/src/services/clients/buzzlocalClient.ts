/**
 * BuzzLocal Client for DO App
 *
 * Connect DO App to AXOM BuzzLocal (Social/Local Discovery)
 * Features: Local Places, Events, Reviews, Social
 */

import axios, { AxiosInstance } from 'axios';

const BUZZLOCAL_URL = process.env.BUZZLOCAL_URL || 'http://localhost:3000';

export class BuzzLocalClient {
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    this.client = axios.create({
      baseURL: BUZZLOCAL_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-Key': apiKey }),
      },
    });
  }

  // =========================================================================
  // PLACES / DISCOVERY
  // =========================================================================

  async searchPlaces(params: {
    query?: string;
    lat: number;
    lng: number;
    radius?: number;
    category?: string;
  }) {
    try {
      const { data } = await this.client.get('/api/places/search', { params });
      return data;
    } catch (error) {
      console.error('BuzzLocal searchPlaces error:', error);
      return { places: [] };
    }
  }

  async getPlaceDetails(placeId: string) {
    try {
      const { data } = await this.client.get(`/api/places/${placeId}`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getPlaceDetails error:', error);
      return null;
    }
  }

  async getNearbyPlaces(params: {
    lat: number;
    lng: number;
    category?: string;
    limit?: number;
  }) {
    try {
      const { data } = await this.client.get('/api/places/nearby', { params });
      return data;
    } catch (error) {
      console.error('BuzzLocal getNearbyPlaces error:', error);
      return { places: [] };
    }
  }

  // =========================================================================
  // REVIEWS
  // =========================================================================

  async getReviews(placeId: string) {
    try {
      const { data } = await this.client.get(`/api/places/${placeId}/reviews`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getReviews error:', error);
      return { reviews: [] };
    }
  }

  async addReview(placeId: string, review: {
    rating: number;
    text: string;
    photos?: string[];
  }) {
    try {
      const { data } = await this.client.post(`/api/places/${placeId}/reviews`, review);
      return data;
    } catch (error) {
      console.error('BuzzLocal addReview error:', error);
      return null;
    }
  }

  async getPlaceRatings(placeId: string) {
    try {
      const { data } = await this.client.get(`/api/places/${placeId}/ratings`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getPlaceRatings error:', error);
      return null;
    }
  }

  // =========================================================================
  // EVENTS
  // =========================================================================

  async searchEvents(params: {
    lat: number;
    lng: number;
    radius?: number;
    date?: string;
    category?: string;
  }) {
    try {
      const { data } = await this.client.get('/api/events/search', { params });
      return data;
    } catch (error) {
      console.error('BuzzLocal searchEvents error:', error);
      return { events: [] };
    }
  }

  async getEventDetails(eventId: string) {
    try {
      const { data } = await this.client.get(`/api/events/${eventId}`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getEventDetails error:', error);
      return null;
    }
  }

  async rsvpEvent(eventId: string, userId: string, attending: boolean) {
    try {
      const { data } = await this.client.post(`/api/events/${eventId}/rsvp`, {
        userId,
        attending,
      });
      return data;
    } catch (error) {
      console.error('BuzzLocal rsvpEvent error:', error);
      return null;
    }
  }

  async createEvent(event: {
    name: string;
    description: string;
    date: string;
    time: string;
    location: { lat: number; lng: number; address: string };
    category: string;
    hostId: string;
  }) {
    try {
      const { data } = await this.client.post('/api/events', event);
      return data;
    } catch (error) {
      console.error('BuzzLocal createEvent error:', error);
      return null;
    }
  }

  // =========================================================================
  // SOCIAL
  // =========================================================================

  async getFeed(userId: string) {
    try {
      const { data } = await this.client.get('/api/feed', {
        params: { userId },
      });
      return data;
    } catch (error) {
      console.error('BuzzLocal getFeed error:', error);
      return { posts: [] };
    }
  }

  async createPost(post: {
    userId: string;
    text: string;
    location?: { lat: number; lng: number };
    taggedPlaces?: string[];
    photos?: string[];
  }) {
    try {
      const { data } = await this.client.post('/api/posts', post);
      return data;
    } catch (error) {
      console.error('BuzzLocal createPost error:', error);
      return null;
    }
  }

  async likePost(postId: string, userId: string) {
    try {
      const { data } = await this.client.post(`/api/posts/${postId}/like`, { userId });
      return data;
    } catch (error) {
      console.error('BuzzLocal likePost error:', error);
      return null;
    }
  }

  async commentOnPost(postId: string, comment: { userId: string; text: string }) {
    try {
      const { data } = await this.client.post(`/api/posts/${postId}/comments`, comment);
      return data;
    } catch (error) {
      console.error('BuzzLocal commentOnPost error:', error);
      return null;
    }
  }

  // =========================================================================
  // FRIENDS
  // =========================================================================

  async getFriends(userId: string) {
    try {
      const { data } = await this.client.get(`/api/users/${userId}/friends`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getFriends error:', error);
      return { friends: [] };
    }
  }

  async getNearbyFriends(userId: string) {
    try {
      const { data } = await this.client.get(`/api/users/${userId}/nearby-friends`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getNearbyFriends error:', error);
      return { friends: [] };
    }
  }

  async addFriend(userId: string, friendId: string) {
    try {
      const { data } = await this.client.post('/api/friends/add', { userId, friendId });
      return data;
    } catch (error) {
      console.error('BuzzLocal addFriend error:', error);
      return null;
    }
  }

  // =========================================================================
  // SAFETY
  // =========================================================================

  async sendSOSAlert(userId: string, location: { lat: number; lng: number }) {
    try {
      const { data } = await this.client.post('/api/safety/sos', {
        userId,
        location,
        timestamp: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('BuzzLocal sendSOSAlert error:', error);
      return null;
    }
  }

  async shareLocation(userId: string, friendIds: string[], duration?: number) {
    try {
      const { data } = await this.client.post('/api/safety/share-location', {
        userId,
        friendIds,
        duration,
      });
      return data;
    } catch (error) {
      console.error('BuzzLocal shareLocation error:', error);
      return null;
    }
  }

  async getTrustedCircle(userId: string) {
    try {
      const { data } = await this.client.get(`/api/safety/${userId}/trusted-circle`);
      return data;
    } catch (error) {
      console.error('BuzzLocal getTrustedCircle error:', error);
      return null;
    }
  }

  // =========================================================================
  // BOOKMARKS
  // =========================================================================

  async bookmarkPlace(userId: string, placeId: string) {
    try {
      const { data } = await this.client.post('/api/bookmarks', { userId, placeId });
      return data;
    } catch (error) {
      console.error('BuzzLocal bookmarkPlace error:', error);
      return null;
    }
  }

  async getBookmarks(userId: string) {
    try {
      const { data } = await this.client.get('/api/bookmarks', {
        params: { userId },
      });
      return data;
    } catch (error) {
      console.error('BuzzLocal getBookmarks error:', error);
      return { bookmarks: [] };
    }
  }

  // =========================================================================
  // DO APP SPECIFIC METHODS
  // =========================================================================

  async getDOAppDashboard(userId: string) {
    const [feed, events, nearby] = await Promise.all([
      this.getFeed(userId),
      this.searchEvents({
        lat: 0,
        lng: 0,
        date: new Date().toISOString().split('T')[0],
      }),
      this.getNearbyPlaces({ lat: 0, lng: 0, limit: 10 }),
    ]);

    return {
      feed,
      events,
      nearbyPlaces: nearby,
      quickActions: {
        explore: true,
        events: true,
        friends: true,
        safety: true,
      },
    };
  }

  async exploreLocal(lat: number, lng: number) {
    const [places, events, friends] = await Promise.all([
      this.getNearbyPlaces({ lat, lng, limit: 20 }),
      this.searchEvents({ lat, lng }),
      this.getNearbyFriends('userId'), // Replace with actual userId
    ]);

    return {
      places,
      events,
      friendsNearby: friends,
    };
  }
}

// Export singleton
export const buzzlocalClient = new BuzzLocalClient();

export default BuzzLocalClient;
