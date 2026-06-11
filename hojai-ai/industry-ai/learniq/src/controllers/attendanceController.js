const { Attendance, Student, Course } = require('../models');
const { asyncHandler, NotFoundError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, courseId, date, present, notes } = req.body;

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

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const existingAttendance = await Attendance.findOne({
    studentId,
    courseId,
    date: attendanceDate
  });

  let attendance;
  if (existingAttendance) {
    attendance = await Attendance.findByIdAndUpdate(
      existingAttendance._id,
      { present, notes },
      { new: true }
    );
    logger.info(`Updated attendance for student ${studentId} on ${attendanceDate}`);
  } else {
    attendance = new Attendance({
      studentId,
      courseId,
      date: attendanceDate,
      present,
      notes,
      markedBy: 'system'
    });
    await attendance.save();
    logger.info(`Marked attendance for student ${studentId} on ${attendanceDate}`);
  }

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: attendance
  });
});

const getAttendanceByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { startDate, endDate, studentId } = req.query;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  const query = { courseId };

  if (studentId) {
    query.studentId = studentId;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const attendanceRecords = await Attendance.find(query)
    .populate('studentId', 'name email')
    .sort({ date: -1 });

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.present).length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  res.json({
    success: true,
    data: attendanceRecords,
    summary: {
      courseId,
      courseName: course.name,
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    }
  });
});

const getAttendanceByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { courseId, startDate, endDate } = req.query;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student');
  }

  const query = { studentId };

  if (courseId) {
    query.courseId = courseId;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const attendanceRecords = await Attendance.find(query)
    .populate('courseId', 'name instructor')
    .sort({ date: -1 });

  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.present).length;

  res.json({
    success: true,
    data: attendanceRecords,
    summary: {
      studentId,
      studentName: student.name,
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays,
      attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 10000) / 100 : 0
    }
  });
});

const bulkMarkAttendance = asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];
  const errors = [];

  for (const record of records) {
    try {
      const student = await Student.findById(record.studentId);
      if (!student) {
        errors.push({ studentId: record.studentId, error: 'Student not found' });
        continue;
      }

      const isEnrolled = student.courseIds.some(cid => cid.toString() === courseId);
      if (!isEnrolled) {
        errors.push({ studentId: record.studentId, error: 'Not enrolled in course' });
        continue;
      }

      await Attendance.findOneAndUpdate(
        { studentId: record.studentId, courseId, date: attendanceDate },
        { studentId: record.studentId, courseId, date: attendanceDate, present: record.present },
        { upsert: true, new: true }
      );

      results.push({ studentId: record.studentId, status: 'success' });
    } catch (error) {
      errors.push({ studentId: record.studentId, error: error.message });
    }
  }

  logger.info(`Bulk attendance marked for course ${courseId}: ${results.length} success, ${errors.length} errors`);

  res.json({
    success: true,
    message: `Attendance marked: ${results.length} success, ${errors.length} errors`,
    data: { results, errors }
  });
});

module.exports = {
  markAttendance,
  getAttendanceByCourse,
  getAttendanceByStudent,
  bulkMarkAttendance
};