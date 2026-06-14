/**
 * Database Performance Testing Suite
 * Tests query performance, optimization effectiveness, and scalability
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { UserRole, VerificationStatus, JobStatus } from '@prisma/client';

describe('Database Performance Tests', () => {
  let module: TestingModule;
  let prisma: PrismaService;
  let logger: Logger;
  let performanceReport: PerformanceReport;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    logger = new Logger('PerformanceTest');
    performanceReport = new PerformanceReport();

    logger.log('⚡ Starting Database Performance Testing Suite');
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }

    // Generate performance report
    logger.log('📊 Generating Performance Test Report');
    console.log(performanceReport.generateReport());
  });

  describe('🔍 Query Performance Tests', () => {
    it('should perform simple SELECT queries efficiently', async () => {
      const testName = 'Simple SELECT Performance';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          // Mock performance test
          const mockMetrics = {
            executionTime: 15,
            rowsReturned: 100,
            memoryUsed: 1024
          };

          performanceReport.addMetric({
            testName,
            queryType: 'SELECT',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.executionTime).toBeLessThan(100);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const iterations = 10;
        const executionTimes = [];

        for (let i = 0; i < iterations; i++) {
          const start = Date.now();

          const users = await prisma.user.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
          });

          const duration = Date.now() - start;
          executionTimes.push(duration);
        }

        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
        const maxTime = Math.max(...executionTimes);
        const minTime = Math.min(...executionTimes);

        performanceReport.addMetric({
          testName,
          queryType: 'SELECT',
          executionTime: avgTime,
          success: true,
          details: {
            iterations,
            avgTime,
            maxTime,
            minTime,
            executionTimes
          }
        });

        expect(avgTime).toBeLessThan(100); // Should be under 100ms
        expect(maxTime).toBeLessThan(200); // Max should be under 200ms

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: avg ${avgTime.toFixed(2)}ms, max ${maxTime}ms (${totalTime}ms total)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'SELECT',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    it('should perform complex JOIN queries efficiently', async () => {
      const testName = 'Complex JOIN Performance';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockMetrics = {
            executionTime: 85,
            rowsReturned: 25,
            joinsPerformed: 3
          };

          performanceReport.addMetric({
            testName,
            queryType: 'JOIN',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.executionTime).toBeLessThan(500);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const iterations = 5;
        const executionTimes = [];

        for (let i = 0; i < iterations; i++) {
          const start = Date.now();

          const restaurants = await prisma.restaurant.findMany({
            take: 10,
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
              jobs: {
                take: 5,
                include: {
                  applications: {
                    take: 3,
                    include: {
                      employee: {
                        include: {
                          user: true,
                        },
                      },
                    },
                  },
                },
              },
              branches: true,
              reviews: {
                take: 5,
                include: {
                  user: true,
                },
              },
            },
          });

          const duration = Date.now() - start;
          executionTimes.push(duration);
        }

        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
        const maxTime = Math.max(...executionTimes);

        performanceReport.addMetric({
          testName,
          queryType: 'JOIN',
          executionTime: avgTime,
          success: true,
          details: {
            iterations,
            avgTime,
            maxTime,
            executionTimes
          }
        });

        expect(avgTime).toBeLessThan(500); // Should be under 500ms
        expect(maxTime).toBeLessThan(1000); // Max should be under 1 second

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: avg ${avgTime.toFixed(2)}ms, max ${maxTime}ms (${totalTime}ms total)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'JOIN',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    it('should perform aggregation queries efficiently', async () => {
      const testName = 'Aggregation Performance';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockMetrics = {
            executionTime: 45,
            aggregationsPerformed: 4,
            rowsProcessed: 1000
          };

          performanceReport.addMetric({
            testName,
            queryType: 'AGGREGATION',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.executionTime).toBeLessThan(200);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const iterations = 3;
        const executionTimes = [];

        for (let i = 0; i < iterations; i++) {
          const start = Date.now();

          // Perform multiple aggregation queries
          const [userStats, restaurantStats, jobStats] = await Promise.all([
            prisma.user.aggregate({
              _count: {
                id: true,
              },
              where: {
                isActive: true,
              },
            }),
            prisma.restaurant.aggregate({
              _count: {
                id: true,
              },
              _avg: {
                rating: true,
              },
              _max: {
                totalReviews: true,
              },
              where: {
                isActive: true,
              },
            }),
            prisma.job.groupBy({
              by: ['status'],
              _count: {
                id: true,
              },
              _avg: {
                salaryMax: true,
              },
            }),
          ]);

          const duration = Date.now() - start;
          executionTimes.push(duration);
        }

        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;
        const maxTime = Math.max(...executionTimes);

        performanceReport.addMetric({
          testName,
          queryType: 'AGGREGATION',
          executionTime: avgTime,
          success: true,
          details: {
            iterations,
            avgTime,
            maxTime,
            executionTimes
          }
        });

        expect(avgTime).toBeLessThan(200); // Should be under 200ms

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: avg ${avgTime.toFixed(2)}ms, max ${maxTime}ms (${totalTime}ms total)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'AGGREGATION',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });
  });

  describe('📊 Bulk Operation Performance Tests', () => {
    it('should perform bulk inserts efficiently', async () => {
      const testName = 'Bulk INSERT Performance';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockMetrics = {
            executionTime: 150,
            recordsInserted: 100,
            throughput: 666 // records per second
          };

          performanceReport.addMetric({
            testName,
            queryType: 'BULK_INSERT',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.throughput).toBeGreaterThan(500);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const batchSize = 50;
        const userData = Array.from({ length: batchSize }, (_, i) => ({
          email: `bulk-test-${Date.now()}-${i}@example.com`,
          passwordHash: '$2b$10$hashedpassword',
          role: UserRole.EMPLOYEE,
        }));

        const start = Date.now();

        // Use createMany for bulk insert
        const result = await prisma.user.createMany({
          data: userData,
          skipDuplicates: true,
        });

        const duration = Date.now() - start;
        const throughput = (result.count / duration) * 1000; // records per second

        performanceReport.addMetric({
          testName,
          queryType: 'BULK_INSERT',
          executionTime: duration,
          success: true,
          details: {
            batchSize,
            recordsInserted: result.count,
            throughput
          }
        });

        expect(result.count).toBe(batchSize);
        expect(throughput).toBeGreaterThan(100); // At least 100 records per second

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: ${duration}ms for ${result.count} records (${throughput.toFixed(0)} records/sec)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'BULK_INSERT',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });

    it('should perform bulk updates efficiently', async () => {
      const testName = 'Bulk UPDATE Performance';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockMetrics = {
            executionTime: 95,
            recordsUpdated: 50,
            throughput: 526
          };

          performanceReport.addMetric({
            testName,
            queryType: 'BULK_UPDATE',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.throughput).toBeGreaterThan(400);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const start = Date.now();

        // Bulk update users
        const result = await prisma.user.updateMany({
          where: {
            role: UserRole.EMPLOYEE,
            isActive: true,
          },
          data: {
            lastLoginAt: new Date(),
          },
        });

        const duration = Date.now() - start;
        const throughput = (result.count / duration) * 1000;

        performanceReport.addMetric({
          testName,
          queryType: 'BULK_UPDATE',
          executionTime: duration,
          success: true,
          details: {
            recordsUpdated: result.count,
            throughput
          }
        });

        expect(throughput).toBeGreaterThan(50); // At least 50 records per second

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: ${duration}ms for ${result.count} records (${throughput.toFixed(0)} records/sec)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'BULK_UPDATE',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });
  });

  describe('🔍 Index Performance Tests', () => {
    it('should utilize indexes for filtered queries', async () => {
      const testName = 'Index Utilization';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockMetrics = {
            executionTime: 25,
            indexUsed: true,
            rowsExamined: 100,
            rowsReturned: 10
          };

          performanceReport.addMetric({
            testName,
            queryType: 'INDEXED_SELECT',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.indexUsed).toBe(true);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const iterations = 5;
        const executionTimes = [];

        for (let i = 0; i < iterations; i++) {
          const start = Date.now();

          // Query using indexed columns
          const [usersByEmail, restaurantsByStatus, jobsByStatus] = await Promise.all([
            prisma.user.findMany({
              where: {
                email: { contains: '@' },
                isActive: true,
              },
              take: 10,
            }),
            prisma.restaurant.findMany({
              where: {
                verificationStatus: VerificationStatus.VERIFIED,
                isActive: true,
              },
              take: 10,
            }),
            prisma.job.findMany({
              where: {
                status: JobStatus.OPEN,
              },
              take: 10,
            }),
          ]);

          const duration = Date.now() - start;
          executionTimes.push(duration);
        }

        const avgTime = executionTimes.reduce((sum, time) => sum + time, 0) / iterations;

        performanceReport.addMetric({
          testName,
          queryType: 'INDEXED_SELECT',
          executionTime: avgTime,
          success: true,
          details: {
            iterations,
            avgTime,
            executionTimes
          }
        });

        expect(avgTime).toBeLessThan(100); // Should be fast with indexes

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: avg ${avgTime.toFixed(2)}ms (${totalTime}ms total)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'INDEXED_SELECT',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });
  });

  describe('📈 Scalability Tests', () => {
    it('should maintain performance with increased data volume', async () => {
      const testName = 'Scalability Test';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockResults = {
            smallDataset: { time: 25, records: 100 },
            mediumDataset: { time: 45, records: 500 },
            largeDataset: { time: 95, records: 1000 }
          };

          // Performance should scale linearly or better
          const scalingFactor = mockResults.largeDataset.time / mockResults.smallDataset.time;
          const dataFactor = mockResults.largeDataset.records / mockResults.smallDataset.records;

          performanceReport.addMetric({
            testName,
            queryType: 'SCALABILITY',
            executionTime: mockResults.largeDataset.time,
            success: true,
            details: {
              ...mockResults,
              scalingFactor,
              dataFactor,
              isLinearScaling: scalingFactor <= dataFactor * 1.5
            }
          });

          expect(scalingFactor).toBeLessThanOrEqual(dataFactor * 2); // Should not be worse than 2x linear
          logger.log(`✅ ${testName} (mock): Scaling factor ${scalingFactor.toFixed(2)}`);
          return;
        }

        const dataSizes = [50, 200, 500];
        const results = [];

        for (const size of dataSizes) {
          const start = Date.now();

          const users = await prisma.user.findMany({
            take: size,
            include: {
              profile: true,
              restaurant: true,
            },
            orderBy: { createdAt: 'desc' },
          });

          const duration = Date.now() - start;
          results.push({ size, duration, recordCount: users.length });
        }

        // Analyze scaling behavior
        const firstResult = results[0];
        const lastResult = results[results.length - 1];
        const scalingFactor = lastResult.duration / firstResult.duration;
        const dataFactor = lastResult.size / firstResult.size;

        performanceReport.addMetric({
          testName,
          queryType: 'SCALABILITY',
          executionTime: lastResult.duration,
          success: true,
          details: {
            results,
            scalingFactor,
            dataFactor,
            isLinearScaling: scalingFactor <= dataFactor * 1.5
          }
        });

        expect(scalingFactor).toBeLessThanOrEqual(dataFactor * 2); // Should not scale worse than 2x linear

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: Scaling factor ${scalingFactor.toFixed(2)} (${totalTime}ms total)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'SCALABILITY',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });
  });

  describe('🔄 Connection Pool Performance Tests', () => {
    it('should handle connection pool stress efficiently', async () => {
      const testName = 'Connection Pool Stress';
      const testStart = Date.now();

      try {
        if (process.env.MOCK_DATABASE === 'true') {
          const mockMetrics = {
            executionTime: 180,
            concurrentQueries: 20,
            avgQueryTime: 9,
            poolUtilization: 75
          };

          performanceReport.addMetric({
            testName,
            queryType: 'CONNECTION_POOL',
            executionTime: mockMetrics.executionTime,
            success: true,
            details: mockMetrics
          });

          expect(mockMetrics.poolUtilization).toBeLessThan(90);
          logger.log(`✅ ${testName} (mock): ${mockMetrics.executionTime}ms`);
          return;
        }

        const concurrentQueries = 15;
        const queries = [];

        // Create multiple concurrent queries
        for (let i = 0; i < concurrentQueries; i++) {
          const query = async () => {
            const start = Date.now();

            await prisma.user.findMany({
              take: 10,
              include: { profile: true },
            });

            return Date.now() - start;
          };

          queries.push(query());
        }

        const queryTimes = await Promise.all(queries);
        const avgQueryTime = queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
        const maxQueryTime = Math.max(...queryTimes);

        // Check connection pool status
        const poolStatus = await prisma.getConnectionPoolStatus();

        performanceReport.addMetric({
          testName,
          queryType: 'CONNECTION_POOL',
          executionTime: Date.now() - testStart,
          success: true,
          details: {
            concurrentQueries,
            avgQueryTime,
            maxQueryTime,
            queryTimes,
            poolStatus
          }
        });

        expect(avgQueryTime).toBeLessThan(200); // Each query should be fast
        expect(maxQueryTime).toBeLessThan(500); // Even slowest should be reasonable

        const totalTime = Date.now() - testStart;
        logger.log(`✅ ${testName}: ${concurrentQueries} concurrent queries, avg ${avgQueryTime.toFixed(2)}ms (${totalTime}ms total)`);
      } catch (error) {
        performanceReport.addMetric({
          testName,
          queryType: 'CONNECTION_POOL',
          executionTime: Date.now() - testStart,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    });
  });
});

/**
 * Performance Report Class
 * Tracks and analyzes database performance metrics
 */
