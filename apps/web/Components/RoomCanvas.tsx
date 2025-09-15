"use client"
import React, { useEffect} from 'react'
import useSocket from '../Hooks/useSocket'
import Canvas from './Canvas'

const RoomCanvas = ({ roomId,jwt }: { roomId: number,jwt:string }) => {
  
  const {socket}=useSocket(jwt)
  

 

  useEffect(() => {
    
    if (socket) {
      socket.send(JSON.stringify({
        type: "join_room",
        roomId
      }))
    }
  }, [socket])

  

  if (!socket) {
    return <div>......loading websocket</div>
  }

  return (
    <Canvas roomId={roomId} Socket={socket}></Canvas>
  )
}

export default RoomCanvas
