/* eslint-disable prefer-const */
import { getExistingShapes } from "./ApiCalls";

// type Shape={
//     type:"rect";
//     x:number;
//     y:number;
//     width:number;
//     height:number
// }|{
//     type:"circle";
//     centerX:number;
//     centerY:number;
//     radius:number
// }|{
//     type:'pencil';
//     points:{
//         x:number,
//         y:number 
//     }[]
// }|{
//     type:'eraser'
// }

type Tools='rectangle'|'circle'|"pencil"|'eraser'|'select'

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes:any[];
    private roomId:number;
    private socket:WebSocket;
    private clicked:boolean;
    private startX=0;
    private startY=0;
    private selectdTool:Tools='circle';
    private lineThickness=1;
    private lastX:number=0;
    private lastY:number=0;
    private currentPencilPoints: { x: number; y: number }[] = [];
    private userId:string;
    private selectedShape:  any| null = null; 
    private allShapesFromServer: any;

    constructor(canvas: HTMLCanvasElement,roomId:number|string,socket:WebSocket, userId:string) {
        this.canvas = canvas;
        this.ctx=canvas.getContext('2d')!;
        this.existingShapes=[];
        this.roomId=Number(roomId);
        this.socket=socket;
        this.clicked=false;
        this.userId=userId;
        this.init();
        this.initHandlers();
        this.reRenderCanvas();
        this.initMouseHandlers();

    }

    setTool(tool:Tools){
        this.selectdTool=tool
    }

    setShapesFromServer(){

    }

    setExistingShapes=async()=>{
            const Shapes=await getExistingShapes(this.roomId)

            const ServerShape=Shapes.map((x:any)=>{
                const message=JSON.parse(x.message)
                const serverShape={
                    id:x.id,
                    shape:message.shape
                }
                return serverShape
            })
            this.allShapesFromServer=ServerShape

            const shape=Shapes.map((x:any)=>{
                const message=JSON.parse(x.message)
                const shape=message.shape
                return shape
            })
            return shape
        }

    async init(){
        this.reRenderCanvas()
        
        this.existingShapes=await this.setExistingShapes()
        this.reRenderCanvas()
    }

    initHandlers(){
        this.socket.onmessage=(event)=>{
            const message=JSON.parse(event.data);
            if(message.type=='chat'){
                const parsedShape=JSON.parse(message.message    );
                const shape=parsedShape.shape;
                if(shape) this.existingShapes.push(shape);
                this.reRenderCanvas();
            }else if(message.type=='chat_delete_shape'){
                console.log(message)
                this.init()
                
            }
        }
    }

    renderPencil({mouseX,mouseY}:{mouseX:any,mouseY:any}){
        let x1 = mouseX, x2 = this.lastX, y1 = mouseY, y2 = this.lastY;
        let steep = (Math.abs(y2 - y1) > Math.abs(x2 - x1));

        if (steep){
            let x = x1;
            x1 = y1;
            y1 = x;
            let y = y2;
            y2 = x2;
            x2 = y;
        }
        if (x1 > x2) {
            let x = x1;
            x1 = x2;
            x2 = x;
            let y = y1;
            y1 = y2;
            y2 = y;
        }
        let dx = x2 - x1, dy = Math.abs(y2 - y1), error = 0, de = dy / dx, yStep = -1, y = y1;
        if (y1 < y2) yStep = 1;

        this.ctx.fillStyle = "rgba(255,255,255,1)";
        this.lineThickness = 5 - Math.sqrt((x2 - x1) **2 + (y2 - y1) **2)/10;
        if(this.lineThickness < 1) this.lineThickness = 1;

        for (let x = x1; x < x2; x++) {
            if (steep) this.ctx.fillRect(y, x, this.lineThickness , this.lineThickness );
            else this.ctx.fillRect(x, y, this.lineThickness , this.lineThickness );

            error += de;
            if (error >= 0.5) {
                y += yStep;
                error -= 1.0;
            }
        }
    }

    // ===== Helpers for selection, deletion, and eraser =====
    isInsideRect(shape: any, x: number, y: number) { 
        return x >= shape.x && x <= shape.x + shape.width &&
               y >= shape.y && y <= shape.y + shape.height;
    }

    isInsideCircle(shape: any, x: number, y: number) { 
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        return Math.sqrt(dx*dx + dy*dy) <= shape.radius;
    }

    isInsidePencil(shape: any, x: number, y: number) { 
        const threshold = 5;
        for (let i = 1; i < shape.points.length; i++) {
            const p1 = shape.points[i-1];
            const p2 = shape.points[i];
            if (this.pointToSegmentDistance({x,y}, p1, p2) <= threshold) return true;
        }
        return false;
    }

    pointToSegmentDistance(p: any, v: any, w: any) {
        const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x)*(w.x - v.x) + (p.y - v.y)*(w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = v.x + t*(w.x - v.x);
        const projY = v.y + t*(w.y - v.y);
        return Math.hypot(p.x - projX, p.y - projY);
    }

    handleEraser(x: number, y: number) { 
        this.existingShapes = this.existingShapes.filter(shape => {
            if (shape.type==="rect") return !this.isInsideRect(shape, x, y);
            if (shape.type==="circle") return !this.isInsideCircle(shape, x, y);
            if (shape.type==="pencil") return !this.isInsidePencil(shape, x, y);
            return true;
        });
        this.deleteSelectedShape()

        this.reRenderCanvas();
    }

    selectShape(x: number, y: number) {
        for(let i=this.existingShapes.length-1; i>=0; i--){
            const shape = this.existingShapes[i];
            if(!shape) continue
            if(shape.type==='rect' && this.isInsideRect(shape, x, y)) { this.selectedShape=shape; return; }
            if(shape.type==='circle' && this.isInsideCircle(shape, x, y)) { this.selectedShape=shape; return; }
            if(shape.type==='pencil' && this.isInsidePencil(shape, x, y)) { this.selectedShape=shape; return; }
        }
        this.selectedShape = null;
    }

    areShapesEqual(a:any,b:any){
        if(a.type!=b.type) return false
        else if(a.type=='circle'){
            return  a.centerX === b.centerX &&
                    a.centerY === b.centerY &&
                    a.radius === b.radius;
        }else if (a.type === 'rect') {
          return a.x === b.x &&
                 a.y === b.y &&
                 a.width === b.width &&
                 a.height === b.height;
        } else if (a.type === 'pencil') {
          return JSON.stringify(a.points) === JSON.stringify(b.points);
        }

        return false
    }

    deleteSelectedShape() {
        if(!this.selectedShape) return;

        const deleteShape= this.allShapesFromServer.find((x: any)=>
            this.areShapesEqual(this.selectedShape,x.shape)
        )
    
            this.socket.send(JSON.stringify({
                type: "chat_delete_shape",
                message: JSON.stringify({ data:deleteShape}),
                roomId: this.roomId,
                userId: this.userId
            }));

        this.reRenderCanvas();
    }

    // ===== Canvas render =====
    reRenderCanvas(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.fillStyle="rgba(0,0,0)"
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)

        this.existingShapes.map((shape)=>{
            if(shape === this.selectedShape){
                this.ctx.strokeStyle = 'yellow'; 
            } else {
                this.ctx.strokeStyle = 'white';
            }

            if(shape.type=='rect'){
                this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
            }else if(shape.type=='circle'){
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI*2);
                this.ctx.stroke();
                this.ctx.closePath();
            }else if(shape.type=='pencil'){
                if(shape.points && shape.points.length>1){
                    for(let i=1;i<shape.points.length;i++){
                        if (shape.points[i] && shape.points[i-1]) {
                            const mouseX=(shape as any).points[i].x;
                            const mouseY=(shape as any).points[i].y;
                            this.lastX = (shape as any).points[i-1].x;
                            this.lastY = (shape as any).points[i-1].y;
                            this.renderPencil({mouseX, mouseY});
                        }
                    }
                }
            }
        })
    }

    // ===== Mouse handlers =====
    mouseDownHandler=(e:any)=>{
        this.clicked=true
        this.startX=e.clientX;
        this.startY=e.clientY;
        this.lastX=e.pageX;
        this.lastY=e.pageY;
        this.ctx.fillStyle="#ffffff";

        if(this.selectdTool==='select'){
            this.selectShape(e.pageX,e.pageY);

            this.reRenderCanvas();
            return;

        }

        if(this.selectdTool==='eraser'){
            this.selectShape(e.pageX,e.pageY)
            this.handleEraser(e.pageX,e.pageY)
            this.reRenderCanvas()
            return;
        }

        if(this.selectdTool==='pencil'){
            this.currentPencilPoints=[{x:this.lastX, y:this.lastY}];
        }
    }

    mouseUpHandler=(e:any)=>{
        this.clicked=false;
        const width=e.clientX-this.startX;
        const height=e.clientY-this.startY;
        let shape:any|null=null;

        if(this.selectdTool=='rectangle'){
            shape={type:"rect", x:this.startX, y:this.startY, width, height};
            this.existingShapes.push(shape);
        }else if(this.selectdTool=='circle'){
            const radius=Math.max(width,height)/2;
            shape={type:"circle", centerX:this.startX+radius, centerY:this.startY+radius, radius};
            this.existingShapes.push(shape);
        }else if(this.selectdTool==='pencil'){
            shape={type:"pencil", points:this.currentPencilPoints};
            this.existingShapes.push(shape);
        }

        if(shape){
            this.socket.send(JSON.stringify({type:"chat", message:JSON.stringify({shape}), roomId:this.roomId, userId:this.userId}));
        }
        this.setExistingShapes()
        
        this.currentPencilPoints=[];
    }

    mouseMoveHandler=(e:any)=>{
        if(!this.clicked) return;
        const width=e.clientX-this.startX;
        const height=e.clientY-this.startY;
        this.reRenderCanvas();

        this.ctx.strokeStyle="white";
        if(this.selectdTool==='rectangle'){
            this.ctx.strokeRect(this.startX,this.startY,width,height);
        }else if(this.selectdTool==='circle'){
            const radius=Math.max(width,height)/2;
            const centerX=this.startX+radius;
            const centerY=this.startY+radius;
            this.ctx.beginPath();
            this.ctx.arc(centerX,centerY,radius,0,Math.PI*2);
            this.ctx.stroke();
            this.ctx.closePath();
        }else if(this.selectdTool==='pencil'){
            const mouseX=e.pageX;
            const mouseY=e.pageY;
            this.renderPencil({mouseX, mouseY});
            this.currentPencilPoints.push({x:mouseX, y:mouseY});
            this.lastX=mouseX;
            this.lastY=mouseY;
        }else if(this.selectdTool==='eraser'){
            this.handleEraser(e.pageX,e.pageY);
        }
    }

    destroy(){
        this.canvas.removeEventListener("mousedown",this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup",this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove",this.mouseMoveHandler);
    }

    initMouseHandlers(){
        this.canvas.addEventListener("mousedown",this.mouseDownHandler);
        this.canvas.addEventListener("mouseup",this.mouseUpHandler);
        this.canvas.addEventListener("mousemove",this.mouseMoveHandler);
    }
}
