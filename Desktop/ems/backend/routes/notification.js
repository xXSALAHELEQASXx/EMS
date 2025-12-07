const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { isRead, limit = 50 } = req.query;
    
    let query = { userId: req.userId };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.userId, 
      isRead: false 
    });
    
    res.json({ 
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch notifications', 
      error: error.message 
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Notification marked as read',
      data: notification 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update notification', 
      error: error.message 
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ 
      success: true,
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to update notifications', 
      error: error.message 
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete notification', 
      error: error.message 
    });
  }
});

module.exports = router;
