import "reflect-metadata";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./utils/db";
import cookieParser from "cookie-parser";
import cors from "cors";
dotenv.config();
import authRoute from "./routes/auth";
import messageRoute from "./routes/message";
import { Server } from "socket.io";
import { createServer } from "http";
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
  })
  .catch((err) => console.error("Error connecting to database: ", err));

const server = createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    console.log("UserData: ", userData);
    userData ? socket.join(userData?.id) : "";
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World!");
});
