import { Request, RequestHandler, Response } from "express";
import prisma from "../lib/prisma";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";

interface JWTPayload {
  id: number;
  username: string;
  role: Role;
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

const signToken = (id: number, username: string, role: Role): string => {
  return jwt.sign(
    { id, username, role } as JWTPayload,
    process.env.JWT_SECRET!,
    {
      expiresIn: "10d",
    }
  );
};

const createAndSendToken = (
  user: User,
  statusCode: number,
  res: Response
): void => {
  const token = signToken(user.id, user.username, user?.role);

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

export const signUp = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: Role.UNREGISTERED,
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

export const login = async (req: Request, res: Response) => {
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

export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Unauthorized",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: "REGISTERED" },
    });

    createAndSendToken(updatedUser, 200, res);
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "fail",
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
