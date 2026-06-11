const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [3, 'Course name must be at least 3 characters'],
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  instructor: {
    type: String,
    required: [true, 'Instructor name is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  maxStudents: {
    type: Number,
    default: 50,
    min: [1, 'Maximum students must be at least 1']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'archived'],
    default: 'active'
  },
  startDate: {
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

courseSchema.index({ status: 1 });
courseSchema.index({ instructor: 1 });

courseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

courseSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Course', courseSchema);