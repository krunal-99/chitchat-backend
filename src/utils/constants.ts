import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { User } from "../entities/User";
import { AppDataSource } from "./db";

export const userRepo = AppDataSource.getRepository(User);
export const messageRepo = AppDataSource.getRepository(Message);
export const conversationRepo = AppDataSource.getRepository(Conversation);
