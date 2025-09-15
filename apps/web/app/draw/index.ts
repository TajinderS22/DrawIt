import axios from "axios";
import { BACKEND_URL } from "../config";

type Shape={
    type:"rect";
    x:number;
    y:number;
    width:number;
    height:number
}|{
    type:"circle";
    centerX:number;
    centerY:number;
    radius:number
}


const InitDraw=async (canvas:HTMLCanvasElement,roomId:number,socket:WebSocket)=>{
    const ctx= canvas.getContext("2d");
    // @ts-ignore
    const selectedTool=window.selectedTool
    
    
    const existingShapes:Shape[]=await getExistingShapes(roomId);
    if(!ctx){
        return
    }


    

    clearCanvas(existingShapes,canvas,ctx);
    let clicked=false;
    let startX=0;
    let startY=0;
    canvas.addEventListener('mousedown',(e)=>{
        clicked=true;
        startX=(e.clientX);
        startY=(e.clientY)
    })
    canvas.addEventListener('mouseup',(e)=>{
        clicked=false;
        const width=e.clientX-startX;
        const height=e.clientY-startY;

        let shape:Shape|null=null;
        
        if(selectedTool=='rectangle'){
            shape={
                type:"rect",
                x:startX,
                y:startY,
                height,
                width
            }
            existingShapes.push(shape);
        }else if(selectedTool=='circle'){
            
            const radius=Math.max(Math.abs(width),Math.abs(height))/2;
            shape={
                type:"circle",
                radius:radius,
                centerX:startX+radius,
                centerY:startY+radius
            }
            existingShapes.push(shape)

        }

        if(!shape){
            return
        }

        socket.send(JSON.stringify({
            type:"chat",
            message:JSON.stringify({shape}),
            roomId, 
        }))
 
    })
    canvas.addEventListener('mousemove',(e)=>{
        if(clicked){
            
            const width=e.clientX-startX;
            const height=e.clientY-startY;
            clearCanvas(existingShapes,canvas,ctx);
            ctx.strokeStyle="rgba(255,255,255)"

            if(selectedTool==="rectangle"){
                ctx.strokeRect(startX,startY,width,height)
            }else if(selectedTool==='circle'){
                const centerX=startX+width/2;
                const centery=startY+height/2;
                const radius=Math.max(Math.abs(width),Math.abs(height))/2
                ctx.beginPath()
                ctx.arc(centerX,centery,Math.abs(radius),0,Math.PI*2)
                ctx.stroke()
                ctx.closePath()
            }

            
        }
    })
}


const clearCanvas=(existingShapes:Shape[],canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D)=>{

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(0,0,0)"
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.strokeStyle='rgbs(255,255,255)'

    existingShapes.map((shape)=>{
        if(shape.type=='rect'){
            
            ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
        }else if(shape.type=='circle'){
            ctx.beginPath();
            ctx.arc(shape.centerX,shape.centerY,Math.abs(shape.radius),0,Math.PI*2)
            ctx.stroke();
            ctx.closePath()
        }
    })


}


const getExistingShapes=async(roomId:number)=>{
    const res=await axios.get(BACKEND_URL+`/user/chats/${roomId}`)
    const messages=res.data.messages;

    const shapes=messages.map((x:{message:string})=>{
        const messageData=JSON.parse(x.message)
        const shape=messageData.shape;
        return shape;
    })
    return shapes;
}



export default InitDraw;