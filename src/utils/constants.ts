import { User } from "../entities/User";
import { AppDataSource } from "./db";

export const userRepo = AppDataSource.getRepository(User);
