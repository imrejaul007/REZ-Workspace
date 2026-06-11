const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  present: {
    type: Boolean,
    default: false
  },
  markedBy: {
    type: String,
    default: 'system'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ courseId: 1, date: 1 });
attendanceSchema.index({ studentId: 1 });

attendanceSchema.statics.markAttendance = async function(studentId, courseId, date, present) {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const attendance = await this.findOneAndUpdate(
    { studentId, courseId, date: normalizedDate },
    { studentId, courseId, date: normalizedDate, present },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return attendance;
};

attendanceSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Attendance', attendanceSchema);