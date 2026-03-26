/* eslint-disable prefer-const */
import { getExistingShapes } from "./ApiCalls";

type Tools = "rectangle" | "circle" | "pencil" | "eraser" | "select" | "pan" | "text";

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

  private remoteDrawingShapes: Map<string, any> = new Map();
  private lastDrawBroadcastTime: number = 0;
  public isPanning: boolean = false;

  private offsetX: number = 0;
  private offsetY: number = 0;
  private scale: number = 1;
  private minScale: number = 0.1;
  private maxScale: number = 5;
  private currInputText: string = "";
  private textX: number = 0;
  private textY: number = 0;
  public isTyping: boolean = false;

  // Drag state
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragOriginalShape: any = null;
  private dragShapeServerId: number | null = null;
  private lastMoveTime: number = 0;

  // Remote cursors
  private remoteCursors: Map<string, { x: number; y: number; name: string; lastSeen: number }> = new Map();
  private lastCursorSendTime: number = 0;
  private userName: string;

  constructor(
    canvas: HTMLCanvasElement,
    roomId: number | string,
    socket: WebSocket,
    userId: string,
    userName: string = "User",
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = Number(roomId);
    this.socket = socket;
    this.clicked = false;
    this.userId = userId;
    this.userName = userName;
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

    const minX = -this.offsetX / this.scale;
    const minY = -this.offsetY / this.scale;
    const maxX = (this.canvas.width - this.offsetX) / this.scale;
    const maxY = (this.canvas.height - this.offsetY) / this.scale;

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

      } else if (message.type === "shape_drawing") {
        if (message.userId !== this.userId) {
          this.remoteDrawingShapes.set(message.userId, message.shape);
          this.reRenderCanvas();
        }

      } else if (message.type === "shape_draw_end") {
        if (message.userId !== this.userId) {
          this.remoteDrawingShapes.delete(message.userId);
          const shape = message.shape;
          if (shape) {
            this.existingShapes.push(shape);
            if (message.chatId) {
              this.allShapesFromServer = this.allShapesFromServer || [];
              const exists = this.allShapesFromServer.find(
                (s: any) => s.id === message.chatId,
              );
              if (!exists) {
                this.allShapesFromServer.push({ id: message.chatId, shape });
              }
            }
          }
          this.reRenderCanvas();
        }

      } else if (message.type == "chat_delete_shape_success") {
        const deletedShapeContent = message.shape.shape;
        const deletedShapeId = message.shape.id;

        // Find and remove exactly ONE matching shape locally
        const idx = this.existingShapes.findIndex((x) => this.areShapesEqual(x, deletedShapeContent));
        if (idx !== -1) {
          this.existingShapes.splice(idx, 1);
        }

        // Also remove from local server cache
        if (this.allShapesFromServer) {
          const sIdx = this.allShapesFromServer.findIndex((s: any) => 
            (deletedShapeId && s.id === deletedShapeId) || this.areShapesEqual(s.shape, deletedShapeContent)
          );
          if (sIdx !== -1) {
            this.allShapesFromServer.splice(sIdx, 1);
          }
        }

        this.reRenderCanvas();

      } else if (message.type === "shape_move" || message.type === "shape_move_end") {
        if (message.userId !== this.userId) {
          let serverEntry = null;
          if (message.shapeId) {
            serverEntry = this.allShapesFromServer?.find(
              (s: any) => s.id === message.shapeId,
            );
          } else if (message.shape?.clientId) {
            serverEntry = this.allShapesFromServer?.find(
              (s: any) => s.shape?.clientId === message.shape.clientId,
            );
          }

          if (serverEntry) {
            const idx = this.existingShapes.findIndex((s: any) =>
              this.areShapesEqual(s, serverEntry.shape),
            );
            if (idx !== -1) {
              this.existingShapes[idx] = message.shape;
            }
            serverEntry.shape = message.shape;
          } else if (message.shape?.clientId) {
            const idx = this.existingShapes.findIndex((s: any) =>
              s.clientId === message.shape.clientId,
            );
            if (idx !== -1) {
              this.existingShapes[idx] = message.shape;
            }
          }
          this.reRenderCanvas();
        }

      } else if (message.type === "cursor_move") {
        if (message.userId !== this.userId) {
          this.remoteCursors.set(message.userId, {
            x: message.x,
            y: message.y,
            name: message.name || "User",
            lastSeen: Date.now(),
          });
          this.reRenderCanvas();
        }

      } else if (message.type === "shape_saved") {
        const shape = message.shape;
        if (shape && message.chatId) {
          this.allShapesFromServer = this.allShapesFromServer || [];
          const exists = this.allShapesFromServer.find(
            (s: any) => s.id === message.chatId,
          );
          if (!exists) {
            const matchIdx = this.allShapesFromServer.findIndex(
              (s: any) => !s.id && this.areShapesEqual(s.shape, shape),
            );
            if (matchIdx !== -1) {
              this.allShapesFromServer[matchIdx].id = message.chatId;
            } else {
              this.allShapesFromServer.push({ id: message.chatId, shape });
            }
          }
        }
      }
    };

    // Remove stale cursors after 3s of inactivity
    setInterval(() => {
      const now = Date.now();
      let changed = false;
      this.remoteCursors.forEach((cursor, id) => {
        if (now - cursor.lastSeen > 3000) {
          this.remoteCursors.delete(id);
          changed = true;
        }
      });
      if (changed) this.reRenderCanvas();
    }, 1000);
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

  isInsideRect(shape: any, x: number, y: number) {
    const minX = Math.min(shape.x, shape.x + shape.width);
    const maxX = Math.max(shape.x, shape.x + shape.width);
    const minY = Math.min(shape.y, shape.y + shape.height);
    const maxY = Math.max(shape.y, shape.y + shape.height);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }

  isInsideCircle(shape: any, x: number, y: number) {
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

    for (const shape of this.existingShapes) {
      if (!shape) continue;

      let shouldDelete = false;

      if (shape.type === "rect") {
        shouldDelete = this.isInsideRect(shape, x, y);
      } else if (shape.type === "circle") {
        shouldDelete = this.isInsideCircle(shape, x, y);
      } else if (shape.type === "pencil") {
        shouldDelete = this.isInsidePencil(shape, x, y);
      } else if (shape.type === "text") {
        shouldDelete = this.isInsideText(shape, x, y);
      }

      if (shouldDelete) {
        shapesToDelete.push(shape);
        this.deletingShapes.push({ shape });
      }
    }

    shapesToDelete.forEach((shape) => {
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

      // Immediate local deletion by exact reference constraint
      this.existingShapes = this.existingShapes.filter((x) => x !== shape);
      if (this.selectedShape === shape) {
        this.selectedShape = null;
      }

      // Important: Remove from tracking cache so its ID isn't reused maliciously
      if (deleteShape && this.allShapesFromServer) {
        this.allShapesFromServer = this.allShapesFromServer.filter((s: any) => s !== deleteShape);
      }
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
      if (shape.type === "text" && this.isInsideText(shape, x, y)) {
        this.selectedShape = shape;
        return;
      }
    }
    this.selectedShape = null;
  }

  areShapesEqual(a: any, b: any) {
    if (!a || !b) return false;
    // Robust identity checking
    if (a.clientId && b.clientId && a.clientId === b.clientId) return true;
    
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
    } else if (a.type === "text") {
      return a.x === b.x && a.y === b.y && a.text === b.text;
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

    // Immediate local deletion tightly bound by reference
    this.existingShapes = this.existingShapes.filter((x) => x !== this.selectedShape);
    
    // Prevent ID reuse by removing from server tracking cache
    if (deleteShape && this.allShapesFromServer) {
      this.allShapesFromServer = this.allShapesFromServer.filter((s: any) => s !== deleteShape);
    }

    this.selectedShape = null;

    this.reRenderCanvas();
  }

  reRenderCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(24, 25, 26)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

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
      } else if (shape.type == "text") {
        this.ctx.font = `${shape.fontSize || 20}px sans-serif`;
        this.ctx.fillStyle = shape === this.selectedShape ? "yellow" : "white";
        this.ctx.fillText(shape.text, shape.x, shape.y);
      }
    }

    // Live text preview
    if (this.isTyping && this.currInputText) {
      this.ctx.font = "20px sans-serif";
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      this.ctx.fillText(this.currInputText, this.textX, this.textY);
    }

    // Remote users' in-progress shapes
    this.remoteDrawingShapes.forEach((shape, remoteUserId) => {
      if (!shape) return;
      const hue = Array.from(remoteUserId).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
      const color = `hsla(${hue}, 80%, 60%, 0.5)`;
      this.ctx.strokeStyle = color;
      this.ctx.fillStyle = color;
      this.ctx.setLineDash([6, 4]);

      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil" && shape.points && shape.points.length > 1) {
        for (let i = 1; i < shape.points.length; i++) {
          if (shape.points[i] && shape.points[i - 1]) {
            const mouseX = shape.points[i].x;
            const mouseY = shape.points[i].y;
            this.lastX = shape.points[i - 1].x;
            this.lastY = shape.points[i - 1].y;
            this.renderPencil({ mouseX, mouseY });
          }
        }
      }
      this.ctx.setLineDash([]);
    });

    
    this.remoteCursors.forEach((cursor, id) => {
      const hue = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
      const color = `hsl(${hue}, 80%, 50%)`;

      this.ctx.beginPath();
      this.ctx.moveTo(cursor.x, cursor.y);
      this.ctx.lineTo(cursor.x + 10, cursor.y + 10);
      this.ctx.lineTo(cursor.x + 5, cursor.y + 15);
      this.ctx.lineTo(cursor.x, cursor.y);
      this.ctx.fillStyle = color;
      this.ctx.fill();

      this.ctx.font = "14px sans-serif";
      this.ctx.fillStyle = color;
      this.ctx.fillText(cursor.name, cursor.x + 12, cursor.y + 20);
    });

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

      if (this.selectedShape) {
        this.isDragging = true;
        this.dragStartX = x;
        this.dragStartY = y;
        this.dragOriginalShape = this.deepCopyShape(this.selectedShape);

        const serverEntry = this.allShapesFromServer?.find((s: any) =>
          this.areShapesEqual(this.dragOriginalShape, s.shape),
        );
        this.dragShapeServerId = serverEntry?.id || null;
      }

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

    if (this.selectdTool === "text") {
      if (this.isTyping && this.currInputText) {
        this.commitText();
      }
      this.textX = x;
      this.textY = y;
      this.isTyping = true;
      this.currInputText = "";
      this.reRenderCanvas();
    }
  };

  mouseUpHandler = (e: any) => {
    this.clicked = false;
    if (this.isPanning) return;

    if (this.isDragging) {
      this.finishDrag();
      return;
    }
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

    if (shape !== null) {
      shape.clientId = this.userId + "-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
    }

    checkAlreadyOnCanvas(shape);

    if (shape !== null && !shapeAlreadyOnCanvas) {
      this.existingShapes.push(shape);
      if (shape) {
        this.socket.send(
          JSON.stringify({
            type: "shape_draw_end",
            message: JSON.stringify({ shape }),
            roomId: this.roomId,
            userId: this.userId,
          }),
        );
        this.allShapesFromServer = this.allShapesFromServer || [];
        this.allShapesFromServer.push({ id: null, shape });
      }
      shapeAlreadyOnCanvas = false;
    }
    shapeAlreadyOnCanvas = false;
    this.currentPencilPoints = [];
  };

  mouseMoveHandler = (e: any) => {
    if (this.isPanning) return;

    const { x, y } = this.screenToWorld(e.offsetX, e.offsetY);

    // Broadcast cursor position 
    const now = Date.now();
    if (now - this.lastCursorSendTime > 50) {
      this.lastCursorSendTime = now;
      this.socket.send(
        JSON.stringify({
          type: "cursor_move",
          x,
          y,
          name: this.userName,
          roomId: this.roomId,
          userId: this.userId,
        }),
      );
    }

    // Handle shape dragging
    if (this.isDragging && this.selectedShape && this.clicked) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      this.applyDragDelta(this.selectedShape, this.dragOriginalShape, dx, dy);
      this.reRenderCanvas();

      if (now - this.lastMoveTime > 50) {
        this.lastMoveTime = now;
        this.sendShapeMove();
      }
      return;
    }

    if (!this.clicked) return;
    this.reRenderCanvas();

    const width = x - this.startX;
    const height = y - this.startY;

    let inProgressShape: any = null;

    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.strokeStyle = "white";
    if (this.selectdTool === "rectangle") {
      this.ctx.strokeRect(this.startX, this.startY, width, height);
      inProgressShape = { type: "rect", x: this.startX, y: this.startY, width, height };
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
      inProgressShape = { type: "circle", centerX, centerY, radius };
    } else if (this.selectdTool === "pencil") {
      const mouseX = x;
      const mouseY = y;

      this.lastX = x;
      this.lastY = y;

      this.currentPencilPoints.push({ x: mouseX, y: mouseY });
      if (this.currentPencilPoints && this.currentPencilPoints.length > 1) {
        for (let i = 1; i < this.currentPencilPoints.length; i++) {
          if (this.currentPencilPoints[i] && this.currentPencilPoints[i - 1]) {
            const curr = this.currentPencilPoints[i];
            const prev = this.currentPencilPoints[i - 1];
            const mouseX = curr!.x;
            const mouseY = curr!.y;
            this.lastX = prev!.x;
            this.lastY = prev!.y;
            this.renderPencil({ mouseX, mouseY });
          }
        }
      }
      inProgressShape = { type: "pencil", points: [...this.currentPencilPoints] };
    } else if (this.selectdTool === "eraser") {
      this.handleEraser(x, y);
    }

    // Broadcast in-progress shape 
    if (inProgressShape && now - this.lastDrawBroadcastTime > 50) {
      this.lastDrawBroadcastTime = now;
      this.socket.send(
        JSON.stringify({
          type: "shape_drawing",
          shape: inProgressShape,
          roomId: this.roomId,
          userId: this.userId,
        }),
      );
    }

    this.ctx.restore();
  };

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  pan(dx: number, dy: number) {
    const currentTool = this.selectdTool;
    this.selectdTool = "pan";
    this.offsetX += dx;
    this.offsetY += dy;

    this.reRenderCanvas();
    this.selectdTool = currentTool;
  }

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

  private screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    };
  }


  private deepCopyShape(shape: any) {
    if (shape.type === "pencil") {
      return { ...shape, points: shape.points.map((p: any) => ({ ...p })) };
    }
    return { ...shape };
  }

  private applyDragDelta(shape: any, original: any, dx: number, dy: number) {
    if (shape.type === "rect" || shape.type === "text") {
      shape.x = original.x + dx;
      shape.y = original.y + dy;
    } else if (shape.type === "circle") {
      shape.centerX = original.centerX + dx;
      shape.centerY = original.centerY + dy;
    } else if (shape.type === "pencil") {
      shape.points = original.points.map((p: any) => ({
        x: p.x + dx,
        y: p.y + dy,
      }));
    }
  }

  private sendShapeMove() {
    if (!this.selectedShape) return;
    
    this.socket.send(
      JSON.stringify({
        type: "shape_move",
        shapeId: this.dragShapeServerId,
        shape: this.deepCopyShape(this.selectedShape),
        roomId: this.roomId,
        userId: this.userId,
      }),
    );
  }

  finishDrag() {
    if (!this.selectedShape) {
      this.isDragging = false;
      return;
    }

    this.socket.send(
      JSON.stringify({
        type: "shape_move_end",
        shapeId: this.dragShapeServerId,
        shape: this.deepCopyShape(this.selectedShape),
        roomId: this.roomId,
        userId: this.userId,
      }),
    );

    if (this.allShapesFromServer) {
      let entry = null;
      if (this.dragShapeServerId) {
        entry = this.allShapesFromServer.find(
          (s: any) => s.id === this.dragShapeServerId,
        );
      } else if (this.selectedShape.clientId) {
        entry = this.allShapesFromServer.find(
          (s: any) => s.shape?.clientId === this.selectedShape.clientId,
        );
      }
      if (entry) {
        entry.shape = this.deepCopyShape(this.selectedShape);
      }
    }

    this.isDragging = false;
    this.dragOriginalShape = null;
    this.dragShapeServerId = null;
    this.reRenderCanvas();
  }


  updatePreviewText(text: string) {
    this.currInputText = text;
    this.reRenderCanvas();
  }

  commitText() {
    if (!this.currInputText || !this.isTyping) return;

    const shape = {
      type: "text" as const,
      x: this.textX,
      y: this.textY,
      text: this.currInputText,
      fontSize: 20,
      clientId: this.userId + "-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
    };

    this.existingShapes.push(shape);
    this.socket.send(
      JSON.stringify({
        type: "shape_draw_end",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
        userId: this.userId,
      }),
    );
    this.allShapesFromServer = this.allShapesFromServer || [];
    this.allShapesFromServer.push({ id: null, shape });

    this.currInputText = "";
    this.isTyping = false;
    this.reRenderCanvas();
  }

  cancelText() {
    this.currInputText = "";
    this.isTyping = false;
    this.reRenderCanvas();
  }

  getTextScreenPosition() {
    return {
      x: this.textX * this.scale + this.offsetX,
      y: this.textY * this.scale + this.offsetY,
    };
  }

  isInsideText(shape: any, x: number, y: number) {
    if (!shape.text) return false;
    const fontSize = shape.fontSize || 20;
    const textWidth = shape.text.length * fontSize * 0.6;
    return (
      x >= shape.x &&
      x <= shape.x + textWidth &&
      y >= shape.y - fontSize &&
      y <= shape.y
    );
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
