import { Injectable } from '@nestjs/common';

interface MockUser {
  id: string;
  email: string;
  passwordHash?: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: MockProfile;
}

interface MockProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  dateOfBirth?: Date;
  bio?: string;
}

interface MockRestaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  cuisineType: string[];
  priceRange: string;
  rating: number;
  isActive: boolean;
  status: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockJob {
  id: string;
  title: string;
  description: string;
  restaurantId: string;
  location: string;
  salary: number;
  salaryType: string;
  requirements: string[];
  status: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class MockDatabaseService {
  private users: Map<string, MockUser> = new Map();
  private profiles: Map<string, MockProfile> = new Map();
  private restaurants: Map<string, MockRestaurant> = new Map();
  private jobs: Map<string, MockJob> = new Map();
  private sessions: Map<string, MockSession> = new Map();

  // User operations
  async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    const id = userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: MockUser = {
      id,
      email: userData.email || '',
      passwordHash: userData.passwordHash,
      role: userData.role || 'CUSTOMER',
      status: userData.status || 'ACTIVE',
      isActive: userData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    };

    this.users.set(id, user);
    return user;
  }

  async findUserById(id: string): Promise<MockUser | null> {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email: string): Promise<MockUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, userData: Partial<MockUser>): Promise<MockUser | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async findManyUsers(options: unknown = {}): Promise<MockUser[]> {
    let users = Array.from(this.users.values());

    if (options.where) {
      users = users.filter(user => {
        return Object.entries(options.where).every(([key, value]) => {
          return user[key as keyof MockUser] === value;
        });
      });
    }

    if (options.take) {
      users = users.slice(0, options.take);
    }

    return users;
  }

  // Profile operations
  async createProfile(profileData: Partial<MockProfile>): Promise<MockProfile> {
    const id = profileData.id || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const profile: MockProfile = {
      id,
      userId: profileData.userId || '',
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      phone: profileData.phone,
      avatar: profileData.avatar,
      dateOfBirth: profileData.dateOfBirth,
      bio: profileData.bio,
      ...profileData,
    };

    this.profiles.set(id, profile);

    // Link to user
    if (profile.userId) {
      const user = this.users.get(profile.userId);
      if (user) {
        user.profile = profile;
        this.users.set(profile.userId, user);
      }
    }

    return profile;
  }

  async findProfileByUserId(userId: string): Promise<MockProfile | null> {
    for (const profile of this.profiles.values()) {
      if (profile.userId === userId) {
        return profile;
      }
    }
    return null;
  }

  // Restaurant operations
  async createRestaurant(restaurantData: Partial<MockRestaurant>): Promise<MockRestaurant> {
    const id = restaurantData.id || `restaurant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const restaurant: MockRestaurant = {
      id,
      name: restaurantData.name || '',
      description: restaurantData.description || '',
      address: restaurantData.address || '',
      city: restaurantData.city || '',
      state: restaurantData.state || '',
      postalCode: restaurantData.postalCode || '',
      phone: restaurantData.phone || '',
      email: restaurantData.email || '',
      cuisineType: restaurantData.cuisineType || [],
      priceRange: restaurantData.priceRange || 'MEDIUM',
      rating: restaurantData.rating || 0,
      isActive: restaurantData.isActive ?? true,
      status: restaurantData.status || 'ACTIVE',
      ownerId: restaurantData.ownerId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...restaurantData,
    };

    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async findRestaurantById(id: string): Promise<MockRestaurant | null> {
    return this.restaurants.get(id) || null;
  }

  async findManyRestaurants(options: unknown = {}): Promise<MockRestaurant[]> {
    let restaurants = Array.from(this.restaurants.values());

    if (options.where) {
      restaurants = restaurants.filter(restaurant => {
        return Object.entries(options.where).every(([key, value]) => {
          return restaurant[key as keyof MockRestaurant] === value;
        });
      });
    }

    if (options.take) {
      restaurants = restaurants.slice(0, options.take);
    }

    return restaurants;
  }

  // Job operations
  async createJob(jobData: Partial<MockJob>): Promise<MockJob> {
    const id = jobData.id || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job: MockJob = {
      id,
      title: jobData.title || '',
      description: jobData.description || '',
      restaurantId: jobData.restaurantId || '',
      location: jobData.location || '',
      salary: jobData.salary || 0,
      salaryType: jobData.salaryType || 'HOURLY',
      requirements: jobData.requirements || [],
      status: jobData.status || 'ACTIVE',
      isActive: jobData.isActive ?? true,
      createdBy: jobData.createdBy || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...jobData,
    };

    this.jobs.set(id, job);
    return job;
  }

  async findManyJobs(options: unknown = {}): Promise<MockJob[]> {
    let jobs = Array.from(this.jobs.values());

    if (options.where) {
      jobs = jobs.filter(job => {
        return Object.entries(options.where).every(([key, value]) => {
          return job[key as keyof MockJob] === value;
        });
      });
    }

    if (options.take) {
      jobs = jobs.slice(0, options.take);
    }

    return jobs;
  }

  // Session operations
  async createSession(sessionData: Partial<MockSession>): Promise<MockSession> {
    const id = sessionData.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: MockSession = {
      id,
      userId: sessionData.userId || '',
      token: sessionData.token || '',
      refreshToken: sessionData.refreshToken || '',
      expiresAt: sessionData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
      ...sessionData,
    };

    this.sessions.set(id, session);
    return session;
  }

  async findSessionByToken(token: string): Promise<MockSession | null> {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        return session;
      }
    }
    return null;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Utility methods
  async clearAll(): Promise<void> {
    this.users.clear();
    this.profiles.clear();
    this.restaurants.clear();
    this.jobs.clear();
    this.sessions.clear();
  }

  async count(entity: string): Promise<number> {
    switch (entity) {
      case 'user':
        return this.users.size;
      case 'restaurant':
        return this.restaurants.size;
      case 'job':
        return this.jobs.size;
      case 'session':
        return this.sessions.size;
      default:
        return 0;
    }
  }

  // Transaction simulation (simplified)
  async transaction<T>(callback: (tx: MockDatabaseService) => Promise<T>): Promise<T> {
    // In a real implementation, this would create a transaction
    // For mock purposes, we'll just execute the callback
    return await callback(this);
  }
}