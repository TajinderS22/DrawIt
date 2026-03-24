import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_USER_PASSWORD } from "@repo/backend-common";
import { getPrisma } from "@repo/db";

import dotenv from "dotenv"

dotenv.config()



const wss = new WebSocketServer({
  port: 8090
});

const db = getPrisma();

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

const checkUser = (token: string) => {
  if (!token) {
    return null;
  }
  if (!JWT_USER_PASSWORD) {
    return null;
  }
  const decoded = jwt.verify(token, JWT_USER_PASSWORD);
  if (!decoded || !(decoded as JwtPayload).id) {
    return null;
  }

  if (!decoded) {
    return null;
  }
  return (decoded as JwtPayload).id;
};

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token: any = queryParams.get("token");
  try {
    const userId = checkUser(token);
    if (!userId) {
      ws.send(
        JSON.stringify({
          message: "Invalid Token",
        }),
      );
      ws.close();
    }

    users.push({
      userId: userId,
      rooms: [],
      ws,
    });

    ws.on("message", async (data) => {
      const parsedData = JSON.parse(data as unknown as string);

      const user = users.find((x) => x.ws === ws);
      if (!user) {
        ws.send(JSON.stringify({ message: "User not authenticated" }));
        return;
      }

      try {
        if (parsedData.type == "join_room") {
          const user = users.find((x) => x.ws == ws);
          const checkRoomId = await db.room.findFirst({
            where: {
              id: parsedData.roomId,
            },
          });
          if (!checkRoomId) {
            ws.send(
              JSON.stringify({
                message: "roomId is invalid",
              }),
            );
          } else {
            user?.rooms.push(parsedData.roomId);
          }
        }

        if (parsedData.type == "leave_room") {
          user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
        }

        if (parsedData.type == "chat_delete_shape") {
          const roomId = parsedData.roomId;
          const userId = user.userId;

          const deletIds: number[] = [];

          const data = JSON.parse(parsedData.message);

    
          let MessageToBeDeletedId: number | null = null;
          if (data && data.data && data.data.id) {
            MessageToBeDeletedId = data.data.id;
          } else if (data && data.data && data.data.shape) {
            // Find the chat record in the DB that matches the shape payload
            const chats = await db.chat.findMany({ where: { roomId } });
            for (const c of chats) {
              try {
                const parsed = JSON.parse(c.message);
                if (
                  parsed &&
                  parsed.shape &&
                  JSON.stringify(parsed.shape) ===
                    JSON.stringify(data.data.shape)
                ) {
                  MessageToBeDeletedId = c.id;
                  break;
                }
              } catch (err) {
              }
            }
          }

          if (MessageToBeDeletedId != null) {
            await db.chat.delete({ where: { id: MessageToBeDeletedId } });
          } else {
            console.warn(
              "chat_delete_shape: no matching chat found for delete request",
              data,
            );
          }

          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "chat_delete_shape_success",
                  message: "Shape Deleted",
                  roomId,
                  userId,
                  shape: data.data,
                }),
              );
            }
          });
        }

        if (parsedData.type == "chat") {
          const roomId = parsedData.roomId;
          const message = parsedData.message;
          const userId = user.userId;

          const messageData = {
            message: message,
            roomId,
            userId,
          };
        
          const created = await db.chat.create({
            data: messageData,
          });
          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  type: "chat",
                  message: message,
                  roomId,
                  userId,
                  chat: created,
                }),
              );
            }
          });
        }
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error);
  }
});
