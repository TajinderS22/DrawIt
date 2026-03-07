/* eslint-disable prefer-const */
import { getExistingShapes } from "./ApiCalls";

type Tools = "rectangle" | "circle" | "pencil" | "eraser" | "select" | "pan";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: any[];
  private roomId: number;
  private socket: WebSocket;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private selectdTool: Tools = "circle";
  private lineThickness = 1;
  private lastX: number = 0;
  private lastY: number = 0;
  private currentPencilPoints: { x: number; y: number }[] = [];
  private userId: string;
  private selectedShape: any | null = null;
  private allShapesFromServer: any;
  private deletingShapes: Array<{ shape: any }> = [];
  // Indicates whether an external pan operation is in progress (set by container)
  public isPanning: boolean = false;

  private offsetX: number = 0;
  private offsetY: number = 0;
  private scale: number = 1;
  private minScale: number = 0.1;
  private maxScale: number = 5;

  constructor(
    canvas: HTMLCanvasElement,
    roomId: number | string,
    socket: WebSocket,
    userId: string,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = Number(roomId);
    this.socket = socket;
    this.clicked = false;
    this.userId = userId;
    this.init();
    this.initHandlers();
    this.reRenderCanvas();
    this.initMouseHandlers();
  }

  setTool(tool: Tools) {
    this.selectdTool = tool;
  }

  setShapesFromServer() {}

  setExistingShapes = async () => {
    const Shapes = await getExistingShapes(this.roomId);

    const ServerShape = Shapes.map((x: any) => {
      const message = JSON.parse(x.message);
      const serverShape = {
        id: x.id,
        shape: message.shape,
      };
      return serverShape;
    });
    this.allShapesFromServer = ServerShape;

    const shape = Shapes.map((x: any) => {
      const message = JSON.parse(x.message);
      const shape = message.shape;
      return shape;
    });
    return shape;
  };

  async init() {
    this.reRenderCanvas();

    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 2;

    this.existingShapes = await this.setExistingShapes();
  }

  drawDots() {
    const ctx = this.ctx;
    ctx.fillStyle = "#999";

    const spacing = 100;
    const radius = 1;

    // Calculate the world bounds that are visible on screen
    const minX = -this.offsetX / this.scale;
    const minY = -this.offsetY / this.scale;
    const maxX = (this.canvas.width - this.offsetX) / this.scale;
    const maxY = (this.canvas.height - this.offsetY) / this.scale;

    // Start from the nearest grid line
    const startX = Math.floor(minX / spacing) * spacing;
    const startY = Math.floor(minY / spacing) * spacing;

    for (let x = startX; x <= maxX; x += spacing) {
      for (let y = startY; y <= maxY; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type == "chat") {
        const parsedShape = JSON.parse(message.message);
        const shape = parsedShape.shape;
        // Avoid duplicating shapes on the origin client: if this message
        // comes from the same user who created it, we already added the
        // shape locally. Still, capture the DB id (message.chat) so
        // deletes can reference it immediately.
        if (shape) {
          if (message.userId !== this.userId) {
            this.existingShapes.push(shape);
          }
          if (message.chat && message.chat.id) {
            this.allShapesFromServer = this.allShapesFromServer || [];
            const exists = this.allShapesFromServer.find(
              (s: any) => s.id === message.chat.id,
            );
            if (!exists) {
              this.allShapesFromServer.push({ id: message.chat.id, shape });
            }
          }
        }
        this.reRenderCanvas();
      } else if (message.type == "chat_delete_shape_success") {
        const deletedShape = message.shape.shape;
        this.existingShapes = this.existingShapes.filter(
          (x) => !this.areShapesEqual(x, deletedShape),
        );
        this.reRenderCanvas();
      }
    };
  }

  renderPencil({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
    let x1 = mouseX,
      x2 = this.lastX,
      y1 = mouseY,
      y2 = this.lastY;
    let steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);

    if (steep) {
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
    let dx = x2 - x1,
      dy = Math.abs(y2 - y1),
      error = 0,
      de = dy / dx,
      yStep = -1,
      y = y1;
    if (y1 < y2) yStep = 1;

    // Use current stroke style (yellow if selected, white otherwise)
    this.ctx.fillStyle = this.ctx.strokeStyle;
    this.lineThickness = 5 - Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 10;
    if (this.lineThickness < 1) this.lineThickness = 1;

    for (let x = x1; x < x2; x++) {
      if (steep)
        this.ctx.fillRect(y, x, this.lineThickness, this.lineThickness);
      else this.ctx.fillRect(x, y, this.lineThickness, this.lineThickness);

      error += de;
      if (error >= 0.5) {
        y += yStep;
        error -= 1.0;
      }
    }
  }

  // ===== Helpers for selection, deletion, and eraser =====
  isInsideRect(shape: any, x: number, y: number) {
    const minX = Math.min(shape.x, shape.x + shape.width);
    const maxX = Math.max(shape.x, shape.x + shape.width);
    const minY = Math.min(shape.y, shape.y + shape.height);
    const maxY = Math.max(shape.y, shape.y + shape.height);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  isInsideCircle(shape: any, x: number, y: number) {
    // Handle cases where radius might be negative by using absolute value
    const radius = Math.abs(shape.radius);
    const dx = x - shape.centerX;
    const dy = y - shape.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= radius;
  }

  isInsidePencil(shape: any, x: number, y: number) {
    const threshold = 5;
    for (let i = 1; i < shape.points.length; i++) {
      const p1 = shape.points[i - 1];
      const p2 = shape.points[i];
      if (this.pointToSegmentDistance({ x, y }, p1, p2) <= threshold)
        return true;
    }
    return false;
  }

  pointToSegmentDistance(p: any, v: any, w: any) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = v.x + t * (w.x - v.x);
    const projY = v.y + t * (w.y - v.y);
    return Math.hypot(p.x - projX, p.y - projY);
  }

  handleEraser(x: number, y: number) {
    const shapesToDelete: any[] = [];

    // Find shapes that should be deleted but do not remove them locally
    // until the server confirms deletion. This prevents desync where the
    // origin client removes immediately but the server/other clients still
    // have the shape.
    for (const shape of this.existingShapes) {
      if (!shape) continue;

      let shouldDelete = false;

      if (shape.type === "rect") {
        shouldDelete = this.isInsideRect(shape, x, y);
      } else if (shape.type === "circle") {
        shouldDelete = this.isInsideCircle(shape, x, y);
      } else if (shape.type === "pencil") {
        shouldDelete = this.isInsidePencil(shape, x, y);
      }

      if (shouldDelete) {
        shapesToDelete.push(shape);
        this.deletingShapes.push({ shape });
      }
    }

    shapesToDelete.forEach((shape) => {
      // Try to find DB record (id) for this shape. If not found, send the
      // shape payload and let the server match/delete by content.
      const deleteShape = this.allShapesFromServer
        ? this.allShapesFromServer.find((x: any) =>
            this.areShapesEqual(shape, x.shape),
          )
        : null;

      const payload = deleteShape ? { data: deleteShape } : { data: { shape } };
      this.socket.send(
        JSON.stringify({
          type: "chat_delete_shape",
          message: JSON.stringify(payload),
          roomId: this.roomId,
          userId: this.userId,
        }),
      );
    });

    this.reRenderCanvas();
  }

  selectShape(x: number, y: number) {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const shape = this.existingShapes[i];
      if (!shape) continue;
      if (shape.type === "rect" && this.isInsideRect(shape, x, y)) {
        this.selectedShape = shape;
        return;
      }
      if (shape.type === "circle" && this.isInsideCircle(shape, x, y)) {
        this.selectedShape = shape;
        return;
      }
      if (shape.type === "pencil" && this.isInsidePencil(shape, x, y)) {
        this.selectedShape = shape;
        return;
      }
    }
    this.selectedShape = null;
  }

  areShapesEqual(a: any, b: any) {
    if (!a || !b) return false;
    if (a.type != b.type) return false;
    else if (a.type == "circle") {
      return (
        a.centerX === b.centerX &&
        a.centerY === b.centerY &&
        a.radius === b.radius
      );
    } else if (a.type === "rect") {
      return (
        a.x === b.x &&
        a.y === b.y &&
        a.width === b.width &&
        a.height === b.height
      );
    } else if (a.type === "pencil") {
      return JSON.stringify(a.points) === JSON.stringify(b.points);
    }

    return false;
  }

  deleteSelectedShape() {
    if (!this.selectedShape) return;

    const deleteShape = this.allShapesFromServer
      ? this.allShapesFromServer.find((x: any) =>
          this.areShapesEqual(this.selectedShape, x.shape),
        )
      : null;

    const payload = deleteShape
      ? { data: deleteShape }
      : { data: { shape: this.selectedShape } };
    this.socket.send(
      JSON.stringify({
        type: "chat_delete_shape",
        message: JSON.stringify(payload),
        roomId: this.roomId,
        userId: this.userId,
      }),
    );
  }

  // ===== Canvas render =====

  reRenderCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(24, 25, 26)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context state
    this.ctx.save();

    // Apply transformations
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.drawDots();

    for (const shape of this.existingShapes) {
      if (!shape) continue;

      if (shape === this.selectedShape) {
        this.ctx.strokeStyle = "yellow";
      } else {
        this.ctx.strokeStyle = "white";
      }

      if (shape.type == "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type == "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2,
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type == "pencil") {
        if (shape.points && shape.points.length > 1) {
          for (let i = 1; i < shape.points.length; i++) {
            if (shape.points[i] && shape.points[i - 1]) {
              const mouseX = (shape as any).points[i].x;
              const mouseY = (shape as any).points[i].y;
              this.lastX = (shape as any).points[i - 1].x;
              this.lastY = (shape as any).points[i - 1].y;
              this.renderPencil({ mouseX, mouseY });
            }
          }
        }
      }
    }

    // Restore context state
    this.ctx.restore();
  }

  mouseDownHandler = (e: MouseEvent) => {
    if (
      this.isPanning ||
      e.button === 1 ||
      (e.button === 0 && (e as MouseEvent).shiftKey)
    ) {
      return;
    }

    this.clicked = true;

    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);

    this.startX = this.lastX = x;
    this.startY = this.lastY = y;

    this.ctx.fillStyle = "#ffffff";

    if (this.selectdTool === "select") {
      this.selectShape(x, y);

      this.reRenderCanvas();
      return;
    }

    if (this.selectdTool === "eraser") {
      this.selectShape(x, y);
      this.handleEraser(x, y);

      this.reRenderCanvas();
      return;
    }

    if (this.selectdTool === "pencil") {
      this.currentPencilPoints = [{ x, y }];
      this.lastX = x;
      this.lastY = y;
    }
  };

  mouseUpHandler = (e: any) => {
    this.clicked = false;
    if (this.isPanning) return;
    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);
    const width = x - this.startX;
    const height = y - this.startY;
    let shape: any | null = null;

    let shapeAlreadyOnCanvas = false;
    const checkAlreadyOnCanvas = (shape: any) => {
      this.existingShapes.map((x) => {
        if (this.areShapesEqual(x, shape)) {
          shapeAlreadyOnCanvas = true;
        }
      });
    };

    if (this.selectdTool == "rectangle") {
      shape = { type: "rect", x: this.startX, y: this.startY, width, height };
    } else if (this.selectdTool == "circle") {
      const tempRadius = Math.max(Math.abs(width), Math.abs(height)) / 2;

      let radius = 0;
      if (height < 0 || width < 0) {
        radius = -tempRadius;
      } else {
        radius = tempRadius;
      }

      let centerX = 0;
      let centerY = 0;

      if (radius < 0) {
        if (width < 0 && height < 0) {
          centerX = this.startX - Math.abs(radius);
          centerY = this.startY - Math.abs(radius);
        } else if (width < 0 && height > 0) {
          centerX = this.startX - Math.abs(radius);
          centerY = this.startY + Math.abs(radius);
        } else if (width > 0 && height < 0) {
          centerX = this.startX + Math.abs(radius);
          centerY = this.startY - Math.abs(radius);
        }
      } else {
        centerX = this.startX + Math.abs(radius);
        centerY = this.startY + Math.abs(radius);
      }

      shape = { type: "circle", centerX, centerY, radius };
    } else if (this.selectdTool === "pencil") {
      shape = { type: "pencil", points: this.currentPencilPoints };
      this.currentPencilPoints = [];
    }

    checkAlreadyOnCanvas(shape);

    if (shape !== null && !shapeAlreadyOnCanvas) {
      this.existingShapes.push(shape);
      if (shape) {
        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId,
            userId: this.userId,
          }),
        );
      }
      this.setExistingShapes();
      shapeAlreadyOnCanvas = false;
    }
    shapeAlreadyOnCanvas = false;
    this.currentPencilPoints = [];
  };

  mouseMoveHandler = (e: any) => {
    // Don't draw while panning
    if (this.isPanning) return;
    if (!this.clicked) return;
    this.reRenderCanvas();
    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);

    const width = x - this.startX;
    const height = y - this.startY;

    // Apply transformations before drawing preview
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.strokeStyle = "white";
    if (this.selectdTool === "rectangle") {
      this.ctx.strokeRect(this.startX, this.startY, width, height);
    } else if (this.selectdTool === "circle") {
      const tempRadius = Math.max(Math.abs(width), Math.abs(height)) / 2;

      let radius = 0;
      if (height < 0 || width < 0) {
        radius = -tempRadius;
      } else {
        radius = tempRadius;
      }

      let centerX = 0;
      let centerY = 0;

      if (radius < 0) {
        if (width < 0 && height < 0) {
          centerX = this.startX - Math.abs(radius);
          centerY = this.startY - Math.abs(radius);
        } else if (width < 0 && height > 0) {
          centerX = this.startX - Math.abs(radius);
          centerY = this.startY + Math.abs(radius);
        } else if (width > 0 && height < 0) {
          centerX = this.startX + Math.abs(radius);
          centerY = this.startY - Math.abs(radius);
        }
      } else {
        centerX = this.startX + Math.abs(radius);
        centerY = this.startY + Math.abs(radius);
      }

      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.closePath();
    } else if (this.selectdTool === "pencil") {
      const mouseX = x;
      const mouseY = y;
      this.renderPencil({ mouseX, mouseY });
      this.currentPencilPoints.push({ x: mouseX, y: mouseY });
      this.lastX = x;
      this.lastY = y;
    } else if (this.selectdTool === "eraser") {
      this.handleEraser(x, y);
    }

    this.ctx.restore();
  };

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  // Pan functionality
  pan(dx: number, dy: number) {
    const currentTool = this.selectdTool;
    this.selectdTool = "pan";
    this.offsetX += dx;
    this.offsetY += dy;

    this.reRenderCanvas();
    this.selectdTool = currentTool;
  }

  // Zoom functionality
  zoom(delta: number, mouseX: number, mouseY: number) {
    const previousScale = this.scale;
    this.scale = Math.min(
      this.maxScale,
      Math.max(this.minScale, this.scale + delta),
    );

    const factor = this.scale / previousScale;
    this.offsetX = mouseX - (mouseX - this.offsetX) * factor;
    this.offsetY = mouseY - (mouseY - this.offsetY) * factor;

    this.reRenderCanvas();
  }

  // Convert to world coordinates
  private screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    };
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
