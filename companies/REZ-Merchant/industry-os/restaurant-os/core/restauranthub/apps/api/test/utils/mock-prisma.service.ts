import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from './mock-database.service';

@Injectable()
export class MockPrismaService {
  private mockDb: MockDatabaseService;

  constructor() {
    this.mockDb = new MockDatabaseService();
  }

  // User model
  user = {
    create: async (data) => {
      const userData = data.data || data;
      return this.mockDb.createUser(userData);
    },

    findUnique: async (params) => {
      if (params.where.id) {
        return this.mockDb.findUserById(params.where.id);
      }
      if (params.where.email) {
        return this.mockDb.findUserByEmail(params.where.email);
      }
      return null;
    },

    findFirst: async (params) => {
      const users = await this.mockDb.findManyUsers(params);
      return users[0] || null;
    },

    findMany: async (params: unknown = {}) => {
      return this.mockDb.findManyUsers(params);
    },

    update: async (params) => {
      return this.mockDb.updateUser(params.where.id, params.data);
    },

    delete: async (params) => {
      const deleted = await this.mockDb.deleteUser(params.where.id);
      if (deleted) {
        return { id: params.where.id };
      }
      throw new Error('User not found');
    },

    deleteMany: async () => {
      // For testing cleanup
      const users = await this.mockDb.findManyUsers();
      users.forEach(user => this.mockDb.deleteUser(user.id));
      return { count: users.length };
    },

    count: async () => {
      return this.mockDb.count('user');
    }
  };

  // Profile model
  profile = {
    create: async (data) => {
      const profileData = data.data || data;
      return this.mockDb.createProfile(profileData);
    },

    findUnique: async (params) => {
      if (params.where.userId) {
        return this.mockDb.findProfileByUserId(params.where.userId);
      }
      return null;
    },

    update: async (params) => {
      const profile = await this.mockDb.findProfileByUserId(params.where.userId);
      if (profile) {
        return { ...profile, ...params.data };
      }
      return null;
    },

    deleteMany: async () => {
      // For testing cleanup
      return { count: 0 };
    }
  };

  // Restaurant model
  restaurant = {
    create: async (data) => {
      const restaurantData = data.data || data;
      return this.mockDb.createRestaurant(restaurantData);
    },

    findUnique: async (params) => {
      if (params.where.id) {
        return this.mockDb.findRestaurantById(params.where.id);
      }
      return null;
    },

    findMany: async (params: unknown = {}) => {
      return this.mockDb.findManyRestaurants(params);
    },

    update: async (params) => {
      const restaurant = await this.mockDb.findRestaurantById(params.where.id);
      if (restaurant) {
        return { ...restaurant, ...params.data, updatedAt: new Date() };
      }
      return null;
    },

    deleteMany: async () => {
      // For testing cleanup
      const restaurants = await this.mockDb.findManyRestaurants();
      return { count: restaurants.length };
    },

    count: async () => {
      return this.mockDb.count('restaurant');
    }
  };

  // Job model
  job = {
    create: async (data) => {
      const jobData = data.data || data;
      return this.mockDb.createJob(jobData);
    },

    findMany: async (params: unknown = {}) => {
      return this.mockDb.findManyJobs(params);
    },

    findUnique: async (params) => {
      const jobs = await this.mockDb.findManyJobs({ where: { id: params.where.id } });
      return jobs[0] || null;
    },

    update: async (params) => {
      const job = await this.job.findUnique({ where: { id: params.where.id } });
      if (job) {
        return { ...job, ...params.data, updatedAt: new Date() };
      }
      return null;
    },

    deleteMany: async () => {
      // For testing cleanup
      const jobs = await this.mockDb.findManyJobs();
      return { count: jobs.length };
    },

    count: async () => {
      return this.mockDb.count('job');
    }
  };

  // Session model
  session = {
    create: async (data) => {
      const sessionData = data.data || data;
      return this.mockDb.createSession(sessionData);
    },

    findUnique: async (params) => {
      if (params.where.token) {
        return this.mockDb.findSessionByToken(params.where.token);
      }
      return null;
    },

    findFirst: async (params) => {
      // Mock implementation for finding sessions by userId
      if (params.where.userId) {
        return {
          id: 'session-id',
          userId: params.where.userId,
          token: 'mock-token',
          createdAt: new Date(),
        };
      }
      return null;
    },

    findMany: async (params: unknown = {}) => {
      // Mock implementation for finding multiple sessions
      if (params.where?.userId) {
        return [{
          id: 'session-id',
          userId: params.where.userId,
          token: 'mock-token',
          createdAt: new Date(),
        }];
      }
      return [];
    },

    delete: async (params) => {
      const deleted = await this.mockDb.deleteSession(params.where.id);
      if (deleted) {
        return { id: params.where.id };
      }
      throw new Error('Session not found');
    },

    deleteMany: async () => {
      // For testing cleanup
      return { count: 0 };
    }
  };

  // Additional models for cleanup (simplified)
  notification = {
    deleteMany: async () => ({ count: 0 })
  };

  message = {
    deleteMany: async () => ({ count: 0 })
  };

  orderItem = {
    deleteMany: async () => ({ count: 0 })
  };

  order = {
    deleteMany: async () => ({ count: 0 })
  };

  review = {
    deleteMany: async () => ({ count: 0 })
  };

  employee = {
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0
  };

  product = {
    deleteMany: async () => ({ count: 0 })
  };

  vendor = {
    deleteMany: async () => ({ count: 0 })
  };

  // Prisma client methods
  $connect = async () => {
    // Mock connection
    return Promise.resolve();
  };

  $disconnect = async () => {
    // Mock disconnection
    return Promise.resolve();
  };

  $transaction = async (queries: unknown[]) => {
    // Execute queries in sequence for mock
    const results = [];
    for (const query of queries) {
      results.push(await query);
    }
    return results;
  };

  $executeRaw = async (query, ...params: unknown[]) => {
    // Mock raw query execution
    return { count: 1 };
  };

  $queryRaw = async (query, ...params: unknown[]) => {
    // Mock raw query
    return [];
  };

  // Cleanup method for tests
  async cleanup() {
    await this.mockDb.clearAll();
  }
}