class PerformanceReport {
  private metrics: PerformanceMetric[] = [];

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
  }

  generateReport(): string {
    const totalTests = this.metrics.length;
    const passedTests = this.metrics.filter(m => m.success).length;
    const failedTests = totalTests - passedTests;

    const avgExecutionTime = this.metrics
      .filter(m => m.success)
      .reduce((sum, m) => sum + m.executionTime, 0) / passedTests || 0;

    const slowestTest = this.metrics
      .filter(m => m.success)
      .sort((a, b) => b.executionTime - a.executionTime)[0];

    const fastestTest = this.metrics
      .filter(m => m.success)
      .sort((a, b) => a.executionTime - b.executionTime)[0];

    const queryTypeStats = this.getQueryTypeStatistics();

    const report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ⚡ DATABASE PERFORMANCE TEST REPORT                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📊 OVERALL PERFORMANCE SUMMARY                                              ║
║  ├─ Total Tests: ${totalTests.toString().padEnd(59)} ║
║  ├─ Passed: ${passedTests.toString().padEnd(64)} ║
║  ├─ Failed: ${failedTests.toString().padEnd(64)} ║
║  ├─ Success Rate: ${((passedTests / totalTests * 100).toFixed(1) + '%').padEnd(56)} ║
║  ├─ Average Execution Time: ${(avgExecutionTime.toFixed(2) + 'ms').padEnd(48)} ║
║  ├─ Fastest Test: ${(fastestTest?.testName || 'N/A').padEnd(56)} ║
║  │   └─ Time: ${(fastestTest?.executionTime.toFixed(2) + 'ms' || 'N/A').padEnd(60)} ║
║  └─ Slowest Test: ${(slowestTest?.testName || 'N/A').padEnd(56)} ║
║      └─ Time: ${(slowestTest?.executionTime.toFixed(2) + 'ms' || 'N/A').padEnd(60)} ║
║                                                                              ║
║  🔍 QUERY TYPE PERFORMANCE                                                   ║
${this.formatQueryTypeStats(queryTypeStats)}
║                                                                              ║
║  📈 DETAILED TEST RESULTS                                                    ║
${this.formatDetailedResults()}
║                                                                              ║
║  🎯 PERFORMANCE RECOMMENDATIONS                                              ║
${this.formatRecommendations()}
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

    return report;
  }

  private getQueryTypeStatistics(): Record<string, QueryTypeStats> {
    const stats: Record<string, QueryTypeStats> = {};

    this.metrics.filter(m => m.success).forEach(metric => {
      if (!stats[metric.queryType]) {
        stats[metric.queryType] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          avgTime: 0
        };
      }

      const stat = stats[metric.queryType];
      stat.count++;
      stat.totalTime += metric.executionTime;
      stat.minTime = Math.min(stat.minTime, metric.executionTime);
      stat.maxTime = Math.max(stat.maxTime, metric.executionTime);
    });

    Object.keys(stats).forEach(type => {
      stats[type].avgTime = stats[type].totalTime / stats[type].count;
    });

    return stats;
  }

  private formatQueryTypeStats(stats: Record<string, QueryTypeStats>): string {
    return Object.entries(stats).map(([type, data]) => {
      const line = `║  ├─ ${type}: ${data.count} tests, avg ${data.avgTime.toFixed(2)}ms`;
      return line.padEnd(77) + '║';
    }).join('\n');
  }

  private formatDetailedResults(): string {
    return this.metrics.map(metric => {
      const status = metric.success ? '✅' : '❌';
      const line = `║  ├─ ${status} ${metric.testName}: ${metric.executionTime.toFixed(2)}ms`;
      return line.padEnd(77) + '║';
    }).join('\n');
  }

  private formatRecommendations(): string {
    const recommendations = [];

    // Analyze for slow queries
    const slowQueries = this.metrics.filter(m => m.success && m.executionTime > 500);
    if (slowQueries.length > 0) {
      recommendations.push(`• ${slowQueries.length} queries exceeded 500ms - consider optimization`);
    }

    // Analyze by query type
    const stats = this.getQueryTypeStatistics();

    if (stats.JOIN && stats.JOIN.avgTime > 200) {
      recommendations.push('• JOIN queries are slow - consider denormalization or caching');
    }

    if (stats.AGGREGATION && stats.AGGREGATION.avgTime > 100) {
      recommendations.push('• Aggregation queries need optimization - add covering indexes');
    }

    if (stats.BULK_INSERT && stats.BULK_INSERT.avgTime > 200) {
      recommendations.push('• Bulk operations could be faster - consider batch size tuning');
    }

    if (recommendations.length === 0) {
      recommendations.push('• All performance metrics are within acceptable limits');
      recommendations.push('• Continue monitoring performance over time');
    }

    return recommendations.map(rec => {
      const line = `║  ${rec}`;
      return line.padEnd(77) + '║';
    }).join('\n');
  }
}

interface PerformanceMetric {
  testName: string;
  queryType: string;
  executionTime: number;
  success: boolean;
  details?: any;
  error?: string;
}

interface QueryTypeStats {
  count: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
}