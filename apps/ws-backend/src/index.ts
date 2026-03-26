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

const pendingShapeUpdates: Map<number, string> = new Map();

setInterval(async () => {
  if (pendingShapeUpdates.size === 0) return;

  const updates = Array.from(pendingShapeUpdates.entries());
  pendingShapeUpdates.clear();

  try {
    await db.$transaction(
      updates.map(([id, message]) =>
        db.chat.update({ where: { id }, data: { message } })
      )
    );
  } catch (err) {
    console.error("Batch shape update failed:", err);
  }
}, 2000);

interface PendingNewShape {
  message: string;
  roomId: number;
  userId: string;
  shape: any;
  senderWs: WebSocket;
}

const pendingNewShapes: PendingNewShape[] = [];

setInterval(async () => {
  if (pendingNewShapes.length === 0) return;

  const batch = pendingNewShapes.splice(0, pendingNewShapes.length);

  try {
    const results = await db.$transaction(
      batch.map((item) =>
        db.chat.create({
          data: {
            message: item.message,
            roomId: item.roomId,
            userId: item.userId,
          },
        })
      )
    );

    results.forEach((created, idx) => {
      const item = batch[idx]!;
      users.forEach((u) => {
        if (u.rooms.includes(String(item.roomId))) {
          u.ws.send(
            JSON.stringify({
              type: "shape_saved",
              chatId: created.id,
              shape: item.shape,
              roomId: item.roomId,
              userId: item.userId,
            })
          );
        }
      });
    });
  } catch (err) {
    console.error("Batch new shape creation failed:", err);
  }
}, 2000);

const pendingShapeDeletions = new Set<number>();

setInterval(async () => {
  if (pendingShapeDeletions.size === 0) return;

  const deletions = Array.from(pendingShapeDeletions);
  pendingShapeDeletions.clear();

  try {
    await db.chat.deleteMany({
      where: {
        id: { in: deletions },
      },
    });
  } catch (err) {
    console.error("Batch shape deletion failed:", err);
  }
}, 2000);

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
          const data = JSON.parse(parsedData.message);

          // Broadcast deletion immediately to other users in the room
          users.forEach((u) => {
            if (u.rooms.includes(roomId) && u.ws !== ws) {
              u.ws.send(
                JSON.stringify({
                  type: "chat_delete_shape_success",
                  roomId,
                  userId,
                  shape: data.data,
                }),
              );
            }
          });

          const shapeIdToDelete = data?.data?.id;

          if (shapeIdToDelete) {
             pendingShapeDeletions.add(shapeIdToDelete);
          } else if (data?.data?.shape?.clientId) {
             const pendingIdx = pendingNewShapes.findIndex(p => p.shape.clientId === data.data.shape.clientId);
             if (pendingIdx !== -1) {
                pendingNewShapes.splice(pendingIdx, 1);
             }
          } else if (data?.data?.shape) {
             const pendingIdx = pendingNewShapes.findIndex(p => JSON.stringify(p.shape) === JSON.stringify(data.data.shape));
             if (pendingIdx !== -1) {
                pendingNewShapes.splice(pendingIdx, 1);
             } else {
                (async () => {
                   try {
                     const chats = await db.chat.findMany({ where: { roomId } });
                     for (const c of chats) {
                         try {
                             const parsed = JSON.parse(c.message);
                             if (parsed?.shape && JSON.stringify(parsed.shape) === JSON.stringify(data.data.shape)) {
                                 pendingShapeDeletions.add(c.id);
                                 break;
                             }
                         } catch (err) {}
                     }
                   } catch (err) {
                     console.error("Background delete lookup failed:", err);
                   }
                })();
             }
          }
        }

        if (parsedData.type == "shape_move") {
          const roomId = parsedData.roomId;
          const userId = user.userId;

          users.forEach((u) => {
            if (u.rooms.includes(roomId) && u.ws !== ws) {
              u.ws.send(
                JSON.stringify({
                  type: "shape_move",
                  shapeId: parsedData.shapeId,
                  shape: parsedData.shape,
                  roomId,
                  userId,
                }),
              );
            }
          });
        }

        if (parsedData.type == "cursor_move") {
          const roomId = parsedData.roomId;
          const userId = user.userId;

          users.forEach((u) => {
            if (u.rooms.includes(roomId) && u.ws !== ws) {
              u.ws.send(
                JSON.stringify({
                  type: "cursor_move",
                  x: parsedData.x,
                  y: parsedData.y,
                  name: parsedData.name,
                  roomId,
                  userId,
                }),
              );
            }
          });
        }

        if (parsedData.type == "shape_move_end") {
          const roomId = parsedData.roomId;
          const userId = user.userId;
          const shapeId = parsedData.shapeId;
          const shape = parsedData.shape;

          if (shapeId) {
            const newMessage = JSON.stringify({ shape });
            pendingShapeUpdates.set(shapeId, newMessage);
          } else if (shape?.clientId) {
            const pendingIdx = pendingNewShapes.findIndex(p => p.shape.clientId === shape.clientId);
            if (pendingIdx !== -1) {
               const pendingItem = pendingNewShapes[pendingIdx];
               if (pendingItem) {
                 pendingItem.shape = shape;
                 pendingItem.message = JSON.stringify({ shape });
               }
            }
          }

          users.forEach((u) => {
            if (u.rooms.includes(roomId)) {
              u.ws.send(
                JSON.stringify({
                  type: "shape_move_end",
                  shapeId,
                  shape,
                  roomId,
                  userId,
                }),
              );
            }
          });
        }

        if (parsedData.type === "shape_drawing") {
          const roomId = parsedData.roomId;
          const userId = user.userId;

          users.forEach((u) => {
            if (u.rooms.includes(roomId) && u.ws !== ws) {
              u.ws.send(
                JSON.stringify({
                  type: "shape_drawing",
                  shape: parsedData.shape,
                  roomId,
                  userId,
                }),
              );
            }
          });
        }

        if (parsedData.type === "shape_draw_end") {
          const roomId = parsedData.roomId;
          const message = parsedData.message;
          const userId = user.userId;
          const parsedMessage = JSON.parse(message);
          const shape = parsedMessage.shape;

          users.forEach((u) => {
            if (u.rooms.includes(roomId) && u.ws !== ws) {
              u.ws.send(
                JSON.stringify({
                  type: "shape_draw_end",
                  shape,
                  roomId,
                  userId,
                }),
              );
            }
          });

          pendingNewShapes.push({
            message,
            roomId: Number(roomId),
            userId,
            shape,
            senderWs: ws,
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
