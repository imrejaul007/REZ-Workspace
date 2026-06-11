const logger = require('../config/logger');
const { Student, Course, Grade } = require('../models');
const mongoose = require('mongoose');

class GraderAgent {
  constructor() {
    this.name = 'Grader Agent';
    this.version = '1.0.0';
    this.capabilities = [
      'score_calculation',
      'grade_letter_assignment',
      'gpa_computation',
      'performance_analytics',
      'feedback_generation'
    ];

    this.gradeScale = [
      { min: 97, max: 100, letter: 'A+', points: 4.0 },
      { min: 93, max: 96, letter: 'A', points: 4.0 },
      { min: 90, max: 92, letter: 'A-', points: 3.7 },
      { min: 87, max: 89, letter: 'B+', points: 3.3 },
      { min: 83, max: 86, letter: 'B', points: 3.0 },
      { min: 80, max: 82, letter: 'B-', points: 2.7 },
      { min: 77, max: 79, letter: 'C+', points: 2.3 },
      { min: 73, max: 76, letter: 'C', points: 2.0 },
      { min: 70, max: 72, letter: 'C-', points: 1.7 },
      { min: 67, max: 69, letter: 'D+', points: 1.3 },
      { min: 63, max: 66, letter: 'D', points: 1.0 },
      { min: 60, max: 62, letter: 'D-', points: 0.7 },
      { min: 0, max: 59, letter: 'F', points: 0.0 }
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

  async calculate(params) {
    const { studentId, courseId, assignments, rawScore } = params;

    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return {
          success: false,
          message: 'Student not found',
          grade: null
        };
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return {
          success: false,
          message: 'Course not found',
          grade: null
        };
      }

      const isEnrolled = student.courseIds.some(id => id.toString() === courseId);
      if (!isEnrolled) {
        return {
          success: false,
          message: 'Student is not enrolled in this course',
          grade: null
        };
      }

      let finalScore;
      let letterGrade;
      let breakdown = {};

      if (assignments && assignments.length > 0) {
        const result = this.calculateWeightedScore(assignments);
        finalScore = result.finalScore;
        breakdown = result.breakdown;
      } else if (rawScore !== undefined) {
        finalScore = rawScore;
      } else {
        return {
          success: false,
          message: 'Either assignments or rawScore must be provided',
          grade: null
        };
      }

      letterGrade = this.getLetterGrade(finalScore);

      const grade = await this.saveGrade(studentId, courseId, finalScore, letterGrade);

      await this.updateStudentOverallGrade(studentId);

      logger.info(`Grader Agent: Calculated grade for student ${studentId} in course ${courseId}: ${letterGrade}`);

      return {
        success: true,
        studentId,
        courseId,
        courseName: course.name,
        grade: {
          score: Math.round(finalScore * 100) / 100,
          letterGrade,
          gradePoints: this.getGradePoints(letterGrade),
          breakdown,
          gradedAt: grade.gradedAt
        },
        feedback: this.generateFeedback(finalScore, letterGrade, course.name),
        comparison: await this.getClassComparison(studentId, courseId, finalScore)
      };
    } catch (error) {
      logger.error('Grader Agent error:', error);
      throw error;
    }
  }

  calculateWeightedScore(assignments) {
    const breakdown = {
      components: [],
      totalWeight: 0,
      weightedSum: 0
    };

    let totalWeight = assignments.reduce((sum, a) => sum + (a.weight || 1), 0);

    for (const assignment of assignments) {
      const weight = (assignment.weight || 1) / totalWeight;
      const weightedScore = assignment.score * weight;

      breakdown.components.push({
        name: assignment.name,
        score: assignment.score,
        weight: Math.round(weight * 100),
        weightedScore: Math.round(weightedScore * 100) / 100
      });

      breakdown.totalWeight += Math.round(weight * 100);
      breakdown.weightedSum += weightedScore;
    }

    breakdown.totalWeight = Math.round(breakdown.totalWeight);

    return {
      finalScore: breakdown.weightedSum,
      breakdown
    };
  }

  getLetterGrade(score) {
    for (const grade of this.gradeScale) {
      if (score >= grade.min && score <= grade.max) {
        return grade.letter;
      }
    }
    return 'F';
  }

  getGradePoints(letterGrade) {
    const grade = this.gradeScale.find(g => g.letter === letterGrade);
    return grade ? grade.points : 0.0;
  }

  async saveGrade(studentId, courseId, score, letterGrade) {
    let grade = await Grade.findOne({ studentId, courseId });

    const gradeData = {
      studentId: new mongoose.Types.ObjectId(studentId),
      courseId: new mongoose.Types.ObjectId(courseId),
      score,
      letterGrade,
      gradedAt: new Date(),
      gradedBy: 'Grader Agent'
    };

    if (grade) {
      grade = await Grade.findOneAndUpdate(
        { studentId, courseId },
        gradeData,
        { new: true }
      );
    } else {
      grade = new Grade(gradeData);
      await grade.save();
    }

    return grade;
  }

