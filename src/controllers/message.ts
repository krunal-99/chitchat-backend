import { Request, Response } from "express";
import { messageRepo } from "../utils/constants";

export const getMessagesBetweenUsers = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  try {
    const { selectedUserId } = req.query;
    if (!selectedUserId) {
      res.status(400).json({
        status: "failed",
        message: "selectedUserId is required",
      });
      return;
    }
    const messages = await messageRepo.find({
      where: [
        { sender: { id: userId }, receiver: { id: +selectedUserId } },
        { sender: { id: +selectedUserId }, receiver: { id: userId } },
      ],
      order: {
        timestamp: "ASC",
      },
      relations: ["sender"],
    });

    res.status(200).json({
      status: "success",
      data: messages.map((msg) => ({
        id: msg.id,
        senderId: msg.sender.id,
        text: msg.text,
        timestamp: msg.timestamp,
      })),
    });
    return;
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
    return;
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      res.status(400).json({
        status: "failed",
        message: "receiverId and text are required",
      });
      return;
    }
    const senderId = req.user?.id;
    const message = messageRepo.create({
      sender: { id: senderId },
      receiver: { id: receiverId },
      text,
      timestamp: new Date(),
    });
    await messageRepo.save(message);
    res.status(201).json({
      status: "success",
      message: "Message sent successfully",
      data: {
        id: message.id,
        senderId: message.sender.id,
        receiverId: message.receiver.id,
        text: message.text,
        timestamp: message.timestamp,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
    return;
  }
};
