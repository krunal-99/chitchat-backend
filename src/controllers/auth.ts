import { Request, Response } from "express";
import { userRepo } from "../utils/constants";
import argon2 from "argon2";
import { User } from "../entities/User";
import jwt from "jsonwebtoken";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userRepo.find({
      order: { id: "ASC" },
      select: ["id", "user_name", "email", "image_url", "is_online"],
    });
    if (users) {
      res.status(200).json({
        status: "success",
        message: "Users fetched successfully",
        users,
      });
    } else {
      res.status(404).json({
        status: "failed",
        message: "No users found",
      });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      status: "failed",
      message: "Internal server error",
    });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const {
      username: user_name,
      email,
      password,
      profilePicture: image_url,
    } = req.body;
    if (!user_name || !email || !password) {
      res.status(400).json({
        status: "failed",
        message: "Username, email, and password are required",
      });
      return;
    }
    const existingUser = await userRepo.findOne({
      where: [{ email }],
    });
    if (existingUser) {
      res
        .status(400)
        .json({ status: "failed", message: "Email already exists" });
      return;
    }
    const hashedPassword = await argon2.hash(password);
    const user = new User();
    user.user_name = user_name;
    user.email = email;
    user.password = hashedPassword;
    user.image_url = image_url;
    await userRepo.save(user);
    res.status(201).json({
      status: "success",
      message: "User created successfully",
      user: {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
      },
    });
    return;
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ status: "failed", message: "Internal server error" });
    return;
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ status: "failed", message: "Email and password are required" });
      return;
    }
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
      res
        .status(401)
        .json({ status: "failed", message: "Invalid email or password" });
      return;
    }
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      res
        .status(401)
        .json({ status: "failed", message: "Invalid email or password" });
      return;
    }
    const token = jwt.sign(
      {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );
    res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
      },
    });
    return;
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ status: "failed", message: "Internal server error" });
    return;
  }
};
