const Session = require('../models/session.model'); 
const User = require('../models/user.model'); 

const validateSession = async (req, res, next) => {
  
  if (req.path === '/auth/login' || req.path === '/ping') {
    return next(); 
  }

  const sessionHash = req.headers.authorization?.split('Bearer ')[1];

  if (!sessionHash) {
    return res.status(401).json({ message: "Bitch are you stupid or what?" });
  }

  try {
    const session = await Session.findOne({ sessionHash });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ message: "Session is invalid or expired" });
    }

    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = validateSession;
