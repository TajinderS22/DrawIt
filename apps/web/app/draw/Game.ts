import { getExistingShapes } from "./ApiCalls";

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

type Tools='rectangle'|'circle'|"pencil"


export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes:Shape[];
    private roomId:number;
    private socket:WebSocket;
    private clicked:boolean;
    private startX=0;
    private startY=0;
    private selectdTool:Tools='circle';


    constructor(canvas: HTMLCanvasElement,roomId:number|string,socket:WebSocket) {
        this.canvas = canvas;
        this.ctx=canvas.getContext('2d')!;
        this.existingShapes=[];
        this.roomId=Number(roomId);
        this.socket=socket;
        this.clicked=false;
        this.init();
        this.initHandlers();
        this.reRenderCanvas();
        this.initMouseHandlers();
    }

    setTool(tool:"rectangle"|'pencil'|"circle"){
        this.selectdTool=tool
    }

    async init(){
        this.existingShapes=await getExistingShapes(this.roomId)
        this.reRenderCanvas()
    }
    initHandlers(){
        this.socket.onmessage=(event)=>{
        const message=JSON.parse(event.data);

        if(message.type=='chat'){
            const parsedShape=JSON.parse(message.message);
            const shape=parsedShape.shape;

            this.existingShapes.push(shape)
            this.reRenderCanvas();
        }}
    }
    reRenderCanvas(){

        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.fillStyle="rgba(0,0,0)"
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
        this.ctx.strokeStyle='rgbs(255,255,255)'

        this.existingShapes.map((shape)=>{
            if(shape.type=='rect'){

                this.ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
            }else if(shape.type=='circle'){


                this.ctx.beginPath();
                this.ctx.arc(shape.centerX,shape.centerY,Math.abs(shape.radius),0,Math.PI*2)
                this.ctx.stroke();
                this.ctx.closePath()
            }
        })
    }

    mouseDownHandler=(e:any)=>{
        this.clicked=true
        this.startX=e.clientX;
        this.startY=e.clientY;
    }

    mouseUpHandler=(e:any)=>{
        this.clicked=false;
        const width=e.clientX-this.startX;
        const height=e.clientY-this.startY;
        let shape:Shape|null=null;
        
        if(this.selectdTool=='rectangle'){
            shape={
                type:"rect",
                x:this.startX,
                y:this.startY,
                height,
                width
            }
            this.existingShapes.push(shape);
        }else if(this.selectdTool=='circle'){
            const radius=Math.max((width),(height))/2;
            shape={
                type:"circle",
                radius:radius,
                centerX:this.startX+radius,
                centerY:this.startY+radius
            }
            this.existingShapes.push(shape)
        }
        if(!shape){
            return
        }
        this.socket.send(JSON.stringify({
            type:"chat",
            message:JSON.stringify({shape}),
            roomId:this.roomId, 
        }))
    }

    mouseMoveHandler=(e:any)=>{
        if(this.clicked){

        const width=e.clientX-this.startX;
        const height=e.clientY-this.startY;
        this.reRenderCanvas();
        this.ctx.strokeStyle="rgba(255,255,255)"
        if(this.selectdTool==="rectangle"){
            this.ctx.strokeRect(this.startX,this.startY,width,height)
        }else if(this.selectdTool==='circle'){
            const radius=Math.max((width),(height))/2
            const centerX=this.startX+radius;
            const centerY=this.startY+radius;
            

            console.log(width,height,centerX,centerY,radius)

            this.ctx.beginPath()
            this.ctx.arc(centerX,centerY,Math.abs(radius),0,Math.PI*2)
            this.ctx.stroke()
            this.ctx.closePath()
        }
    }

    }

    destroy(){
        this.canvas.removeEventListener("mousedown",this.mouseDownHandler)
        this.canvas.removeEventListener('mouseup',this.mouseUpHandler)
        this.canvas.removeEventListener('mousemove',this.mouseMoveHandler)
    }

    initMouseHandlers(){
        this.canvas.addEventListener("mousedown",this.mouseDownHandler)
        this.canvas.addEventListener('mouseup',this.mouseUpHandler)
        this.canvas.addEventListener('mousemove',this.mouseMoveHandler)
    }

    

}   
