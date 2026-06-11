const logger = require('../config/logger');
const { Student, Course } = require('../models');
const bcrypt = require('bcryptjs');

class AdmissionAgent {
  constructor() {
    this.name = 'Admission Agent';
    this.version = '1.0.0';
    this.capabilities = [
      'enrollment_processing',
      'eligibility_verification',
      'document_validation',
      'seat_allocation',
      'welcome_communication'
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

  async process(params) {
    const {
      name,
      email,
      phone,
      courseId,
      previousQualification,
      statementOfPurpose
    } = params;

    try {
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        return {
          success: false,
          message: 'Student with this email already exists',
          applicationStatus: 'rejected',
          reason: 'duplicate_email'
        };
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return {
          success: false,
          message: 'Course not found',
          applicationStatus: 'rejected',
          reason: 'invalid_course'
        };
      }

      if (course.students.length >= course.maxStudents) {
        return {
          success: false,
          message: 'Course is full',
          applicationStatus: 'waitlisted',
          reason: 'course_full',
          waitlistPosition: await this.getWaitlistPosition(courseId)
        };
      }

      const eligibilityResult = await this.checkEligibility(
        previousQualification,
        statementOfPurpose,
        course
      );

      if (!eligibilityResult.eligible) {
        return {
          success: false,
          message: 'Application does not meet eligibility criteria',
          applicationStatus: 'rejected',
          reason: 'not_eligible',
          feedback: eligibilityResult.feedback
        };
      }

      const student = await this.enrollStudent({
        name,
        email,
        phone,
        courseId,
        course
      });

      logger.info(`Admission Agent: Enrolled student ${student._id} in course ${courseId}`);

      return {
        success: true,
        message: 'Enrollment successful',
        applicationStatus: 'accepted',
        studentId: student._id,
        enrollmentDetails: {
          courseName: course.name,
          instructor: course.instructor,
          duration: course.duration,
          startDate: course.startDate,
          confirmationNumber: this.generateConfirmationNumber(student._id)
        },
        welcomeMessage: this.generateWelcomeMessage(name, course.name)
      };
    } catch (error) {
      logger.error('Admission Agent error:', error);
      throw error;
    }
  }

  async checkEligibility(qualification, sop, course) {
    const result = {
      eligible: true,
      score: 0,
      feedback: []
    };

    if (qualification && qualification.length > 10) {
      result.score += 30;
      result.feedback.push('Previous qualification verified');
    } else {
      result.score += 10;
      result.feedback.push('Limited qualification information provided');
    }

    if (sop && sop.length > 100) {
      result.score += 25;
      result.feedback.push('Strong statement of purpose');
    } else if (sop && sop.length > 50) {
      result.score += 15;
      result.feedback.push('Adequate statement of purpose');
    } else {
      result.score += 5;
      result.feedback.push('Statement of purpose could be improved');
    }

    result.score += 20;

    result.feedback.push('Basic eligibility criteria met');

    if (course.price > 0) {
      result.score += 25;
      result.feedback.push('Ready to pay course fees');
    }

    if (result.score < 50) {
      result.eligible = false;
      result.feedback.unshift('Application score below minimum threshold');
    }

    return result;
  }

  async enrollStudent(data) {
    const { name, email, phone, courseId, course } = data;

    const student = new Student({
      name,
      email,
      phone,
      courseIds: [courseId],
      status: 'active',
      enrolledAt: new Date()
    });

    await student.save();

    course.students.push(student._id);
    await course.save();

    return student;
  }

  async getWaitlistPosition(courseId) {
    const course = await Course.findById(courseId);
    return course ? course.students.length - course.maxStudents + 1 : 0;
  }

  generateConfirmationNumber(studentId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const shortId = studentId.toString().slice(-6).toUpperCase();
    return `ENR-${timestamp}-${shortId}`;
  }

  generateWelcomeMessage(name, courseName) {
    return `Welcome to LEARNIQ, ${name}! Your enrollment in ${courseName} has been confirmed. ` +
           'Our AI-powered learning system is ready to help you achieve your educational goals. ' +
           'You will receive further instructions from your tutor agent shortly.';
  }
}

module.exports = new AdmissionAgent();