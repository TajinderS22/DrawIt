"use client"

// import { useRouter } from "next/router"
import { useRef } from "react"
import { useRouter } from "next/navigation"




const Page = () => {

  const router=useRouter();

  const joinRoomRef = useRef<HTMLInputElement>(null)

  const handleJoinRoomClick=async ()=>{
    router.push(`/chat/room/${joinRoomRef.current?.value}`)
  }
  return (
    <div className="flex flex-col w-[400px] mx-auto min-h-[98svh] pt-88 ">
        <input ref={joinRoomRef} type="text" className="bg-gray-800 p-2 rounded-md shadow-md shadow-amber-50/30 border-amber-50/30 border " />
        <button className="bg-slate-400 w-4/12 mx-auto my-2 rounded-md  "
        onClick={() =>{handleJoinRoomClick()}}
        >Join</button>
    </div>
  )
}

export default Page