const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['leave', 'payroll', 'attendance', 'general', 'system'],
    default: 'general'
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
