import { useEffect, useState } from "react"
import { WEBSOCKET_URL } from "../app/config";

const useSocket=(token:string|null)=>{

    const [socket,setSocket]=useState<WebSocket>();
    useEffect(()=>{
        console.log(token)
        const url=WEBSOCKET_URL+`?token=${token}`
        console.log(url)
        const ws=new WebSocket(url);
        ws.onopen=()=>{
            
            setSocket(ws);
        }
    },[])

    return {
        socket
    }

}

export default useSocket