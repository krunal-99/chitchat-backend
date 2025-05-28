import "reflect-metadata";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./utils/db";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();
import authRoute from "./routes/auth";
import messageRoute from "./routes/message";
const app = express();
app.use(cookieParser());
const PORT = process.env.PORT;
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoute);
app.use("/messages", messageRoute);

AppDataSource.initialize()
  .then(() => {
    console.log("Connected to database successfully.");

    app.listen(PORT, () => {
      console.log(`Server is running on PORT ${PORT}`);
    });
  })
  .catch((err) => console.error("Error connecting to database: ", err));

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World!");
});
