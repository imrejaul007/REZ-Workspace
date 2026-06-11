const { Course, Student } = require('../models');
const { asyncHandler, NotFoundError, ConflictError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const createCourse = asyncHandler(async (req, res) => {
  const { name, description, instructor, duration, price, maxStudents, status } = req.body;

  const course = new Course({
    name,
    description,
    instructor,
    duration,
    price,
    maxStudents: maxStudents || 50,
    status: status || 'active'
  });

  await course.save();

  logger.info(`Course created: ${course._id}`);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course
  });
});

const getAllCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    instructor,
    minPrice,
    maxPrice,
    search,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (instructor) {
    query.instructor = { $regex: instructor, $options: 'i' };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { instructor: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate('students', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Course.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id)
    .populate('students', 'name email phone status grade');

  if (!course) {
    throw new NotFoundError('Course');
  }

  res.json({
    success: true,
    data: course
  });
});

const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.students) {
    delete updates.students;
  }

  const course = await Course.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('students', 'name email');

  if (!course) {
    throw new NotFoundError('Course');
  }

  logger.info(`Course updated: ${id}`);

  res.json({
    success: true,
    message: 'Course updated successfully',
    data: course
  });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.students && course.students.length > 0) {
    await Student.updateMany(
      { courseIds: id },
      { $pull: { courseIds: id } }
    );
  }

  await Course.findByIdAndDelete(id);

  logger.info(`Course deleted: ${id}`);

  res.json({
    success: true,
    message: 'Course deleted successfully'
  });
});

const addStudentToCourse = asyncHandler(async (req, res) => {
  const { courseId, studentId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  if (course.students.length >= course.maxStudents) {
    throw new ConflictError('Course is full');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student');
  }

  if (course.students.includes(student._id)) {
    throw new ConflictError('Student already enrolled in this course');
  }

  await Promise.all([
    Course.findByIdAndUpdate(courseId, {
      $addToSet: { students: studentId }
    }),
    Student.findByIdAndUpdate(studentId, {
      $addToSet: { courseIds: courseId }
    })
  ]);

  logger.info(`Added student ${studentId} to course ${courseId}`);

  res.json({
    success: true,
    message: 'Student added to course successfully'
  });
});

const removeStudentFromCourse = asyncHandler(async (req, res) => {
  const { courseId, studentId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError('Course');
  }

  await Promise.all([
    Course.findByIdAndUpdate(courseId, {
      $pull: { students: studentId }
    }),
    Student.findByIdAndUpdate(studentId, {
      $pull: { courseIds: courseId }
    })
  ]);

  logger.info(`Removed student ${studentId} from course ${courseId}`);

  res.json({
    success: true,
    message: 'Student removed from course successfully'
  });
});

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addStudentToCourse,
  removeStudentFromCourse
};