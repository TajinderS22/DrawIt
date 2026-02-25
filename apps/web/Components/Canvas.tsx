"use client";

import React, { useEffect, useRef, useState } from "react";
import InitDraw from "../app/draw";
import { Game } from "../app/draw/Game";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { DateTime } from "next-auth/providers/kakao";

type UserType = {
  id: string;
  iat: DateTime;
};

const Canvas = ({ roomId, Socket }: { roomId: number; Socket: WebSocket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game>();

  const user = useSelector<RootState, any>((state) => state.user);
  const selectedTool = useSelector<RootState, any>(
    (state) => state.selectedTool,
  );

  const userId = user?.id;
  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, Socket, userId);
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [canvasRef, user]);

  // Handle wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !game) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.001;
        game.zoom(zoomDelta, e.clientX, e.clientY);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [game]);

  // Handle pan with middle mouse button or space + drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !game) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        container.style.cursor = "grabbing";
        // Tell game not to handle drawing while container panning
        if (game && typeof (game as any).isPanning !== "undefined") {
          (game as any).isPanning = true;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        game.pan(deltaX, deltaY);
        startX = e.clientX;
        startY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      isPanning = false;
      container.style.cursor = "default";
      if (game && typeof (game as any).isPanning !== "undefined") {
        (game as any).isPanning = false;
      }
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [game]);

  return (
    <div
      ref={containerRef}
      className="min-w-screen bg-red-100 overflow-hidden min-h-screen relative"
    >
      <canvas
        ref={canvasRef}
        height={window.innerHeight}
        width={window.innerWidth}
      ></canvas>
      <div className="absolute bottom-4 right-4 bg-gray-900/80 text-white p-3 rounded text-sm z-10">
        <div>Scroll to zoom (Ctrl + Scroll)</div>
        <div>Shift + Drag or Middle-click + Drag to pan</div>
      </div>
    </div>
  );
};

export default Canvas;
