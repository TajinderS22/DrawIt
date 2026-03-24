import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import {
  CreateRoomSchema,
  JWT_USER_PASSWORD,
  UserSchemaZod,
} from "@repo/backend-common";
import { userMiddleware, AuthedRequest } from "../middleware/user";
import { getPrisma } from "@repo/db";

dotenv.config();

const db = getPrisma();

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
  const existingUser = await db.users.findFirst({
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
    const createUser = await db.users.create({
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
    const user = await db.users.findFirst({
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
      user.password,
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
      user:{
        id:user.id,
        username:user.username,
        firstname:user.firstname,
        lastname: user.lastname,
        email: user.email,
        createdAt:user.createdAt,
      },
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
    const userWithRooms = await db.users.findFirst({
      where: {
        id: userId,
      },
      select: {
        Room_UserRooms: true,
      },
    });
    res.status(200).json({
      rooms: userWithRooms?.Room_UserRooms ?? [],
    });
  } catch (err) {
    console.error(err);
  }
});

userRouter.post(
  "/canvas/delete",
  userMiddleware,
  async (req: AuthedRequest, res) => {
    const userId = req.userId;
    const id = req.body.id;

    try {
      const room = await db.room.findFirst({
        where: {
          id: id,
        },
      });

      if(room?.adminId!=userId){
        return res.status(200).json({
          authorized:false,
          message:"You are not the admin of this room "
        })
      }

      const deleted=await db.room.delete({
        where:{
          id:id,
          adminId:userId
        }
      })
      
      
      res.status(200).json({
        authorized:true,
        deleted,
      });
    } catch (error) {
      console.error(error);
    }
  },
);

userRouter.post(
  "/room/join",
  userMiddleware,
  async (req: AuthedRequest, res) => {
    const userId = req.userId;
    const roomId = req.body.roomId;
    const room = await db.room.findFirst({
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

    const result = await db.room.update({
      where: { id: roomId },
      data: {
        Users_UserRooms: {
          connect: { id: userId },
        },
      },
    });
    res.status(200).json({
      message: result,
    });
  },
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
      const room = await db.room.create({
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
  },
);

userRouter.get("/chats/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  try {
    const messages = await db.chat.findMany({
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

const checkUser = async (userId: any, roomId: any) => {
  const userInRoom = await db.users.findFirst({
    where: {
      id: userId,
    },
    select: {
      Room_UserRooms: {
        where: {
          id: roomId,
        },
      },
    },
  });
  if (userInRoom?.Room_UserRooms.length! <= 0) {
    return false;
  }
  return true;
};

userRouter.post("/verify", userMiddleware, async (req: AuthedRequest, res) => {
  const userId = req.userId;
  const user = await db.users.findFirst({
    where: {
      id: userId,
    },
  });

  if (user) {
    res.status(200).json({
      user: user,
    });
  }
});

userRouter.post(
  "/verify/canvas",
  userMiddleware,
  async (req: AuthedRequest, res) => {
    const userId = req.userId;
    const roomId = req.body.data.roomId;
    try {
      const user = await checkUser(userId, roomId);
      if (user) {
        res.status(200).json({
          authorised: true,
          message: "You are authorized to use this canvas",
        });
      } else {
        res.status(200).json({
          authorised: false,
          message: "User don't belong to this canvas",
        });
      }
    } catch (err) {
      console.error(err);
    }
  },
);

userRouter.get("/canvas/:slug", async (req, res) => {
  const slug = req.params.slug;
  const roomId = await db.room.findFirst({
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
