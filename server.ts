require("dotenv").config();
import { testConnection } from "config/db";
import express, { Express, Request, Response, NextFunction } from "express";
import path from "path";
import userRoutes from "./routes/userRoutes";


const app:Express = express();

app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req:Request, res:Response) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({success:false, message:"Not found! try again"});
});

const startServer= async()=>{
 
    await testConnection();
    app.use("/api/users", userRoutes);
    app.listen(process.env.PORT, () => {
        console.log(`Application is running on http://localhost:${process.env.PORT}`);  
        });
}   

export default startServer()