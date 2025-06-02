import "reflect-metadata";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./utils/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";
import { createServer } from "http";
import authRoute from "./routes/auth";
import messageRoute from "./routes/message";
import { initializeSocket } from "./socket";

dotenv.config();

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 4000;
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

const server = createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

AppDataSource.initialize()
  .then(() => {
    console.log("Connected to database successfully.");
    initializeSocket(io);
  })
  .catch((err) => {
    console.error("Error connecting to database:", err);
  });
server.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World!");
});
