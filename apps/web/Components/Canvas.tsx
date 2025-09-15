import React, { useEffect, useRef, useState } from 'react'
import InitDraw from '../app/draw'
import IconButton from './IconButton'
import { Circle, Pencil, RectangleHorizontalIcon } from 'lucide-react'
import { Game } from '../app/draw/Game'


type Shape="circle"|"rectangle"|"pencil"

const Canvas = ({roomId,Socket}:{roomId:number,Socket:WebSocket}) => {

    const canvasRef=useRef<HTMLCanvasElement>(null)
    const [game,setGame]=useState<Game>();

    const [selectedTool,setSlectedTool]=useState<"circle"|"rectangle"|"pencil">("circle")

    useEffect(()=>{
        game?.setTool(selectedTool)
        
    },[selectedTool,game])



    useEffect(()=>{
    if(canvasRef.current){
        const g=new Game(canvasRef.current,roomId,Socket)
        setGame(g);

        return ()=>{
            g.destroy()
        }
    }    
    },[canvasRef])

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

        </div>
    )
}


export default Canvas