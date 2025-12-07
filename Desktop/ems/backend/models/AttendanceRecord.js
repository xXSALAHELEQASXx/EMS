const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  checkIn: { 
    type: Date 
  },
  checkOut: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present' 
  },
  workHours: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
attendanceSchema.index({ employeeId: 1, date: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceSchema);
