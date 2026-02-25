import { Request, Response, Router } from "express";
import { prisma } from "@repo/db/dist/index.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {
  CreateRoomSchema,
  JWT_USER_PASSWORD,
  UserSchemaZod,
} from "@repo/backend-common";
import { userMiddleware, AuthedRequest } from "../middleware/user";

dotenv.config();

export const userRouter: Router = Router();

const saltRounds = 12;

type UserType = {
  id?: number;
  email: string;
  password: string;
  firstname: string;
  lastname?: string;
  username?: string;
};

userRouter.post("/signup", async (req, res) => {
  const data = req.body;
  const existingUser = await prisma.users.findFirst({
    where: {
      email: data.email,
      username: data.username,
    },
  });
  try {
    if (existingUser) {
      res.status(301).json({
        message: "User Already registered",
      });
      return;
    }
    const plainPassword = data.password;

    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    data.password = hashedPassword;
    const parsed = UserSchemaZod.safeParse(data);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Invalid inputs", errors: parsed.error });
    }
    const createUser = await prisma.users.create({
      data,
    });
    if (createUser) {
      res.status(200).json({
        message: "User Successfully Registered.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error.  Please Try later......",
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  const data = req.body;
  try {
    const user = await prisma.users.findFirst({
      where: {
        email: data.email,
      },
    });
    if (!user) {
      res.status(404).json({
        message: "User not registered Please Signup",
      });
      return;
    }
    const passwordCheck: Boolean = await bcrypt.compare(
      data.password,
      user.password
    );
    if (!passwordCheck) {
      res.status(401).json({
        message: "Password is invalid",
      });
      return;
    }
    if (!process.env.JWT_USER_PASSWORD) {
      res.status(500).json({
        message: "Internal server Error Junior Dev briked your app",
      });
      return;
    }
    const token = jwt.sign({ id: user.id }, JWT_USER_PASSWORD);
    res.status(200).json({
      message: "User Logged in succussfully.",
      jwt: token,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Internal Server Error (ISE)",
    });
  }
});

userRouter.get("/rooms", userMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId;
  try {
    const rooms = await prisma.users.findFirst({
      where: {
        id: userId,
      },
      select: {
        rooms: true,
      },
    });
    res.status(200).json({
      rooms: rooms,
    });
  } catch (err) {
    console.error(err);
  }
});

userRouter.post(
  "/room/join",
  userMiddleware,
  async (req: AuthedRequest, res) => {
    const userId = req.userId;
    const roomId = req.body.roomId;
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
      },
    });
    if (!room) {
      res.status(404).json({
        message: "room not found",
      });
      return;
    }

    const result = await prisma.room.update({
      where: { id: roomId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
    });
    res.status(200).json({
      message: result,
    });
  }
);

userRouter.post(
  "/room/create",
  userMiddleware,
  async (req: AuthedRequest, res) => {
    const userId = req.userId;
    const data = CreateRoomSchema.safeParse(req.body);
    if (!data.success || !userId) {
      res.json({
        message: "Incorrect inputs",
      });
      return;
    }
    try {
      const room = await prisma.room.create({
        data: {
          slug: data.data.slug,
          adminId: userId,
        },
      });
      res.status(200).json({
        roomId: room?.id,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({
        message: "Name already exist please choose some other name.",
      });
    }
  }
);

userRouter.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  try {
    const messages = await prisma.chat.findMany({
      where: {
        roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 500,
    });

    res.status(200).json({
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

const checkUser = async (token: any) => {
  const decoded = jwt.verify(token, JWT_USER_PASSWORD);

  if (decoded) {
    return decoded;
  } else {
    return null;
  }
};

userRouter.post("/verify", async (req, res) => {
  const token = req.body.data.jwt;
  try {
    const user = await checkUser(token);
    res.status(200).json({
      user: user,
    });
  } catch (err) {
    console.error(err);
  }
});

userRouter.get("/canvas/:slug", async (req, res) => {
  const slug = req.params.slug;
  const roomId = await prisma.room.findFirst({
    where: {
      slug: slug,
    },
  });
  if (!roomId) {
    res.status(404).json({
      message: "Room not found",
    });
    return;
  }
  res.status(200).json({
    roomId: roomId?.id,
  });
});
