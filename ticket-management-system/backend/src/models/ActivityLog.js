const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created',
      'updated',
      'status_changed',
      'priority_changed',
      'assigned',
      'unassigned',
      'comment_added',
      'attachment_added',
      'tag_added',
      'tag_removed'
    ]
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    field: String,
    oldValue: mongoose.Mixed,
    newValue: mongoose.Mixed
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for efficient queries
activityLogSchema.index({ ticket: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
