import { Request, Response } from "express";
import * as userService from "../service/userService";
import JWT from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }
  try {
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = await userService.createUser(name, email, password, role);
    res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      res.status(500).json({
        message: `Error registering user: ${error.message}`,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res
        .status(500)
        .json({ message: "An unknown error occurred during registration" });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = JWT.sign(
      { payload },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Error logging in the user" });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const user = await userService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const { name, email, avatar_url } = req.body;
    const updatedUser = await userService.updateUser(userId, { name, email, avatar_url });
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar_url: updatedUser.avatar_url,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating user profile" });
  }
};
