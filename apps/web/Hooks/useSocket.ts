import { useEffect, useState } from "react"
import { WEBSOCKET_URL } from "../app/config";

const useSocket=()=>{
    const [loading,setLoading]=useState(true);
    const [socket,setSocket]=useState<WebSocket>();
    useEffect(()=>{
        const ws=new WebSocket(WEBSOCKET_URL+"?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ2YWZkOGM5LTQ1ZjYtNDUwYS1hMjk5LTFlZWNmMGU3YzgzYiIsImlhdCI6MTc1NzY5MTgzOX0.wVJfc4Wg0fklRff9162Ru3fh9yJaJWjrGmOCt6Jsb0o");
        ws.onopen=()=>{
            setLoading(false);
            setSocket(ws);
        }
    },[])

    return {
        socket,
        loading
    }

}

export default useSocket