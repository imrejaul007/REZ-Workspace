const logger = require('../config/logger');
const { Student, Course, Grade } = require('../models');

class PlacementAgent {
  constructor() {
    this.name = 'Placement Agent';
    this.version = '1.0.0';
    this.capabilities = [
      'career_guidance',
      'job_matching',
      'skill_analysis',
      'market_trends',
      'resume_optimization'
    ];

    this.jobCategories = [
      { name: 'Software Development', skills: ['programming', 'debugging', 'testing'], avgSalary: 85000 },
      { name: 'Data Science', skills: ['analytics', 'machine learning', 'statistics'], avgSalary: 95000 },
      { name: 'Web Development', skills: ['frontend', 'backend', 'database'], avgSalary: 75000 },
      { name: 'Cloud Engineering', skills: ['infrastructure', 'devops', 'security'], avgSalary: 100000 },
      { name: 'Quality Assurance', skills: ['testing', 'automation', 'documentation'], avgSalary: 65000 },
      { name: 'Project Management', skills: ['planning', 'communication', 'leadership'], avgSalary: 80000 },
      { name: 'UI/UX Design', skills: ['design', 'prototyping', 'user research'], avgSalary: 78000 },
      { name: 'Mobile Development', skills: ['ios', 'android', 'react-native'], avgSalary: 82000 }
    ];
  }

  async getStatus() {
    return {
      agent: this.name,
      version: this.version,
      status: 'operational',
      capabilities: this.capabilities,
      uptime: process.uptime()
    };
  }

  async analyze(params) {
    const { studentId, skills, preferences } = params;

    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return {
          success: false,
          message: 'Student not found',
          recommendations: []
        };
      }

      const enrolledCourses = await Course.find({ _id: { $in: student.courseIds } });
      const grades = await Grade.find({ studentId });

      const studentSkills = this.extractSkills(enrolledCourses, grades, skills);
      const careerMatches = this.matchCareers(studentSkills, preferences);
      const skillGapAnalysis = this.analyzeSkillGaps(studentSkills, careerMatches);

      logger.info(`Placement Agent: Analyzed career profile for student ${studentId}`);

