import "reflect-metadata";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./utils/db";
import cookieParser from "cookie-parser";
import cors from "cors";
import jwt from "jsonwebtoken";
dotenv.config();
import authRoute from "./routes/auth";
import messageRoute from "./routes/message";
import { Server } from "socket.io";
import { createServer } from "http";
import { messageRepo, userRepo } from "./utils/constants";

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

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;

    const decoded = jwt.verify(
      tokenValue,
      process.env.JWT_SECRET as string
    ) as {
      id: number;
      user_name: string;
      image_url: string;
      email: string;
    };

    socket.data.userId = decoded.id;
    socket.data.userName = decoded.user_name;
    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", async (socket) => {
  console.log(`Socket connected: ${socket.id} for user: ${socket.data.userId}`);

  await userRepo.update({ id: socket.data.userId }, { is_online: true });
  io.emit("userStatus", { userId: socket.data.userId, isOnline: true });

  socket.join(`user:${socket.data.userId}`);

  socket.on("setup", async () => {
    try {
      const users = await userRepo.find({
        select: ["id", "user_name", "image_url", "is_online"],
      });
      socket.emit(
        "users",
        users.map((u) => ({
          id: u.id,
          user_name: u.user_name,
          image_url: u.image_url,
          isOnline: u.is_online,
        }))
      );
    } catch (error) {
      socket.emit("error", { message: "Failed to fetch users" });
    }
  });

  socket.on("joinChat", (receiverId) => {
    const room = [socket.data.userId, receiverId].sort().join(":");
    socket.join(room);
    console.log(`User ${socket.data.userId} joined room ${room}`);
  });

  socket.on("sendMessage", async ({ receiverId, text }) => {
    try {
      const sender = await userRepo.findOne({
        where: { id: socket.data.userId },
      });
      const receiver = await userRepo.findOne({ where: { id: receiverId } });
      if (!sender || !receiver) {
        socket.emit("error", { message: "User not found" });
        return;
      }
      const message = messageRepo.create({
        text,
        sender,
        receiver,
        timestamp: new Date(),
      });
      const savedMessage = await messageRepo.save(message);

      const room = [socket.data.userId, receiverId].sort().join(":");
      io.to(room).emit("message", {
        id: savedMessage.id,
        senderId: socket.data.userId,
        text,
        timestamp: savedMessage.timestamp,
      });
      io.emit("userUpdate", {
        userId: receiverId,
        last_message: text,
        last_message_time: savedMessage.timestamp,
      });
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("typing", ({ receiverId }) => {
    const room = [socket.data.userId, receiverId].sort().join(":");
    socket.to(room).emit("typing", { userId: socket.data.userId });
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const room = [socket.data.userId, receiverId].sort().join(":");
    socket.to(room).emit("stopTyping", { userId: socket.data.userId });
  });

  socket.on("disconnect", async () => {
    await userRepo.update({ id: socket.data.userId }, { is_online: false });
    io.emit("userStatus", { userId: socket.data.userId, isOnline: false });
    console.log(
      `Socket disconnected: ${socket.id} for user: ${socket.data.userId}`
    );
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", async (req: Request, res: Response) => {
  res.send("Hello World!");
});
