import { Request, Response } from "express";
import { conversationRepo, messageRepo } from "../utils/constants";

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
    const savedMessage = await messageRepo.save(message);

    let conversation = await conversationRepo.findOne({
      where: [
        { user1: { id: senderId }, user2: { id: receiverId } },
        { user1: { id: receiverId }, user2: { id: senderId } },
      ],
    });

    if (!conversation) {
      conversation = conversationRepo.create({
        user1: { id: senderId },
        user2: { id: receiverId },
        last_message: text,
        last_message_time: new Date(),
      });
    } else {
      conversation.last_message = text;
      conversation.last_message_time = new Date();
    }

    await conversationRepo.save(conversation);

    res.status(201).json({
      status: "success",
      message: "Message sent successfully",
      data: {
        id: savedMessage.id,
        senderId: savedMessage.sender.id,
        receiverId: savedMessage.receiver.id,
        text: savedMessage.text,
        timestamp: savedMessage.timestamp,
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
