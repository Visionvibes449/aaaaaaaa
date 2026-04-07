const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [3000, 'Comment cannot exceed 3000 characters']
  },
  attachments: [{
    filename: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isInternal: {
    type: Boolean,
    default: false // Internal notes visible only to agents/admins
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }
}, {
  timestamps: true
});

// Index for efficient queries
commentSchema.index({ ticket: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
