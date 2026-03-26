"use client";

import React, { useEffect, useRef, useState } from "react";
import { Game } from "../app/draw/Game";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import useJwt from "../Hooks/useJwt";
import { useRouter } from "next/navigation";

const Canvas = ({ roomId, Socket }: { roomId: number; Socket: WebSocket }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textBoxRef = useRef<HTMLInputElement>(null);
  const [game, setGame] = useState<Game>();
  const [showTextInput, setShowTextInput] = useState(false);
  const router=useRouter();
  

  const user = useSelector<RootState, any>((state) => state.user);
  
  if(!user){
    router.push("/dashboard")
  }

  const selectedTool = useSelector<RootState, any>((state) => state.selectedTool);
  const userId = user?.id;

  // Sync selected tool to game
  useEffect(() => {
    if (!game) return;
    game.setTool(selectedTool);
    if (selectedTool !== "text") {
      game.cancelText();
      setShowTextInput(false);
    }
  }, [selectedTool, game]);

  // Create game instance
  useEffect(() => {
    if (!canvasRef.current) return;
    const userName = user?.username || "User";
    const g = new Game(canvasRef.current, roomId, Socket, userId, userName);
    setGame(g);
    return () => g.destroy();
  }, [canvasRef, user, roomId, Socket, userId]);

  useEffect(() => {
    if (!game) return;
    const interval = setInterval(() => {
      setShowTextInput(game.isTyping);
      if (game.isTyping && textBoxRef.current && document.activeElement !== textBoxRef.current) {
        textBoxRef.current.value = "";
        textBoxRef.current.focus();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [game]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !game) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        game.zoom(-e.deltaY * 0.001, e.clientX, e.clientY);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [game]);

  // Pan (middle-click or shift+drag)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !game) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const onDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        container.style.cursor = "grabbing";
        game.isPanning = true;
      }
    };
    const onMove = (e: MouseEvent) => {
      if (!isPanning) return;
      game.pan(e.clientX - startX, e.clientY - startY);
      startX = e.clientX;
      startY = e.clientY;
    };
    const onUp = () => {
      isPanning = false;
      container.style.cursor = "default";
      game.isPanning = false;
    };

    container.addEventListener("mousedown", onDown);
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseup", onUp);
    container.addEventListener("mouseleave", onUp);

    return () => {
      container.removeEventListener("mousedown", onDown);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseup", onUp);
      container.removeEventListener("mouseleave", onUp);
    };
  }, [game]);

  // Get text input position from game
  const textPos = showTextInput && game ? game.getTextScreenPosition() : null;

  return (
    <div
      ref={containerRef}
      className="min-w-screen bg-red-100 overflow-hidden min-h-screen relative"
    >
      <canvas
        ref={canvasRef}
        height={window.innerHeight}
        width={window.innerWidth}
      />

      {/* Text input — appears at click position */}
      {showTextInput && textPos && (
        <input
          ref={textBoxRef}
          type="text"
          autoFocus
          onChange={(e) => game!.updatePreviewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              game!.commitText();
              if (textBoxRef.current) textBoxRef.current.value = "";
              setShowTextInput(false);
            }
            if (e.key === "Escape") {
              game!.cancelText();
              if (textBoxRef.current) textBoxRef.current.value = "";
              setShowTextInput(false);
            }
          }}
          style={{
            position: "absolute",
            left: textPos.x,
            top: textPos.y - 24,
            background: "rgba(30, 30, 30, 0.85)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "6px",
            color: "white",
            fontSize: "20px",
            fontFamily: "sans-serif",
            outline: "none",
            padding: "2px 8px",
            minWidth: "120px",
            zIndex: 100,
            caretColor: "white",
          }}
        />
      )}

      <div className="absolute bottom-4 right-4 bg-gray-900/80 text-white p-3 rounded text-sm z-10">
        <div>Scroll to zoom (Ctrl + Scroll)</div>
        <div>Shift + Drag or Middle-click + Drag to pan</div>
      </div>
    </div>
  );
};

export default Canvas;
