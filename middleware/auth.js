const JWT = require("jsonwebtoken");

const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = JWT.verify(token, process.env.JWT_SECRET || "defaultsecret");
      req.user = {
        id: decoded.payload.userId,
        email: decoded.payload.email,
        role: decoded.payload.role,
      };
      next();
    } catch (error) {
      if (error instanceof JWT.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      
      if (error instanceof JWT.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      code: 'AUTH_FAILED',
    });
  }
};

module.exports = {
  authenticate,
};
