import { Controller, Get, Query, Param, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import crypto from 'crypto';
import { mockData } from '../mock-data/simple-mock-data';

@Controller('api/jobs')
export class EnhancedJobsController {
  private jobs = mockData.jobs; // Use generated mock jobs

  @Get()
  async getJobs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('location') location?: string,
    @Query('jobType') jobType?: string,
    @Query('status') status?: string,
    @Query('salaryMin', new DefaultValuePipe(0), ParseIntPipe) salaryMin?: number,
    @Query('salaryMax') salaryMax?: string,
    @Query('skills') skills?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string
  ) {
    let filteredJobs = [...this.jobs];

    // Apply filters
    if (location) {
      filteredJobs = filteredJobs.filter(job =>
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (jobType) {
      filteredJobs = filteredJobs.filter(job => job.jobType === jobType);
    }

    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }

    if (salaryMin) {
      filteredJobs = filteredJobs.filter(job => job.salaryMin >= salaryMin);
    }

    if (salaryMax) {
      const maxSalary = parseInt(salaryMax);
      filteredJobs = filteredJobs.filter(job => job.salaryMax <= maxSalary);
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      filteredJobs = filteredJobs.filter(job =>
        skillsArray.some(skill =>
          job.skills.some(jobSkill => jobSkill.toLowerCase().includes(skill))
        )
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.restaurantName.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    }

    if (featured === 'true') {
      filteredJobs = filteredJobs.filter(job => job.featured);
    }

    // Sort by most recent first
    filteredJobs.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedJobs,
      meta: {
        total: filteredJobs.length,
        page,
        limit,
        totalPages: Math.ceil(filteredJobs.length / limit),
        hasNextPage: endIndex < filteredJobs.length,
        hasPrevPage: page > 1
      },
      filters: {
        availableLocations: [...new Set(this.jobs.map(job => job.location))].sort(),
        availableJobTypes: [...new Set(this.jobs.map(job => job.jobType))],
        availableStatuses: [...new Set(this.jobs.map(job => job.status))],
        salaryRange: {
          min: Math.min(...this.jobs.map(job => job.salaryMin)),
          max: Math.max(...this.jobs.map(job => job.salaryMax))
        },
        popularSkills: this.getPopularSkills()
      }
    };
  }

  @Get('featured')
  async getFeaturedJobs() {
    const featuredJobs = this.jobs
      .filter(job => job.featured && job.status === 'OPEN')
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, 10);

    return {
      success: true,
      data: featuredJobs,
      meta: {
        total: featuredJobs.length
      }
    };
  }

  @Get('urgent')
  async getUrgentHiring() {
    const urgentJobs = this.jobs
      .filter(job => job.urgentHiring && job.status === 'OPEN')
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, 15);

    return {
      success: true,
      data: urgentJobs,
      meta: {
        total: urgentJobs.length
      }
    };
  }

  @Get('stats')
  async getJobStats() {
    const stats = {
      totalJobs: this.jobs.length,
      openJobs: this.jobs.filter(job => job.status === 'OPEN').length,
      filledJobs: this.jobs.filter(job => job.status === 'FILLED').length,
      totalApplications: this.jobs.reduce((sum, job) => sum + job.applicationCount, 0),
      averageViewsPerJob: Math.round(this.jobs.reduce((sum, job) => sum + job.viewCount, 0) / this.jobs.length),
      topEmployers: this.getTopEmployers(),
      jobsByType: this.getJobsByType(),
      jobsByLocation: this.getJobsByLocation(),
      salaryInsights: this.getSalaryInsights(),
      recentActivity: {
        jobsPostedThisWeek: this.jobs.filter(job => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(job.postedDate) > weekAgo;
        }).length,
        applicationsThisWeek: crypto.randomInt(50, 249) // Simulated
      }
    };

    return {
      success: true,
      data: stats
    };
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    const job = this.jobs.find(j => j.id === id);

    if (!job) {
      return {
        success: false,
        message: 'Job not found',
        data: null
      };
    }

    // Increment view count (in real app, this would be in database)
    job.viewCount += 1;

    // Add related jobs
    const relatedJobs = this.jobs
      .filter(j => j.id !== id && (
        j.location === job.location ||
        j.jobType === job.jobType ||
        j.skills.some(skill => job.skills.includes(skill))
      ))
      .slice(0, 5);

    return {
      success: true,
      data: {
        ...job,
        relatedJobs,
        applicationsThisWeek: crypto.randomInt(1, 10),
        averageResponseTime: crypto.randomInt(1, 3).toString() + ' days'
      }
    };
  }

  private getPopularSkills() {
    const skillCounts = new Map();
    this.jobs.forEach(job => {
      job.skills.forEach(skill => {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      });
    });

    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));
  }

  private getTopEmployers() {
    const employerCounts = new Map();
    this.jobs.forEach(job => {
      employerCounts.set(job.restaurantName, (employerCounts.get(job.restaurantName) || 0) + 1);
    });

    return Array.from(employerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, jobCount]) => ({ name, jobCount }));
  }

  private getJobsByType() {
    const typeCounts = new Map();
    this.jobs.forEach(job => {
      typeCounts.set(job.jobType, (typeCounts.get(job.jobType) || 0) + 1);
    });

    return Array.from(typeCounts.entries()).map(([type, count]) => ({ type, count }));
  }

  private getJobsByLocation() {
    const locationCounts = new Map();
    this.jobs.forEach(job => {
      locationCounts.set(job.location, (locationCounts.get(job.location) || 0) + 1);
    });

    return Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  }

  private getSalaryInsights() {
    const salaries = this.jobs.map(job => (job.salaryMin + job.salaryMax) / 2);
    salaries.sort((a, b) => a - b);

    return {
      averageSalary: Math.round(salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length),
      medianSalary: Math.round(salaries[Math.floor(salaries.length / 2)]),
      salaryRange: {
        min: Math.min(...this.jobs.map(job => job.salaryMin)),
        max: Math.max(...this.jobs.map(job => job.salaryMax))
      },
      salaryByJobType: this.getSalaryByJobType()
    };
  }

  private getSalaryByJobType() {
    const typeGroups = new Map();
    this.jobs.forEach(job => {
      if (!typeGroups.has(job.jobType)) {
        typeGroups.set(job.jobType, []);
      }
      typeGroups.get(job.jobType).push((job.salaryMin + job.salaryMax) / 2);
    });

    return Array.from(typeGroups.entries()).map(([type, salaries]) => ({
      type,
      averageSalary: Math.round(salaries.reduce((sum: number, salary: number) => sum + salary, 0) / salaries.length),
      count: salaries.length
    }));
  }
}