  async updateStudentOverallGrade(studentId) {
    const grades = await Grade.find({ studentId });

    if (grades.length === 0) return;

    const totalPoints = grades.reduce((sum, g) => sum + this.getGradePoints(g.letterGrade), 0);
    const gpa = totalPoints / grades.length;

    let overallGrade;
    if (gpa >= 3.7) overallGrade = 'A';
    else if (gpa >= 3.3) overallGrade = 'B+';
    else if (gpa >= 3.0) overallGrade = 'B';
    else if (gpa >= 2.7) overallGrade = 'B-';
    else if (gpa >= 2.3) overallGrade = 'C+';
    else if (gpa >= 2.0) overallGrade = 'C';
    else if (gpa >= 1.7) overallGrade = 'C-';
    else if (gpa >= 1.3) overallGrade = 'D+';
    else if (gpa >= 1.0) overallGrade = 'D';
    else overallGrade = 'F';

    await Student.findByIdAndUpdate(studentId, { grade: overallGrade });
  }

  generateFeedback(score, letterGrade, courseName) {
    const feedback = {
      summary: '',
      strengths: [],
      improvements: [],
      encouragement: ''
    };

    if (score >= 90) {
      feedback.summary = `Excellent performance in ${courseName}!`;
      feedback.strengths = [
        'Demonstrates thorough understanding of course material',
        'Consistent high-quality work across assignments',
        'Shows initiative and deep engagement with topics'
      ];
      feedback.encouragement = 'Keep up the outstanding work! Consider helping classmates.';
    } else if (score >= 80) {
      feedback.summary = `Good work in ${courseName}!`;
      feedback.strengths = [
        'Solid grasp of core concepts',
        'Generally consistent performance',
        'Shows potential for excellence'
      ];
      feedback.improvements = [
        'Focus on areas where minor errors occurred',
        'Review challenging topics for deeper understanding'
      ];
      feedback.encouragement = 'You are on the right track. A bit more practice will push you to the top.';
    } else if (score >= 70) {
      feedback.summary = `Satisfactory performance in ${courseName}.`;
      feedback.strengths = [
        'Basic understanding of course concepts',
        'Meets minimum requirements'
      ];
      feedback.improvements = [
        'Review lecture materials more thoroughly',
        'Attend office hours for clarification',
        'Practice with additional exercises'
      ];
      feedback.encouragement = 'With dedicated effort, you can improve significantly.';
    } else if (score >= 60) {
      feedback.summary = `You passed ${courseName}, but improvement is needed.`;
      feedback.improvements = [
        'Schedule regular study sessions',
        'Seek tutoring assistance',
        'Form study groups with peers',
        'Review fundamental prerequisites'
      ];
      feedback.encouragement = 'Passing is the first step. Focus on building a stronger foundation.';
    } else {
      feedback.summary = `You did not pass ${courseName}. Let's work together to improve.`;
      feedback.improvements = [
        'Schedule a meeting with the instructor',
        'Consider retaking foundational courses',
        'Use all available tutoring resources',
        'Create a structured study plan'
      ];
      feedback.encouragement = 'Failure is a learning opportunity. Use this feedback to grow.';
    }

    return feedback;
  }

  async getClassComparison(studentId, courseId, score) {
    const courseGrades = await Grade.find({ courseId });

    if (courseGrades.length === 0) {
      return {
        percentile: null,
        rank: null,
        classAverage: null,
        comparison: 'No class data available for comparison'
      };
    }

    const scores = courseGrades.map(g => g.score);
    const sortedScores = [...scores].sort((a, b) => b - a);
    const classAverage = scores.reduce((a, b) => a + b, 0) / scores.length;

    const belowCount = sortedScores.filter(s => s < score).length;
    const percentile = Math.round((belowCount / sortedScores.length) * 100);

    const studentRank = sortedScores.indexOf(score) + 1;

    let comparison;
    if (score >= classAverage + 10) {
      comparison = 'Top performer';
    } else if (score >= classAverage) {
      comparison = 'Above average';
    } else if (score >= classAverage - 10) {
      comparison = 'Below average';
    } else {
      comparison = 'Needs improvement';
    }

    return {
      percentile: Math.min(percentile + 1, 100),
      rank: studentRank,
      totalInClass: courseGrades.length,
      classAverage: Math.round(classAverage * 100) / 100,
      comparison
    };
  }

  async calculateGPA(studentId) {
    const grades = await Grade.find({ studentId });

    if (grades.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        grades: []
      };
    }

    let totalPoints = 0;
    let totalCredits = grades.length;

    const gradeDetails = grades.map(g => ({
      courseId: g.courseId,
      letterGrade: g.letterGrade,
      gradePoints: this.getGradePoints(g.letterGrade),
      score: g.score
    }));

    gradeDetails.forEach(g => {
      totalPoints += g.gradePoints;
    });

    const gpa = totalPoints / totalCredits;

    return {
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      grades: gradeDetails
    };
  }
}

module.exports = new GraderAgent();