const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');
const { getPaginationParams, buildPagination } = require('../utils/helpers');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

// @desc    Get all tickets with filters
// @route   GET /api/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query.page, req.query.limit);
    
    // Build query
    let query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      query.createdBy = req.user.id;
    } else if (req.user.role === 'agent') {
      query.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }
    // Admin can see all tickets

    // Apply filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const total = await Ticket.countDocuments(query);
    
    const tickets = await Ticket.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: tickets.length,
      pagination: buildPagination(total, page, limit),
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email avatar role')
      .populate('assignedTo', 'name email avatar role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      });
    }

    // Get comments for this ticket
    const comments = await Comment.find({ ticket: ticket._id })
      .populate('author', 'name email avatar role')
      .sort({ createdAt: 1 });

    // Get activity log
    const activities = await ActivityLog.find({ ticket: ticket._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        ticket,
        comments,
        activities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, priority, category, tags, assignedTo } = req.body;

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || 'medium',
      category,
      tags: tags || [],
      createdBy: req.user.id,
      assignedTo
    });

    // Log activity
    await notificationService.logActivity(
      ticket._id,
      req.user.id,
      'created',
      `Ticket created by ${req.user.name}`
    );

    // Send notification
    await notificationService.notifyTicketCreated(ticket, req.user);

    logger.info(`Ticket created: ${title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ticket'
      });
    }

    // Track changes for activity log
    const changes = [];
    const allowedFields = ['title', 'description', 'priority', 'status', 'category', 'tags'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== ticket[field]) {
        changes.push({
          field,
          oldValue: ticket[field],
          newValue: req.body[field]
        });
      }
    });

    // Update ticket
    ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Log activities
    if (changes.length > 0) {
      changes.forEach(change => {
        notificationService.logActivity(
          ticket._id,
          req.user.id,
          `${change.field}_changed`,
          `${change.field} changed from ${change.oldValue} to ${change.newValue}`,
          change
        );
      });
    }

    // Notify participants about updates
    const participants = await notificationService.getTicketParticipants(ticket._id);
    await notificationService.notifyTicketUpdated(ticket, participants, req.user, changes);

    logger.info(`Ticket updated: ${ticket.title}`);

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign ticket to agent
// @route   PUT /api/tickets/:id/assign
// @access  Private (Admin/Agent only)
exports.assignTicket = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Verify agent exists
    const agent = await User.findById(assignedTo);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'Invalid agent ID'
      });
    }

    const oldAssignee = ticket.assignedTo;
    ticket.assignedTo = assignedTo;
    await ticket.save();

    // Log activity
    await notificationService.logActivity(
      ticket._id,
      req.user.id,
      'assigned',
      `Ticket assigned to ${agent.name}`,
      { field: 'assignedTo', oldValue: oldAssignee, newValue: assignedTo }
    );

    // Notify the assigned agent
    await notificationService.notifyTicketAssigned(ticket, agent, req.user);

    logger.info(`Ticket ${ticket.title} assigned to ${agent.name}`);

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin only)
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.deleteOne();

    logger.info(`Ticket deleted: ${ticket.title}`);

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/tickets/stats
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    // Base query based on role
    let baseQuery = {};
    if (req.user.role === 'user') {
      baseQuery.createdBy = req.user.id;
    } else if (req.user.role === 'agent') {
      baseQuery.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ];
    }

    // Total tickets
    const totalTickets = await Ticket.countDocuments(baseQuery);

    // Status breakdown
    const statusBreakdown = await Ticket.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Priority breakdown
    const priorityBreakdown = await Ticket.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Category breakdown
    const categoryBreakdown = await Ticket.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent tickets (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentQuery = { ...baseQuery, createdAt: { $gte: sevenDaysAgo } };
    const recentTickets = await Ticket.countDocuments(recentQuery);

    // SLA metrics
    const slaMetrics = await Ticket.aggregate([
      { $match: { ...baseQuery, 'sla.responseTime.actual': { $exists: true } } },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$sla.responseTime.actual' },
          slaMetCount: { $sum: { $cond: ['$sla.responseTime.met', 1, 0] } },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTickets,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        categoryBreakdown: categoryBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentTickets,
        slaMetrics: slaMetrics[0] || { avgResponseTime: 0, slaMetCount: 0, totalCount: 0 }
      }
    });
  } catch (error) {
    next(error);
  }
};
