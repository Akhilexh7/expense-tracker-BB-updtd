// Simple middleware to read user id from a header when not using JWT
module.exports = async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') || req.header('X-User-Id');
    if (!userId) {
      return res.status(401).json({ error: 'No user id provided' });
    }

    // Attach a minimal user object to the request
    req.user = { userId };
    next();
  } catch (err) {
    console.error('❌ verifyToken middleware error:', err);
    return res.status(500).json({ error: 'Middleware error' });
  }
};