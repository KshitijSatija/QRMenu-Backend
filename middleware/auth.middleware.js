const Session = require('../models/session.model'); 
const User = require('../models/user.model'); 

const validateSession = async (req, res, next) => {
  
  if (req.path === '/auth/login') {
    return next(); 
  }

  const sessionHash = req.headers.authorization?.split('Bearer ')[1];

  if (!sessionHash) {
    return res.status(401).json({ message: "Bitch are you stupid or what?" });
  }

  try {
    // Find the session by session hash
    const session = await Session.findOne({ sessionHash });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ message: "Session is invalid or expired" });
    }

    // Find the user associated with this session
    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request object for access in the route handlers
    req.user = user;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = validateSession;
