const { Student, Course } = require('../models');
const { asyncHandler, NotFoundError, ConflictError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, courseIds, grade, status } = req.body;

  const existingStudent = await Student.findOne({ email });
  if (existingStudent) {
    throw new ConflictError('Student with this email already exists');
  }

  const student = new Student({
    name,
    email,
    phone,
    courseIds: courseIds || [],
    grade,
    status: status || 'active'
  });

  await student.save();

  if (courseIds && courseIds.length > 0) {
    await Course.updateMany(
      { _id: { $in: courseIds } },
      { $addToSet: { students: student._id } }
    );
  }

  logger.info(`Student created: ${student._id}`);

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student
  });
});

const getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'asc' ? 1 : -1;

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate('courseIds', 'name instructor')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    Student.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id)
    .populate('courseIds', 'name description instructor duration price');

  if (!student) {
    throw new NotFoundError('Student');
  }

  res.json({
    success: true,
    data: student
  });
});

const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.email) {
    const existingStudent = await Student.findOne({
      email: updates.email,
      _id: { $ne: id }
    });
    if (existingStudent) {
      throw new ConflictError('Another student with this email already exists');
    }
  }

  if (updates.courseIds) {
    const currentStudent = await Student.findById(id);
    const removedCourses = currentStudent.courseIds.filter(
      cid => !updates.courseIds.includes(cid.toString())
    );
    const addedCourses = updates.courseIds.filter(
      cid => !currentStudent.courseIds.map(c => c.toString()).includes(cid)
    );

    await Course.updateMany(
      { _id: { $in: removedCourses } },
      { $pull: { students: id } }
    );

    await Course.updateMany(
      { _id: { $in: addedCourses } },
      { $addToSet: { students: id } }
    );
  }

  const student = await Student.findByIdAndUpdate(
    id,
    { ...updates, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate('courseIds', 'name instructor');

  if (!student) {
    throw new NotFoundError('Student');
  }

  logger.info(`Student updated: ${id}`);

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: student
  });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByIdAndDelete(id);

  if (!student) {
    throw new NotFoundError('Student');
  }

  await Course.updateMany(
    { students: id },
    { $pull: { students: id } }
  );

  logger.info(`Student deleted: ${id}`);

  res.json({
    success: true,
    message: 'Student deleted successfully'
  });
});

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};