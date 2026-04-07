const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = this.generateToken(user._id);

  const userObj = user.toObject();
  delete userObj.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      avatar: userObj.avatar,
      preferences: userObj.preferences
    }
  });
};

// Format date for API responses
exports.formatDate = (date) => {
  return new Date(date).toISOString();
};

// Pagination helper
exports.getPaginationParams = (page, limit) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Build pagination object
exports.buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    pages: totalPages,
    hasMore: page < totalPages,
    hasPrev: page > 1
  };
};

// Sanitize user object
exports.sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};
