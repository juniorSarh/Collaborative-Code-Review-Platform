require("dotenv").config();
import express, { Express, Request, Response } from "express";

const app:Express = express();


app.get("/", (req:Request, res:Response) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT, () => {
  console.log(`Application is running on http://localhost:${process.env.PORT}`);
});
export default app;