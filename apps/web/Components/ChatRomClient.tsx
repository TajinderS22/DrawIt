"use client";

import { useEffect, useState } from "react";
import useSocket from "../Hooks/useSocket";
import { parse } from "path";

const ChatRoomClient = ({
  messages,
  roomId,
}: {
  messages: { message: string }[];
  roomId: number;
}) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("jwt"));
  }, []);

  const { socket, loading } = useSocket(token);
  const [chats, setChats] = useState(messages);
  const [roomConnected, setRoomConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>("");

  useEffect(() => {
    if (socket) {
      socket.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
      setRoomConnected(true);
    }
  }, [socket]);

  useEffect(() => {
    if (socket && !loading) {
      socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type == "chat") {
          setChats((c) => [...c, { message: parsedData.message }]);
        }
      };
    }

    return () => {
      socket?.close();
    };
  }, [socket, loading]);

  return (
    <div className="p-1">
      <div className="max-h-[90svh] overflow-scroll">
        {chats.map((m, index) => (
          <div
            key={index}
            className="bg-amber-200 p-1 m-1 w-4/12 overflow-x-scroll rounded-xl"
          >
            {m.message}
          </div>
        ))}
      </div>

      <div className="flex ">
        <input
          type="text"
          value={currentMessage}
          className="bg-gray-300/30 rounded-md"
          onChange={(e) => {
            setCurrentMessage(e.target.value);
          }}
        />

        <button
          className="bg-green-300 p-2 mx-2 rounded-md"
          onClick={() => {
            socket?.send(
              JSON.stringify({
                type: "chat",
                roomId,
                message: currentMessage,
              })
            );

            setCurrentMessage("");
          }}
        >
          send
        </button>
      </div>
    </div>
  );
};

export default ChatRoomClient;
