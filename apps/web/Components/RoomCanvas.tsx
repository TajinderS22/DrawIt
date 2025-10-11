import React, { useEffect, useState} from 'react'
import useSocket from '../Hooks/useSocket'
import Canvas from './Canvas'
import jwt from 'jsonwebtoken'
import {JWT_USER_PASSWORD} from "@repo/backend-common"
import axios from 'axios'
import { BACKEND_URL } from '../app/config'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/UserSlice'

const RoomCanvas = ({ roomId,jwtToken }: { roomId: number,jwtToken:string }) => {

  const dispatch=useDispatch()
  
  const {socket}=useSocket(jwtToken)
  const [userId,setUserId]=useState<null|number>(null)
  const checkUser=async()=>{
    const decoded= await axios.post(BACKEND_URL+"/user/verify",{
      data:{
        jwt:jwtToken
      }
    })
    dispatch(setUser(decoded.data.user))
  }

  useEffect(()=>{
    checkUser()
  },[])


 

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
