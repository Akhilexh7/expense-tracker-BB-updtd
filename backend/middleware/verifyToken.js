const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = header.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    
    next();
  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired. Please login again." });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    return res.status(401).json({ error: "Token verification failed" });
  }
};