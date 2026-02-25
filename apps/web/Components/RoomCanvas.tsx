import React, { useEffect} from 'react'
import useSocket from '../Hooks/useSocket'
import Canvas from './Canvas'
import axios from 'axios'
import { BACKEND_URL } from '../app/config'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/UserSlice'

const RoomCanvas = ({ roomId,jwtToken }: { roomId: number,jwtToken:string }) => {

  const dispatch=useDispatch()
  
  const {socket}=useSocket(jwtToken)
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
