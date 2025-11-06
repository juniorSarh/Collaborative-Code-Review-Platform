require("dotenv").config();
import express, { Express, Request, Response, NextFunction, request } from "express";
import path from "path";

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
  try {
    app.listen(process.env.PORT, () => {
      console.log(`Application is running on http://localhost:${process.env.PORT}`);
    });
  }
    catch (error) { 
        console.error("Failed to start server:", error);
    }
}
  
// app.listen(process.env.PORT, () => {
//   console.log(`Application is running on http://localhost:${process.env.PORT}`);
// });
export default startServer()