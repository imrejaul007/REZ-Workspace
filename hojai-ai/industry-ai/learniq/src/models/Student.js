const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\d\s\-+()]+$/, 'Please provide a valid phone number']
  },
  courseIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F', 'I', 'W', null],
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'suspended', 'alumni'],
    default: 'active'
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

studentSchema.index({ email: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ courseIds: 1 });

studentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

studentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Student', studentSchema);