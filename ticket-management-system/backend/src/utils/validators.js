const { body, param, query, validationResult } = require('express-validator');

// Auth validators
exports.registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['user', 'agent', 'admin']).withMessage('Invalid role')
];

exports.loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Ticket validators
exports.createTicketValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['technical', 'billing', 'general', 'feature_request', 'bug_report', 'other']).withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid agent ID')
];

exports.updateTicketValidator = [
  param('id')
    .isMongoId().withMessage('Invalid ticket ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description cannot exceed 5000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'pending', 'resolved', 'closed']).withMessage('Invalid status'),
  body('category')
    .optional()
    .isIn(['technical', 'billing', 'general', 'feature_request', 'bug_report', 'other']).withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('assignedTo')
    .optional()
    .allowNull()
    .isMongoId().withMessage('Invalid agent ID')
];

// Comment validators
exports.createCommentValidator = [
  param('ticketId')
    .isMongoId().withMessage('Invalid ticket ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 3000 }).withMessage('Comment cannot exceed 3000 characters'),
  body('isInternal')
    .optional()
    .isBoolean().withMessage('isInternal must be a boolean'),
  body('parentComment')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID')
];

// User validators
exports.updateUserValidator = [
  param('id')
    .isMongoId().withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim(),
  body('department')
    .optional()
    .trim(),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  body('role')
    .optional()
    .isIn(['user', 'agent', 'admin']).withMessage('Invalid role')
];

// Pagination validator
exports.paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

// Search validator
exports.searchValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query too long'),
  query('status')
    .optional()
    .isIn(['open', 'in_progress', 'pending', 'resolved', 'closed']).withMessage('Invalid status'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('category')
    .optional()
    .isIn(['technical', 'billing', 'general', 'feature_request', 'bug_report', 'other']).withMessage('Invalid category')
];
