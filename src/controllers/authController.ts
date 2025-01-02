import { Request, Response } from "express";
import prisma from "../lib/prisma";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { User } from "@prisma/client";

interface JWTPayload {
  id: number;
  username: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

interface CookieOptions {
  maxAge?: number;
  httpOnly: boolean;
  origin: string;
  secure?: boolean;
}

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

const signToken = (id: number, username: string): string => {
  return jwt.sign({ id, username } as JWTPayload, process.env.JWT_SECRET!, {
    expiresIn: "10d",
  });
};

const createAndSendToken = (
  user: User,
  statusCode: number,
  res: Response
): void => {
  const token = signToken(user.id, user.username);

  const cookieOptions: CookieOptions = {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  const { password, ...userWithoutPassword } = user;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: userWithoutPassword,
    },
  });
};

export const signUp = async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isRegistered: true,
      },
    });

    createAndSendToken(newUser, 201, res);
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    createAndSendToken(user, 201, res);
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
