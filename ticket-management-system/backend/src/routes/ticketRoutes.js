const express = require('express');
const router = express.Router();
const { 
  getTickets, 
  getTicket, 
  createTicket, 
  updateTicket, 
  assignTicket, 
  deleteTicket,
  getStats 
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');
const { 
  createTicketValidator, 
  updateTicketValidator,
  paginationValidator,
  searchValidator
} = require('../utils/validators');

// Stats route (must be before /:id)
router.get('/stats', protect, getStats);

// Main routes
router.get('/', protect, paginationValidator, handleValidationErrors, searchValidator, handleValidationErrors, getTickets);
router.post('/', protect, createTicketValidator, handleValidationErrors, createTicket);
router.get('/:id', protect, getTicket);
router.put('/:id', protect, updateTicketValidator, handleValidationErrors, updateTicket);
router.put('/:id/assign', protect, authorize('admin', 'agent'), assignTicket);
router.delete('/:id', protect, authorize('admin'), deleteTicket);

module.exports = router;
