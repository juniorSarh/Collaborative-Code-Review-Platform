const userService = require("../service/userService");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
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
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    } else {
      res.status(500).json({ message: "An unknown error occurred during registration" });
    }
  }
};

const login = async (req, res) => {
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

module.exports = {
  register,
  login,
};
