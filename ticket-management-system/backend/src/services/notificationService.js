const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../utils/emailService');
const logger = require('../utils/logger');

// Create notification
exports.createNotification = async (userId, title, message, type, relatedTicket = null, relatedComment = null, actionUrl = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedTicket,
      relatedComment,
      actionUrl
    });
    
    // Emit socket event if socket.io is available
    if (global.io) {
      global.io.to(`user:${userId.toString()}`).emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    return null;
  }
};

// Send ticket creation notification and email
exports.notifyTicketCreated = async (ticket, user) => {
  try {
    // Email notification
    if (user.preferences.emailNotifications) {
      await sendEmail({
        to: user.email,
        subject: `Ticket Created: ${ticket.title}`,
        html: emailTemplates.ticketCreated(ticket, user)
      });
    }
    
    // In-app notification
    await this.createNotification(
      user._id,
      'Ticket Created',
      `Your ticket "${ticket.title}" has been created successfully.`,
      'ticket_created',
      ticket._id,
      null,
      `/tickets/${ticket._id}`
    );
  } catch (error) {
    logger.error(`Error notifying ticket creation: ${error.message}`);
  }
};

// Send ticket assignment notification
exports.notifyTicketAssigned = async (ticket, agent, assigner) => {
  try {
    // Email notification
    if (agent.preferences.emailNotifications) {
      await sendEmail({
        to: agent.email,
        subject: `New Ticket Assigned: ${ticket.title}`,
        html: emailTemplates.ticketAssigned(ticket, agent, assigner)
      });
    }
    
    // In-app notification
    await this.createNotification(
      agent._id,
      'Ticket Assigned',
      `You have been assigned ticket "${ticket.title}".`,
      'ticket_assigned',
      ticket._id,
      null,
      `/tickets/${ticket._id}`
    );
  } catch (error) {
    logger.error(`Error notifying ticket assignment: ${error.message}`);
  }
};

// Send comment notification
exports.notifyCommentAdded = async (ticket, commenter, recipients) => {
  try {
    for (const recipient of recipients) {
      if (recipient._id.toString() === commenter._id.toString()) continue;
      
      // Email notification
      if (recipient.preferences.emailNotifications) {
        await sendEmail({
          to: recipient.email,
          subject: `New Comment on: ${ticket.title}`,
          html: emailTemplates.commentAdded(ticket, recipient, commenter)
        });
      }
      
      // In-app notification
      await this.createNotification(
        recipient._id,
        'New Comment',
        `${commenter.name} added a comment to "${ticket.title}".`,
        'comment_added',
        ticket._id,
        null,
        `/tickets/${ticket._id}`
      );
    }
  } catch (error) {
    logger.error(`Error notifying comment: ${error.message}`);
  }
};

// Log activity
exports.logActivity = async (ticketId, userId, action, description, changes = null, metadata = null) => {
  try {
    await ActivityLog.create({
      ticket: ticketId,
      user: userId,
      action,
      description,
      changes,
      metadata
    });
  } catch (error) {
    logger.error(`Error logging activity: ${error.message}`);
  }
};

// Get participants of a ticket (for notifications)
exports.getTicketParticipants = async (ticketId) => {
  try {
    const ticket = await Ticket.findById(ticketId)
      .populate('createdBy')
      .populate('assignedTo');
    
    if (!ticket) return [];
    
    const participantIds = new Set();
    participantIds.add(ticket.createdBy._id.toString());
    if (ticket.assignedTo) {
      participantIds.add(ticket.assignedTo._id.toString());
    }
    
    // Get comment authors
    const comments = await Comment.find({ ticket: ticketId }).select('author');
    comments.forEach(comment => {
      participantIds.add(comment.author.toString());
    });
    
    // Fetch all users
    const users = await User.find({ _id: { $in: Array.from(participantIds) } });
    return users;
  } catch (error) {
    logger.error(`Error getting ticket participants: ${error.message}`);
    return [];
  }
};
