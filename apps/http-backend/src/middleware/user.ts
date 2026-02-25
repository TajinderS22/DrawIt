import jwt from "jsonwebtoken";
import { prisma } from "@repo/db/dist/index.js";
import { NextFunction, Request, Response } from "express";
import { JWT_USER_PASSWORD } from "@repo/backend-common";

export interface AuthedRequest extends Request {
  userId?: string;
}

export const userMiddleware = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const id = req?.headers?.authorization;
  if (!id) {
    res.status(401).json({
      message: "Invalid session",
    });
    return;
  }
  if (!process.env.JWT_USER_PASSWORD) {
    res.status(500).json({
      message: "Internal server Error dev bricked the app",
    });
    return;
  }
  try {
    const decoded: any = jwt.verify(id, JWT_USER_PASSWORD);
    if (decoded) {
      req.userId = decoded.id;
      next();
    } else {
      res.status(403).json({
        message: "inavalid Jwt Token given",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server Error",
    });
  }
};
