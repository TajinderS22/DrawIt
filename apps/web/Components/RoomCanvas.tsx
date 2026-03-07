import React, { useEffect, useState} from 'react'
import useSocket from '../Hooks/useSocket'
import Canvas from './Canvas'
import axios from 'axios'
import { BACKEND_URL } from '../app/config'

import useJwt from '../Hooks/useJwt'
import useActiveSession from '../Hooks/useActiveSession'
import { useRouter } from 'next/navigation'
import { Loader2, LoaderCircleIcon } from 'lucide-react'

const RoomCanvas = ({ roomId,jwtToken }: { roomId: number,jwtToken:string }) => {

  // const dispatch=useDispatch()

  const jwt=useJwt()
  const router=useRouter()

  const [loading,setLoading]=useState(true)
  
  const {socket}=useSocket(jwtToken)
  const checkUser=async()=>{
    const isUserAllowd= await axios.post(BACKEND_URL+"/user/verify/canvas",{
      data:{
        roomId:roomId
      }
    },{
      headers:{
        authorization:jwt
      }
    })
    if (!isUserAllowd.data.authorised) {
      router.push("/dashboard");
      setLoading(false);
    }else{
      setLoading(false);
    }

    

   }


  

 

  useEffect(() => {

    if(jwt){

      checkUser();

    }


    if (socket) {
      socket.send(JSON.stringify({
        type: "join_room",
        roomId
      }))
    }
  }, [socket,jwt])

  



  if(loading || !socket){
    return (
      <div className='w-screen h-screen bg-stone-950 flex items-center justify-center '>
        <div>
          <LoaderCircleIcon className='h-40 w-40 text-white animate-spin'/>
        </div>
      </div>
    )
  }

  return (
    <Canvas roomId={roomId} Socket={socket}></Canvas>
  )
}

export default RoomCanvas
