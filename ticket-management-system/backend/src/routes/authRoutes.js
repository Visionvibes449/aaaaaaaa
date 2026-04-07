const express = require('express');
const router = express.Router();
const { register, login, getMe, updateDetails, updatePassword, forgotPassword, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/error');
const { registerValidator, loginValidator, updateUserValidator } = require('../utils/validators');

router.post('/register', registerValidator, handleValidationErrors, register);
router.post('/login', loginValidator, handleValidationErrors, login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.post('/forgotpassword', forgotPassword);

module.exports = router;
