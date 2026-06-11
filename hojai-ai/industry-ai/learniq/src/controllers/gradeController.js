const { Grade, Student, Course } = require('../models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const graderAgent = require('../ai/graderAgent');

const createGrade = asyncHandler(async (req, res) => {
  const { studentId, courseId, score, feedback } = req.body;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  const isEnrolled = student.courseIds.some(cid => cid.toString() === courseId);
  if (!isEnrolled) {
    throw new ValidationError('Student is not enrolled in this course');
  }

  const letterGrade = Grade.calculateLetterGrade(score);

  let grade = await Grade.findOne({ studentId, courseId });

  if (grade) {
    grade = await Grade.findByIdAndUpdate(
      grade._id,
      { score, letterGrade, feedback, gradedAt: new Date(), gradedBy: 'instructor' },
      { new: true }
    );
  } else {
    grade = new Grade({
      studentId,
      courseId,
      score,
      letterGrade,
      feedback,
      gradedBy: 'instructor'
    });
    await grade.save();
  }

  await updateStudentOverallGrade(studentId);

  logger.info(`Grade created/updated for student ${studentId} in course ${courseId}: ${letterGrade}`);

  res.status(201).json({
    success: true,
    message: 'Grade recorded successfully',
    data: grade
  });
});

const getGradesByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { courseId } = req.query;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student');
  }

  const query = { studentId };
  if (courseId) {
    query.courseId = courseId;
  }

  const grades = await Grade.find(query)
    .populate('courseId', 'name instructor duration')
    .sort({ gradedAt: -1 });

  const gpaResult = await graderAgent.calculateGPA(studentId);

  res.json({
    success: true,
    data: grades,
    studentInfo: {
      studentId,
      studentName: student.name,
      overallGrade: student.grade
    },
    gpa: gpaResult
  });
});

const getGradesByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { sortBy = 'score', order = 'desc' } = req.query;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  const sortOrder = order === 'asc' ? 1 : -1;
  const grades = await Grade.find({ courseId })
    .populate('studentId', 'name email')
    .sort({ [sortBy]: sortOrder });

  const scores = grades.map(g => g.score);
  const classAverage = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  const gradeDistribution = {
    'A+': 0, 'A': 0, 'A-': 0,
    'B+': 0, 'B': 0, 'B-': 0,
    'C+': 0, 'C': 0, 'C-': 0,
    'D+': 0, 'D': 0, 'D-': 0,
    'F': 0
  };

  grades.forEach(g => {
    if (gradeDistribution.hasOwnProperty(g.letterGrade)) {
      gradeDistribution[g.letterGrade]++;
    }
  });

  res.json({
    success: true,
    data: grades,
    courseInfo: {
      courseId,
      courseName: course.name,
      totalStudents: grades.length
    },
    statistics: {
      classAverage: Math.round(classAverage * 100) / 100,
      highestScore: Math.max(...scores, 0),
      lowestScore: Math.min(...scores, 0),
      gradeDistribution
    }
  });
});

const updateGrade = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score, feedback } = req.body;

  const grade = await Grade.findById(id);
  if (!grade) {
    throw new NotFoundError('Grade');
  }

  const letterGrade = Grade.calculateLetterGrade(score);

  const updatedGrade = await Grade.findByIdAndUpdate(
    id,
    { score, letterGrade, feedback, gradedAt: new Date() },
    { new: true }
  ).populate('studentId', 'name email')
   .populate('courseId', 'name instructor');

  await updateStudentOverallGrade(grade.studentId);

  logger.info(`Grade updated: ${id}`);

  res.json({
    success: true,
    message: 'Grade updated successfully',
    data: updatedGrade
  });
});

const deleteGrade = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const grade = await Grade.findById(id);
  if (!grade) {
    throw new NotFoundError('Grade');
  }

  await Grade.findByIdAndDelete(id);

  await updateStudentOverallGrade(grade.studentId);

  logger.info(`Grade deleted: ${id}`);

  res.json({
    success: true,
    message: 'Grade deleted successfully'
  });
});

const getStudentGPA = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student');
  }

  const gpaResult = await graderAgent.calculateGPA(studentId);

  res.json({
    success: true,
    data: gpaResult
  });
});

async function updateStudentOverallGrade(studentId) {
  const grades = await Grade.find({ studentId });

  if (grades.length === 0) {
    await Student.findByIdAndUpdate(studentId, { grade: null });
    return;
  }

  const totalPoints = grades.reduce((sum, g) => {
    const gradePoints = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'D-': 0.7,
      'F': 0.0, 'I': 0.0, 'W': 0.0
    };
    return sum + (gradePoints[g.letterGrade] || 0);
  }, 0);

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

module.exports = {
  createGrade,
  getGradesByStudent,
  getGradesByCourse,
  updateGrade,
  deleteGrade,
  getStudentGPA
};