      return {
        success: true,
        studentId,
        studentName: student.name,
        profileAnalysis: {
          identifiedSkills: studentSkills,
          overallScore: this.calculateProfileScore(grades),
          strengthAreas: this.getStrengthAreas(enrolledCourses, grades),
          improvementAreas: this.getImprovementAreas(grades)
        },
        careerRecommendations: careerMatches,
        skillGaps: skillGapAnalysis,
        marketInsights: this.getMarketInsights(careerMatches),
        nextSteps: this.generateNextSteps(careerMatches, skillGapAnalysis)
      };
    } catch (error) {
      logger.error('Placement Agent error:', error);
      throw error;
    }
  }

  extractSkills(courses, grades, additionalSkills = []) {
    const skills = new Set();

    const courseSkillMap = {
      'javascript': ['javascript', 'web development'],
      'python': ['python', 'data science'],
      'database': ['database', 'sql'],
      'cloud': ['cloud', 'devops'],
      'security': ['security', 'cybersecurity'],
      'data': ['analytics', 'machine learning'],
      'mobile': ['mobile', 'ios', 'android'],
      'ai': ['artificial intelligence', 'machine learning']
    };

    courses.forEach(course => {
      const lowerName = course.name.toLowerCase();
      for (const [keyword, skillList] of Object.entries(courseSkillMap)) {
        if (lowerName.includes(keyword)) {
          skillList.forEach(skill => skills.add(skill));
        }
      }
    });

    if (grades.length > 0) {
      const avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
      if (avgScore >= 85) {
        skills.add('advanced problem solving');
      }
      if (avgScore >= 70) {
        skills.add('project completion');
      }
    }

    additionalSkills.forEach(skill => skills.add(skill.toLowerCase()));

    return Array.from(skills);
  }

  matchCareers(skills, preferences = {}) {
    const matches = [];

    for (const category of this.jobCategories) {
      let matchScore = 0;
      const matchedSkills = [];
      const missingSkills = [];

      for (const requiredSkill of category.skills) {
        const hasSkill = skills.some(s =>
          s.toLowerCase().includes(requiredSkill) ||
          requiredSkill.includes(s.toLowerCase())
        );

        if (hasSkill) {
          matchScore += 25;
          matchedSkills.push(requiredSkill);
        } else {
          missingSkills.push(requiredSkill);
        }
      }

      if (matchScore > 0) {
        matches.push({
          career: category.name,
          matchScore: Math.min(matchScore, 100),
          matchedSkills,
          missingSkills,
          avgSalary: category.avgSalary,
          demand: this.getDemandRating(matchScore),
          location: preferences.location || 'Remote/Available'
        });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches.slice(0, 5);
  }

  getDemandRating(matchScore) {
    if (matchScore >= 80) return 'Very High';
    if (matchScore >= 60) return 'High';
    if (matchScore >= 40) return 'Medium';
    return 'Low';
  }

  analyzeSkillGaps(studentSkills, careerMatches) {
    const gaps = [];

    for (const match of careerMatches.slice(0, 3)) {
      if (match.missingSkills.length > 0) {
        gaps.push({
          career: match.career,
          skillsToAcquire: match.missingSkills,
          priority: match.matchScore >= 70 ? 'high' : 'medium',
          recommendedCourses: this.suggestCoursesForSkills(match.missingSkills)
        });
      }
    }

    return gaps;
  }

  suggestCoursesForSkills(skills) {
    const courseMap = {
      'programming': ['JavaScript Fundamentals', 'Python Programming'],
      'debugging': ['Software Testing', 'Quality Assurance'],
      'testing': ['Software Testing', 'Quality Assurance'],
      'database': ['Database Management', 'SQL Advanced'],
      'sql': ['SQL Basics', 'SQL Advanced'],
      'frontend': ['React.js', 'Vue.js'],
      'backend': ['Node.js', 'Express.js'],
      'cloud': ['AWS Solutions', 'Azure Fundamentals'],
      'security': ['Cybersecurity Basics', 'Security+'],
      'analytics': ['Data Analysis', 'Power BI'],
      'machine learning': ['ML Fundamentals', 'Deep Learning'],
      'statistics': ['Statistics for Data Science'],
      'ios': ['iOS Development'],
      'android': ['Android Development'],
      'devops': ['DevOps Fundamentals', 'Docker & Kubernetes'],
      'design': ['UI/UX Design', 'Figma Mastery']
    };

    const suggestions = [];
    for (const skill of skills) {
      const courses = courseMap[skill.toLowerCase()];
      if (courses) {
        suggestions.push(...courses);
      } else {
        suggestions.push(`${skill.charAt(0).toUpperCase() + skill.slice(1)} Fundamentals`);
      }
    }

    return [...new Set(suggestions)].slice(0, 5);
  }

  calculateProfileScore(grades) {
    if (grades.length === 0) return 50;

    const avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
    const gradeWeight = Math.min(grades.length / 10, 1);

    return Math.round(avgScore * gradeWeight + 50 * (1 - gradeWeight));
  }

  getStrengthAreas(courses, grades) {
    const strengths = [];

    if (grades.length >= 3) {
      const avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;
      if (avgScore >= 85) {
        strengths.push('Consistently high academic performance');
      }
    }

    if (courses.length >= 2) {
      strengths.push('Diverse course completion');
    }

    strengths.push('Active learning engagement');

    return strengths;
  }

  getImprovementAreas(grades) {
    const areas = [];

    if (grades.length === 0) {
      areas.push('Complete initial courses to assess performance');
      return areas;
    }

    const avgScore = grades.reduce((sum, g) => sum + g.score, 0) / grades.length;

    if (avgScore < 70) {
      areas.push('Fundamental understanding needs strengthening');
    }

    if (grades.length < 3) {
      areas.push('Complete more courses for comprehensive profile');
    }

    return areas;
  }

  getMarketInsights(careerMatches) {
    return {
      industryTrend: 'Tech jobs continue to grow with 12% annual growth rate',
      inDemandSkills: ['Cloud Computing', 'AI/ML', 'Cybersecurity', 'Full Stack Development'],
      salaryTrend: 'Entry-level positions showing 8% increase from last year',
      remoteAvailability: '68% of recommended positions offer remote options',
      tips: [
        'Focus on practical projects to build portfolio',
        'Obtain industry certifications for better opportunities',
        'Network through professional platforms',
        'Gain experience through internships or freelance projects'
      ]
    };
  }

  generateNextSteps(careerMatches, skillGaps) {
    const steps = [];

    if (careerMatches.length > 0 && careerMatches[0].matchScore >= 75) {
      steps.push({
        priority: 1,
        action: `Apply for ${careerMatches[0].career} positions`,
        timeline: 'Within 2 weeks'
      });
    }

    if (skillGaps.length > 0 && skillGaps[0].priority === 'high') {
      steps.push({
        priority: 2,
        action: `Enroll in courses to acquire: ${skillGaps[0].skillsToAcquire.join(', ')}`,
        timeline: 'Within 1 month'
      });
    }

    steps.push({
      priority: 3,
      action: 'Build professional portfolio with completed projects',
      timeline: 'Within 3 months'
    });

    steps.push({
      priority: 4,
      action: 'Update resume and LinkedIn profile with new skills',
      timeline: 'This week'
    });

    return steps;
  }
}

module.exports = new PlacementAgent();