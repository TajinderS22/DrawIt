import { useEffect, useState } from "react";
import { WEBSOCKET_URL } from "../app/config";

const useSocket = (token: string | null) => {
  const [socket, setSocket] = useState<WebSocket>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const url = WEBSOCKET_URL + `?token=${token}`;
    const ws = new WebSocket(url);
    ws.onopen = () => {
      setSocket(ws);
      setLoading(false);
    };

    return () => {
      ws.close();
      setLoading(false);
      setSocket(undefined);
    };
  }, [token]);

  return {
    socket,
    loading,
  };
};

export default useSocket;
