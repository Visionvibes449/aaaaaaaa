const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'pending', 'resolved', 'closed'],
    default: 'open'
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['technical', 'billing', 'general', 'feature_request', 'bug_report', 'other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  sla: {
    responseTime: {
      target: Number, // in hours
      actual: Number, // in hours
      met: Boolean
    },
    resolutionTime: {
      target: Number, // in hours
      actual: Number, // in hours
      met: Boolean
    }
  },
  timesheets: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    timeSpent: Number, // in minutes
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
ticketSchema.index({ status: 1, priority: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });
ticketSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Calculate SLA metrics
ticketSchema.methods.calculateSLA = function(slaConfig) {
  const now = Date.now();
  const createdAt = this.createdAt;
  
  // Response time SLA (first comment or assignment)
  if (!this.sla.responseTime.actual) {
    const firstAction = this.timesheets[0];
    if (firstAction) {
      const responseHours = (firstAction.timestamp - createdAt) / (1000 * 60 * 60);
      const targetHours = slaConfig[`SLA_RESPONSE_TIME_${this.priority.toUpperCase()}`] || 24;
      this.sla.responseTime = {
        target: targetHours,
        actual: parseFloat(responseHours.toFixed(2)),
        met: responseHours <= targetHours
      };
    }
  }
  
  // Resolution time SLA
  if (this.status === 'resolved' || this.status === 'closed') {
    if (!this.sla.resolutionTime.actual) {
      const resolutionHours = (now - createdAt) / (1000 * 60 * 60);
      const targetHours = slaConfig[`SLA_RESOLUTION_TIME_${this.priority.toUpperCase()}`] || 72;
      this.sla.resolutionTime = {
        target: targetHours,
        actual: parseFloat(resolutionHours.toFixed(2)),
        met: resolutionHours <= targetHours
      };
    }
  }
  
  return this.sla;
};

module.exports = mongoose.model('Ticket', ticketSchema);
