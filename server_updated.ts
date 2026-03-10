require("dotenv").config();
import { testConnection } from "./config/db";
import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";
import userRoutes from "./routes/userRoutes_new"
import projectRoutes from "./routes/projectRoutes_new"

const app:Express = express();

app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req:Request, res:Response) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({success:false, message:"Internal server error"});
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({success:false, message:"Route not found"});
});

const startServer= async()=>{
    await testConnection();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Application is running on http://localhost:${PORT}`);  
        });
}   

export default startServer()
