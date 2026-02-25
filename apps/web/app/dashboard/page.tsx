"use client"

// import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios";
import { BACKEND_URL } from "../config";
import CanvasDisplayCard from "../../Components/CanvasDisplayCard";




const Page = () => {

  const router=useRouter();

  const joinRoomRef = useRef<HTMLInputElement>(null)
  const createRoomRef=useRef<HTMLInputElement>(null)

  const [createRoom,setCreateRoom]=useState<boolean>(false)
  const [joinRoom,setJoinRoom]=useState<boolean>(false)
  const [loading,setLoading]=useState<boolean>(false)
  const [allRooms,setAllRooms]=useState<any[]>([])



  const getUserRooms=async()=>{

    const rooms= await axios.get(BACKEND_URL+"/user/rooms",{
      headers:{
        Authorization:localStorage.getItem('jwt')
      }
    })
    setAllRooms(rooms.data.rooms.rooms)
  }

  useEffect(()=>{
    getUserRooms()
  },[])

  
  const handleCreateRoom=async()=>{
    const response=await axios.post(BACKEND_URL+"/user/room/create",{
      slug:createRoomRef?.current?.value
    },{
      headers:{
        authorization:localStorage.getItem('jwt')
      }
    }) 
    const result= await axios.post(BACKEND_URL+"/user/room/join",{
      roomId:response.data.roomId
    },{
      headers:{
        authorization:localStorage.getItem('jwt')
      }
    })
    router.push(BACKEND_URL+'/canvas/'+result.data.message.id)


  }

  const handleJoinRoomClick=async ()=>{
    const roomid= await axios.get(BACKEND_URL+"/user/canvas/"+joinRoomRef?.current?.value)
    const response= await axios.post(BACKEND_URL+"/user/room/join",{
      roomId:roomid.data.roomId
    },{
      headers:{
        authorization:localStorage.getItem('jwt')
      }
    })
    setJoinRoom(false)
  }
  if(!allRooms) return (<div className="text-7xl text-red bg-red-200">
    Loading
  </div>)
  
  return (
    <div>

      {
        joinRoom &&
        <div className="w-full absolute">
          <div className="flex items-center bg-amber-100/10 w-full backdrop-blur-2xl flex-col mx-auto min-h-[98svh] pt-88 "> 
            <button className="bg-red-200 p-2 rounded-md absolute -translate-y-80" onClick={()=>{
              setJoinRoom(false)
            }}>
              close
            </button>
            <input ref={joinRoomRef} type="text" className="bg-gray-800 p-2 rounded-md shadow-md shadow-amber-50/30 border-amber-50/30 border " /> 
            <button className="bg-slate-400 w-4/12 mx-auto my-2 rounded-md  " 
             onClick={() =>{handleJoinRoomClick()}}
             >
              Join room
              </button>
          </div> 

        </div>
      }

      {createRoom &&  <div className="fixed w-full">

          <div className="flex items-center bg-amber-100/10 w-full backdrop-blur-2xl flex-col mx-auto min-h-[98svh] pt-88 "> 
            <button className="bg-red-200 p-2 rounded-md absolute -translate-y-80" onClick={()=>{
              setCreateRoom(false)
            }}>
              close
            </button>
            <input ref={createRoomRef} type="text" className="bg-gray-800 w-[400px] p-2 rounded-md shadow-md shadow-amber-50/30 border-amber-50/30 border " />
            <button className="bg-slate-400 w-4/12 mx-auto my-2 rounded-md  "
             onClick={() =>{handleCreateRoom()}}
            >Create Room</button>
          </div>
          
        </div>}
      <div>

        <button  onClick={()=>{
          setCreateRoom(!createRoom)
        }} 
        className="bg-purple-300 m-2 rounded-md z-10 p-2 border boerder-purple-300">
          Create room 
      </button>

      <button  onClick={()=>{
          setJoinRoom(!joinRoom)
        }} 
        className="bg-purple-300 m-2 rounded-md z-10 p-2 border boerder-purple-300">
          Join Room 
      </button>

      </div>


        {/* Actual data */}

        <div>
          {allRooms.map((x)=>(
            // eslint-disable-next-line react/jsx-key
            <div key={x.id}>
              <CanvasDisplayCard data={x} />
            </div>
          ))}
        </div>
      


      
    </div>
  )
}



 



export default Page