import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { conversationRepo, messageRepo, userRepo } from "./utils/constants";

interface DecodedToken {
  id: number;
  user_name: string;
  image_url: string;
  email: string;
}

interface CustomSocket extends Socket {
  data: {
    userId?: number;
    userName?: string;
  };
}

export const initializeSocket = (io: Server) => {
  io.use(async (socket: CustomSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error("Socket middleware: No token provided");
        return next(new Error("Authentication error: No token provided"));
      }
      const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;
      const decoded = jwt.verify(
        tokenValue,
        process.env.JWT_SECRET as string
      ) as DecodedToken;
      socket.data.userId = decoded.id;
      socket.data.userName = decoded.user_name;
      next();
    } catch (error) {
      console.error("Socket middleware: Authentication failed", error);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket: CustomSocket) => {
    try {
      await userRepo.update({ id: socket.data.userId! }, { is_online: true });

      io.emit("userStatus", {
        userId: socket.data.userId,
        isOnline: true,
      });

      socket.join(`user:${socket.data.userId}`);

      socket.on("joinChat", (receiverId: number) => {
        const room = [socket.data.userId!, receiverId].sort().join(":");
        socket.join(room);
      });

      socket.on(
        "sendMessage",
        async ({ receiverId, text }: { receiverId: number; text: string }) => {
          try {
            const sender = await userRepo.findOne({
              where: { id: socket.data.userId! },
            });
            const receiver = await userRepo.findOne({
              where: { id: receiverId },
            });
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

            let conversation = await conversationRepo.findOne({
              where: [
                { user1: { id: sender.id }, user2: { id: receiverId } },
                { user1: { id: receiverId }, user2: { id: sender.id } },
              ],
            });

            if (!conversation) {
              conversation = conversationRepo.create({
                user1: sender,
                user2: receiver,
                last_message: text,
                last_message_time: new Date(),
              });
            } else {
              conversation.last_message = text;
              conversation.last_message_time = new Date();
            }

            await conversationRepo.save(conversation);

            const room = [socket.data.userId!, receiverId].sort().join(":");
            io.to(room).emit("message", {
              id: savedMessage.id,
              senderId: socket.data.userId,
              text,
              timestamp: savedMessage.timestamp,
            });
            io.to(`user:${receiverId}`).emit("userUpdate", {
              userId: sender.id,
              last_message: text,
              last_message_time: savedMessage.timestamp,
            });
            io.to(`user:${socket.data.userId}`).emit("userUpdate", {
              userId: receiverId,
              last_message: text,
              last_message_time: savedMessage.timestamp,
            });
          } catch (error) {
            console.error(
              `Error in sendMessage for user ${socket.data.userId}:`,
              error
            );
            socket.emit("error", { message: "Failed to send message" });
          }
        }
      );

      socket.on("typing", ({ receiverId }: { receiverId: number }) => {
        const room = [socket.data.userId!, receiverId].sort().join(":");
        socket.to(room).emit("typing", { userId: socket.data.userId });
      });

      socket.on("stopTyping", ({ receiverId }: { receiverId: number }) => {
        const room = [socket.data.userId!, receiverId].sort().join(":");
        socket.to(room).emit("stopTyping", { userId: socket.data.userId });
      });

      socket.on("disconnect", async () => {
        try {
          await userRepo.update(
            { id: socket.data.userId! },
            { is_online: false }
          );

          io.emit("userStatus", {
            userId: socket.data.userId,
            isOnline: false,
          });
        } catch (error) {
          console.error(
            `Error on disconnect for user ${socket.data.userId}:`,
            error
          );
        }
      });
    } catch (error) {
      console.error("Error in socket connection:", error);
      socket.disconnect();
    }
  });

  console.log("Socket.io initialization completed");
};
