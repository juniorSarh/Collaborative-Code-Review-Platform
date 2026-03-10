import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import { UserRole } from '../models/user';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Generate JWT token
const generateToken = (
  id: string, 
  email: string, 
  role: UserRole, 
  type: 'access' | 'refresh'
): string => {
  return JWT.sign(
    { 
      id, 
      email, 
      role,
      type,
    },
    JWT_SECRET,
    { 
      expiresIn: type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY,
    }
  );
};

// Verify JWT token
const verifyToken = (token: string, type: 'access' | 'refresh') => {
  try {
    const decoded = JWT.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      type: string;
      iat: number;
      exp: number;
    };

    if (decoded.type !== type) {
      throw new Error('Invalid token type');
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as UserRole,
    };
  } catch (error) {
    throw error;
  }
};

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
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
      const user = verifyToken(token, 'access');
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
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

// Role-based authorization middleware
const authorize = (roles: UserRole | UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};

export {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
};
