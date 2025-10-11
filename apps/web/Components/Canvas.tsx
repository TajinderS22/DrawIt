'use client';

import React, { useEffect, useRef, useState } from 'react'
import InitDraw from '../app/draw'
import IconButton from './IconButton'
import { Circle, CrosshairIcon, Eraser, Pencil, RectangleHorizontalIcon } from 'lucide-react'
import { Game } from '../app/draw/Game'
import { useSelector } from 'react-redux'
import { RootState } from '../redux/store'
import { DateTime } from 'next-auth/providers/kakao';


type Shape="circle"|"rectangle"|"pencil"|"eraser"|"select"
type UserType={
        id:string,
        iat:DateTime
    }

const Canvas = ({roomId,Socket}:{roomId:number,Socket:WebSocket}) => {

    const canvasRef=useRef<HTMLCanvasElement>(null)
    const [game,setGame]=useState<Game>();

    const user = useSelector<RootState, any>((state) => state.user)

    const userId=user?.id
    const [selectedTool,setSlectedTool]=useState<"circle"|"rectangle"|"pencil"|'eraser'|'select'>("circle")

    useEffect(()=>{
        game?.setTool(selectedTool)
        
    },[selectedTool,game])



    useEffect(()=>{
    if(canvasRef.current){

        const g=new Game(canvasRef.current,roomId,Socket,userId)
        setGame(g);

        return ()=>{
            g.destroy()
        }
    }    
    },[canvasRef,user])

  return (
        <div className="min-w-screen bg-white overflow-hidden min-h-screen">
            <canvas ref={canvasRef} height={window.innerHeight} width={window.innerWidth}></canvas>   
            <Topbar selectedTool={selectedTool}setSelectedTool={setSlectedTool}/> 
        </div>
    )
}

const Topbar=({selectedTool,setSelectedTool}:{
    selectedTool:Shape,
    setSelectedTool:(s:Shape)=>void
})=>{
    return(
        <div className='border text-white rounded-md p-2 fixed top-10 left-10 flex '>
            <IconButton 
            icon={<Pencil />}
            onClick={()=>{
                setSelectedTool("pencil")
            }}
            activated={selectedTool=='pencil'} >
            </IconButton>

            <IconButton 
            icon={<RectangleHorizontalIcon />}
            onClick={()=>{
                setSelectedTool("rectangle")
            }}
            activated={selectedTool=='rectangle'} >
            </IconButton>

            <IconButton 
            icon={<Circle />}
            onClick={()=>{
                setSelectedTool("circle")
            }}
            activated={selectedTool=='circle'} >
            </IconButton>

            <IconButton icon={<Eraser/>} activated={selectedTool=="eraser"} onClick={()=>{
                setSelectedTool("eraser")
            }} ></IconButton>

            <IconButton icon={<CrosshairIcon/>} activated={selectedTool=="select"} onClick={()=>{
                setSelectedTool("select")
            }} ></IconButton>

        </div>
    )
}


export default Canvas