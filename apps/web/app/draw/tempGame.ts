import { getExistingShapes } from "./ApiCalls";

type Tools = "rectangle" | "circle" | "pencil" | "eraser" | "select";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: any[] = [];
  private roomId: number;
  private socket: WebSocket;
  private clicked = false;
  private startX = 0;
  private startY = 0;
  private lastX = 0;
  private lastY = 0;
  private selectdTool: Tools = "circle";
  private lineThickness = 1;
  private currentPencilPoints: { x: number; y: number }[] = [];
  private userId: string;
  private selectedShape: any | null = null;
  private allShapesFromServer: any;

  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private minScale = 0.1;
  private maxScale = 5;

  constructor(
    canvas: HTMLCanvasElement,
    roomId: number | string,
    socket: WebSocket,
    userId: string,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = Number(roomId);
    this.socket = socket;
    this.userId = userId;

    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  async init() {
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2;

    this.existingShapes = await this.setExistingShapes();
    this.reRenderCanvas();
  }

  setTool(tool: Tools) {
    this.selectdTool = tool;
  }

  setExistingShapes = async () => {
    const Shapes = await getExistingShapes(this.roomId);

    this.allShapesFromServer = Shapes.map((x: any) => ({
      id: x.id,
      shape: JSON.parse(x.message).shape,
    }));

    return Shapes.map((x: any) => JSON.parse(x.message).shape);
  };

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsed = JSON.parse(message.message);
        if (parsed.shape) this.existingShapes.push(parsed.shape);
        this.reRenderCanvas();
      }
      if (message.type === "chat_delete_shape") {
        this.init();
      }
    };
  }

  private screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    };
  }

  drawAxes() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1 / this.scale;

    ctx.beginPath();
    ctx.moveTo(-10000, 0);
    ctx.lineTo(10000, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -10000);
    ctx.lineTo(0, 10000);
    ctx.stroke();

    ctx.restore();
  }

  reRenderCanvas() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.drawAxes();

    for (const shape of this.existingShapes) {
      this.ctx.strokeStyle = shape === this.selectedShape ? "yellow" : "white";

      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }

      if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
      }

      if (shape.type === "pencil") {
        for (let i = 1; i < shape.points.length; i++) {
          const p1 = shape.points[i - 1];
          const p2 = shape.points[i];
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    this.ctx.restore();
  }

  mouseDownHandler = (e: MouseEvent) => {
    this.clicked = true;
    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);

    this.startX = this.lastX = x;
    this.startY = this.lastY = y;

    if (this.selectdTool === "pencil") {
      this.currentPencilPoints = [{ x, y }];
    }
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (!this.clicked) return;
    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);

    this.reRenderCanvas();

    if (this.selectdTool === "rectangle") {
      this.ctx.save();
      this.ctx.translate(this.offsetX, this.offsetY);
      this.ctx.scale(this.scale, this.scale);
      this.ctx.strokeRect(
        this.startX,
        this.startY,
        x - this.startX,
        y - this.startY,
      );
      this.ctx.restore();
    }

    if (this.selectdTool === "pencil") {
      this.currentPencilPoints.push({ x, y });
      this.lastX = x;
      this.lastY = y;
    }
  };

  mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;
    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);

    let shape: any = null;

    if (this.selectdTool === "rectangle") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: x - this.startX,
        height: y - this.startY,
      };
    }

    if (this.selectdTool === "circle") {
      const r = Math.hypot(x - this.startX, y - this.startY) / 2;
      shape = {
        type: "circle",
        centerX: (this.startX + x) / 2,
        centerY: (this.startY + y) / 2,
        radius: r,
      };
    }

    if (this.selectdTool === "pencil") {
      shape = { type: "pencil", points: this.currentPencilPoints };
      this.currentPencilPoints = [];
    }

    if (shape) {
      this.existingShapes.push(shape);
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId,
          userId: this.userId,
        }),
      );
    }

    this.reRenderCanvas();
  };

  pan(dx: number, dy: number) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.reRenderCanvas();
  }

  zoom(delta: number, mouseX: number, mouseY: number) {
    const prev = this.scale;
    this.scale = Math.min(
      this.maxScale,
      Math.max(this.minScale, this.scale + delta),
    );

    const factor = this.scale / prev;
    this.offsetX = mouseX - (mouseX - this.offsetX) * factor;
    this.offsetY = mouseY - (mouseY - this.offsetY) * factor;

    this.reRenderCanvas();
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
  }
}
