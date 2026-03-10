import { Router } from "express";
import { register, login, getProfile, updateProfile } from "../controllers/userController_new";
import { authenticate } from "../middleware/auth_updated";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

export default router;
