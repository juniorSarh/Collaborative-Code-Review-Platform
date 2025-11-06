require("dotenv").config();
import express, { Express, Request, Response, NextFunction, request } from "express";

const app:Express = express();

app.use(express.json());

app.get("/", (req:Request, res:Response) => {
    res.send("Welcome to the Collaborative Code Review Platform API");
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(400).json({success:false,message:"Not found! try again"});
});


app.listen(process.env.PORT, () => {
  console.log(`Application is running on http://localhost:${process.env.PORT}`);
});
export default app;