import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserModel, UserRole } from '../models/User';
import { ApiError } from '../middlewares/errorHandler';

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

interface AuthResponse {
  success: boolean;
  data: {
    user: Omit<User, 'password_hash'>;
    token: string;
  };
}

interface RefreshTokenCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  maxAge: number;
}

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { email, password, name, role = 'submitter' } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'Email already in use');
    }

    // Create user
    const user = await UserModel.create(email, password, role, name);
    
    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: this.sanitizeUser(user),
        token: accessToken,
      },
    });
  }

  static async login(req: Request, res: Response) {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Validate password
    const isValidPassword = await UserModel.validatePassword(user, password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: this.sanitizeUser(user),
        token: accessToken,
      },
    });
  }

  static async getProfile(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    res.json({
      success: true,
      data: this.sanitizeUser(user),
    });
  }

  static async updateProfile(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    
    const { name, avatarUrl } = req.body;
    const updatedUser = await UserModel.updateProfile(req.user.id, { name, avatar_url: avatarUrl });
    res.json({
      success: true,
      data: this.sanitizeUser(updatedUser),
    });
  }

  static async changePassword(req: Request, res: Response) {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }
    
    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isValidPassword = await UserModel.validatePassword(user, currentPassword);
    if (!isValidPassword) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    await UserModel.changePassword(user.id, newPassword);
    
    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ success: true, message: 'Logged out successfully' });
  }

  private static generateTokens(user: User) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  private static sanitizeUser(user: User) {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
