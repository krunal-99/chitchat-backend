import { Request, Response } from "express";
import { messageRepo } from "../utils/constants";

export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageRepo.find({
      relations: ["sender", "receiver"],
    });
    if (messages) {
      res.status(200).json({
        status: "success",
        message: "Messages fetched successfully",
        data: messages,
      });
    } else {
      res.status(404).json({
        status: "failed",
        message: "No messages found",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
};
