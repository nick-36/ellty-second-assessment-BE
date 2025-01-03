import { Request, Response, NextFunction, RequestHandler } from "express";
import { Role, User } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import prisma from "./lib/prisma";

interface JWTPayload {
  id: number;
  iat: number;
}

export interface AuthRequest extends Request {
  user?: User;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authorization = req.headers.authorization;
    let token: string | undefined;

    if (authorization?.startsWith("Bearer")) {
      token = authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in. Please login to get access.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "User belonging to this token no longer exists.",
      });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "fail",
      message: "Invalid token or authorization failed",
    });
  }
};

export const restrictTo = (...roles: Role[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.role || !roles.includes(req.user.role as Role)) {
        res.status(403).json({
          status: "fail",
          message: "You do not have permission to perform this action",
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
