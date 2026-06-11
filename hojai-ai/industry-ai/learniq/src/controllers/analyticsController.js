const { asyncHandler } = require('../middleware/errorHandler');
const { Student, Course, Grade, Attendance } = require('../models');
const logger = require('../config/logger');

const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    activeStudents,
    graduatedStudents,
    totalCourses,
    activeCourses,
    totalGrades,
    recentEnrollments,
    recentGraduations
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Student.countDocuments({ status: 'graduated' }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'active' }),
    Grade.countDocuments(),
    Student.countDocuments({ enrolledAt: { $gte: thirtyDaysAgo } }),
    Student.countDocuments({ status: 'graduated', updatedAt: { $gte: thirtyDaysAgo } })
  ]);

  const courseStats = await Course.aggregate([
    {
      $lookup: {
        from: 'students',
        localField: 'students',
        foreignField: '_id',
        as: 'studentDetails'
      }
    },
    {
      $project: {
        name: 1,
        studentCount: { $size: '$studentDetails' },
        enrollmentRate: {
          $multiply: [
            { $divide: [{ $size: '$students' }, { $ifNull: ['$maxStudents', 50] }] },
            100
          ]
        }
      }
    },
    { $sort: { studentCount: -1 } },
    { $limit: 10 }
  ]);

  const gradeDistribution = await Grade.aggregate([
    {
      $group: {
        _id: '$letterGrade',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const coursePerformance = await Course.aggregate([
    {
      $lookup: {
        from: 'grades',
        localField: 'students',
        foreignField: 'studentId',
        as: 'courseGrades'
      }
    },
    {
      $project: {
        name: 1,
        avgScore: {
          $cond: {
            if: { $gt: [{ $size: '$courseGrades' }, 0] },
            then: { $avg: '$courseGrades.score' },
            else: 0
          }
        },
        totalGrades: { $size: '$courseGrades' }
      }
    },
    { $sort: { avgScore: -1 } },
    { $limit: 10 }
  ]);

  const studentPerformance = await Student.aggregate([
    {
      $lookup: {
        from: 'grades',
        localField: '_id',
        foreignField: 'studentId',
        as: 'grades'
      }
    },
    {
      $match: { 'grades.0': { $exists: true } }
    },
    {
      $project: {
        name: 1,
        email: 1,
        grade: 1,
        status: 1,
        avgScore: { $avg: '$grades.score' },
        courseCount: { $size: '$courseIds' }
      }
    },
    {
      $sort: { avgScore: -1 }
    },
    { $limit: 10 }
  ]);

  const attendanceStats = await Attendance.aggregate([
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: ['$present', 1, 0] }
        }
      }
    }
  ]);

  const overallAttendanceRate = attendanceStats.length > 0
    ? (attendanceStats[0].presentCount / attendanceStats[0].totalRecords) * 100
    : 0;

  const revenueStats = await Course.aggregate([
    {
      $lookup: {
        from: 'students',
        localField: 'students',
        foreignField: '_id',
        as: 'enrolledStudents'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: [{ $size: '$enrolledStudents' }, '$price'] }
        },
        totalCourses: { $sum: 1 },
        avgCoursePrice: { $avg: '$price' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        students: {
          total: totalStudents,
          active: activeStudents,
          graduated: graduatedStudents,
          recentEnrollments,
          recentGraduations
        },
        courses: {
          total: totalCourses,
          active: activeCourses
        },
        grades: {
          total: totalGrades
        },
        attendance: {
          overallRate: Math.round(overallAttendanceRate * 100) / 100
        },
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          avgCoursePrice: Math.round((revenueStats[0]?.avgCoursePrice || 0) * 100) / 100
        }
      },
      courseStats,
      gradeDistribution: gradeDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      coursePerformance: coursePerformance.map(c => ({
        ...c,
        avgScore: Math.round((c.avgScore || 0) * 100) / 100
      })),
      topStudents: studentPerformance.map(s => ({
        ...s,
        avgScore: Math.round((s.avgScore || 0) * 100) / 100
      })),
      timestamp: new Date().toISOString()
    }
  });
});

const getStudentAnalytics = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await Student.findById(studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  const [grades, attendance, enrolledCourses] = await Promise.all([
    Grade.find({ studentId }),
    Attendance.find({ studentId }),
    Course.find({ _id: { $in: student.courseIds } })
  ]);

  const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
  const avgScore = grades.length > 0 ? totalScore / grades.length : 0;

  const presentDays = attendance.filter(a => a.present).length;
  const attendanceRate = attendance.length > 0
    ? (presentDays / attendance.length) * 100
    : 0;

  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };

  const gpa = grades.length > 0
    ? grades.reduce((sum, g) => sum + (gradePoints[g.letterGrade] || 0), 0) / grades.length
    : 0;

  res.json({
    success: true,
    data: {
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        status: student.status,
        enrolledAt: student.enrolledAt
      },
      academic: {
        averageScore: Math.round(avgScore * 100) / 100,
        gpa: Math.round(gpa * 100) / 100,
        overallGrade: student.grade,
        coursesEnrolled: enrolledCourses.length,
        completedCourses: grades.length
      },
      attendance: {
        rate: Math.round(attendanceRate * 100) / 100,
        present: presentDays,
        total: attendance.length
      },
      courses: enrolledCourses.map(c => ({
        id: c._id,
        name: c.name,
        instructor: c.instructor
      }))
    }
  });
});

const getCourseAnalytics = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  const [grades, attendance] = await Promise.all([
    Grade.find({ courseId }),
    Attendance.find({ courseId })
  ]);

  const scores = grades.map(g => g.score);
  const avgScore = scores.length > 0
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

  const presentDays = attendance.filter(a => a.present).length;
  const attendanceRate = attendance.length > 0
    ? (presentDays / attendance.length) * 100
    : 0;

  const gradeDistribution = {};
  grades.forEach(g => {
    gradeDistribution[g.letterGrade] = (gradeDistribution[g.letterGrade] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      course: {
        id: course._id,
        name: course.name,
        instructor: course.instructor,
        status: course.status
      },
      enrollment: {
        current: course.students.length,
        max: course.maxStudents,
        available: course.maxStudents - course.students.length,
        utilizationRate: Math.round((course.students.length / course.maxStudents) * 100) / 100
      },
      performance: {
        averageScore: Math.round(avgScore * 100) / 100,
        highestScore: Math.max(...scores, 0),
        lowestScore: Math.min(...scores, 0),
        gradeDistribution,
        totalGraded: grades.length
      },
      attendance: {
        rate: Math.round(attendanceRate * 100) / 100,
        totalRecords: attendance.length
      }
    }
  });
});

module.exports = {
  getDashboard,
  getStudentAnalytics,
  getCourseAnalytics
};