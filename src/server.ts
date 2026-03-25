require("dotenv").config();
import { error } from "console";
import express, { Express, Request, NextFunction, Response } from "express";
import path from "path";
import { testDBConnection } from "./config/database";
import userRoutes from "./routes/userRoutes";
import projectRoutes from "./routes/projectRoutes";
import submissionRoutes from "./routes/submissionRoute";
import authRoutes from "./routes/authRoutes";
const app: Express = express();
app.use(express.json());
// Serve static assets
app.use(express.static(path.join(__dirname, "public")));
// Home route
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/auth", authRoutes);
// 404 handler
app.use((request: Request, response: Response, next: NextFunction) => {
  response
    .status(404)
    .json({ success: false, message: "Not found: this route does not exist" });
});
// Start server properly with async DB test
const startServer = async () => {
  try {
    await testDBConnection(); // await the DB connection
    app.listen(process.env.PORT, () => {
      console.log(
        `Application is running on http://localhost:${process.env.PORT}`
      );
    });
  } catch (err) {
    console.error("Failed to start server due to DB connection error:", err);
    process.exit(1);
  }
};
startServer();
export default app;
