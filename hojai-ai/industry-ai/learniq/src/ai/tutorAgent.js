const logger = require('../config/logger');
const { Student, Course, Grade } = require('../models');

class TutorAgent {
  constructor() {
    this.name = 'Tutor Agent';
    this.version = '1.0.0';
    this.capabilities = [
      'personalized_learning_recommendations',
      'course_suggestions',
      'study_plan_generation',
      'learning_gap_analysis',
      'performance_predictions'
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

  async recommend(params) {
    const { studentId, courseIds } = params;

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
      const allCourses = await Course.find({ status: 'active' });
      const studentGrades = await Grade.find({ studentId });

      const recommendations = this.generateRecommendations(
        student,
        enrolledCourses,
        allCourses,
        studentGrades
      );

      const learningGaps = this.analyzeLearningGaps(student, enrolledCourses, studentGrades);

      logger.info(`Tutor Agent: Generated ${recommendations.length} recommendations for student ${studentId}`);

      return {
        success: true,
        studentId,
        recommendations,
        learningGaps,
        studyPlan: this.generateStudyPlan(learningGaps, enrolledCourses),
        confidence: this.calculateConfidence(studentGrades)
      };
    } catch (error) {
      logger.error('Tutor Agent error:', error);
      throw error;
    }
  }

  generateRecommendations(student, enrolledCourses, allCourses, grades) {
    const recommendations = [];
    const enrolledIds = student.courseIds.map(id => id.toString());

    const relevantCourses = allCourses.filter(course =>
      !enrolledIds.includes(course._id.toString())
    );

    for (const course of relevantCourses.slice(0, 5)) {
      const relevanceScore = this.calculateRelevance(course, enrolledCourses, student);

      recommendations.push({
        courseId: course._id,
        courseName: course.name,
        instructor: course.instructor,
        duration: course.duration,
        price: course.price,
        relevanceScore: Math.round(relevanceScore * 100) / 100,
        reasons: this.getRelevanceReasons(course, enrolledCourses)
      });
    }

    recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return recommendations;
  }

  calculateRelevance(course, enrolledCourses, student) {
    let score = 0.5;

    const avgPrice = enrolledCourses.length > 0
      ? enrolledCourses.reduce((sum, c) => sum + c.price, 0) / enrolledCourses.length
      : course.price;

    if (Math.abs(course.price - avgPrice) < avgPrice * 0.3) {
      score += 0.15;
    }

    if (course.instructor === enrolledCourses[0]?.instructor) {
      score += 0.15;
    }

    const durationMatch = enrolledCourses.some(c => c.duration === course.duration);
    if (durationMatch) {
      score += 0.1;
    }

    score += Math.random() * 0.1;

    return Math.min(score, 1);
  }

  getRelevanceReasons(course, enrolledCourses) {
    const reasons = [];

    if (enrolledCourses.length > 0 && course.instructor === enrolledCourses[0].instructor) {
      reasons.push('Same instructor as enrolled course');
    }

    const hasSimilarDuration = enrolledCourses.some(c => c.duration === course.duration);
    if (hasSimilarDuration) {
      reasons.push('Similar course duration');
    }

    reasons.push('Popular course in our catalog');

    return reasons;
  }

  analyzeLearningGaps(student, enrolledCourses, grades) {
    const gaps = [];

    if (grades.length === 0) {
      gaps.push({
        area: 'Foundation',
        description: 'Complete initial assessments to establish baseline',
        priority: 'high',
        estimatedTime: '2 weeks'
      });
      return gaps;
    }

    const gradeAverages = grades.reduce((acc, g) => {
      return acc + g.score;
    }, 0) / grades.length;

    if (gradeAverages < 70) {
      gaps.push({
        area: 'Core Concepts',
        description: 'Strengthen understanding of fundamental concepts',
        priority: 'high',
        estimatedTime: '3 weeks'
      });
    }

    if (gradeAverages < 85) {
      gaps.push({
        area: 'Advanced Topics',
        description: 'Focus on advanced problem-solving techniques',
        priority: 'medium',
        estimatedTime: '4 weeks'
      });
    }

    gaps.push({
      area: 'Practical Application',
      description: 'Apply learned concepts to real-world scenarios',
      priority: 'medium',
      estimatedTime: '2 weeks'
    });

    return gaps;
  }

  generateStudyPlan(learningGaps, enrolledCourses) {
    const plan = {
      weeklySchedule: [],
      totalDuration: '8 weeks',
      milestones: []
    };

    learningGaps.forEach((gap, index) => {
      plan.weeklySchedule.push({
        week: index + 1,
        focus: gap.area,
        activities: [
          `Study ${gap.area.toLowerCase()} materials`,
          'Complete practice exercises',
          'Review and self-assess'
        ],
        estimatedHours: gap.estimatedTime
      });
    });

    plan.milestones = [
      { week: 2, goal: 'Complete baseline assessments' },
      { week: 4, goal: 'Achieve 80% in practice tests' },
      { week: 6, goal: 'Complete all gap areas' },
      { week: 8, goal: 'Final evaluation and certification' }
    ];

    return plan;
  }

  calculateConfidence(grades) {
    if (grades.length === 0) return 0.4;
    if (grades.length < 3) return 0.6;
    if (grades.length < 5) return 0.8;
    return 0.95;
  }
}

module.exports = new TutorAgent();