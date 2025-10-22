const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

const sessionAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is active
    const session = await Session.findByToken(token);
    
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = sessionAuth;