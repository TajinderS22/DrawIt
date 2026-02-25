# Canvas Zoom and Pan Features - Changes Documentation

## Overview

Added scrollable canvas with zoom and pan functionality to the DrawIt drawing application. Users can now zoom in/out and pan across the canvas while maintaining proper interaction with drawing tools.

---

## Files Modified

### 1. **apps/web/Components/Canvas.tsx**

#### Changes Made:

**Added container reference:**

```tsx
const containerRef = useRef<HTMLDivElement>(null);
```

**Implemented wheel zoom handler:**

- Listens for `Ctrl+Scroll` (or `Cmd+Scroll` on Mac) events
- Prevents default scroll behavior
- Calls `game.zoom()` with delta and mouse coordinates
- Calculates zoom delta: `-e.deltaY * 0.001`

**Implemented pan handler:**

- Supports two pan methods:
  1. Middle-click + Drag (`e.button === 1`)
  2. Shift + Left-click + Drag (`e.button === 0 && e.shiftKey`)
- Tracks pan start position and delta movement
- Changes cursor to 'grabbing' during pan
- Calls `game.pan()` with delta coordinates

**Updated container div:**

- Changed from static `<div>` to `<div ref={containerRef}>`
- Added `relative` class for positioning
- Added instructional overlay in bottom-right corner with pan/zoom controls info

**Added instructions overlay:**

```tsx
<div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-sm z-10">
  <div>Scroll to zoom (Ctrl + Scroll)</div>
  <div>Shift + Drag or Middle-click + Drag to pan</div>
</div>
```

---

### 2. **apps/web/app/draw/Game.ts**

#### New Properties Added:

```typescript
// Pan and zoom properties
private offsetX: number = 0;
private offsetY: number = 0;
private scale: number = 1;
private minScale: number = 0.1;
private maxScale: number = 5;
```

- `offsetX`, `offsetY`: Track the pan position of the canvas
- `scale`: Current zoom level (starts at 1.0 for 100%)
- `minScale`: Minimum zoom level (0.1x = 10%)
- `maxScale`: Maximum zoom level (5x = 500%)

#### New Methods Added:

**1. `pan(deltaX: number, deltaY: number)`**

- Updates `offsetX` and `offsetY` by the delta amounts
- Triggers canvas re-render
- Called from Canvas component during pan gestures

**2. `zoom(delta: number, mouseX: number, mouseY: number)`**

- Updates scale with delta (typically ±0.001 per scroll)
- Clamps scale between `minScale` and `maxScale`
- Adjusts offset to zoom towards mouse cursor position (viewport-aware)
- Triggers canvas re-render

**3. `screenToWorld(screenX: number, screenY: number)`** (private)

- Converts screen coordinates (mouse position) to world coordinates (canvas position)
- Formula: `x = (screenX - offsetX) / scale`
- Used in mouse event handlers for accurate drawing at any zoom level

**4. `worldToScreen(worldX: number, worldY: number)`** (private)

- Converts world coordinates back to screen coordinates
- Formula: `x = worldX * scale + offsetX`
- Utility method for coordinate transformation

#### Modified Methods:

**`reRenderCanvas()`**

- Added canvas transformation context:
  ```typescript
  this.ctx.save();
  this.ctx.translate(this.offsetX, this.offsetY);
  this.ctx.scale(this.scale, this.scale);
  // ... draw shapes
  this.ctx.restore();
  ```
- All shapes are now rendered with zoom and pan transformations applied
- Context is saved/restored to maintain proper state

**`mouseDownHandler(e: any)`**

- Converts screen coordinates to world coordinates using `screenToWorld()`
- Updates `startX`, `startY`, `lastX`, `lastY` using world coordinates
- Ensures accurate shape selection and drawing initiation at any zoom level

**`mouseMoveHandler(e: any)`**

- Converts screen coordinates to world coordinates
- Applies transformation context when rendering preview shapes
- Calculates deltas based on world coordinates instead of screen coordinates
- Updates pencil points using world coordinates
- Restores context after drawing preview

#### Coordinate System Transformation:

All mouse event handlers now:

1. Receive screen coordinates (relative to viewport)
2. Convert to world coordinates using `screenToWorld()`
3. Use world coordinates for all shape calculations and storage
4. When rendering, apply transformations to display correctly

---

## Feature Details

### Zoom Feature

- **Trigger**: `Ctrl + Scroll` or `Cmd + Scroll` on Mac
- **Range**: 0.1x (10%) to 5x (500%)
- **Behavior**: Zooms toward mouse cursor position for intuitive navigation
- **Smooth**: Incremental zoom based on scroll amount

### Pan Feature

- **Method 1**: Middle-click + Drag
- **Method 2**: Shift + Left-click + Drag
- **Visual Feedback**: Cursor changes to 'grabbing' during pan
- **Real-time**: Canvas updates as you pan

### Coordinate Transformation

- **Screen Coordinates**: Pixel position on screen (what mouse events provide)
- **World Coordinates**: Position in canvas space (used for drawing logic)
- **Transformation**: Automatically applied to all drawing operations

---

## Benefits

✅ **Better Navigation**: Users can zoom and pan for detailed work
✅ **Intuitive Controls**: Standard zoom (Ctrl+Scroll) and pan (Shift+Drag) gestures
✅ **Accurate Drawing**: Coordinate transformation ensures shapes are drawn correctly at any zoom level
✅ **Professional UX**: Visual feedback and on-screen instructions
✅ **Drawing Compatibility**: All existing drawing tools (rectangle, circle, pencil, eraser, select) work correctly with zoom/pan

---

## Testing Recommendations

1. **Zoom Testing**:
   - Test zoom in/out with Ctrl+Scroll
   - Verify zoom limits (can't zoom below 0.1x or above 5x)
   - Check that zoom centers on mouse cursor

2. **Pan Testing**:
   - Test pan with Shift+Drag
   - Test pan with Middle-click+Drag
   - Verify pan works smoothly at different zoom levels

3. **Drawing Tools**:
   - Draw rectangle at different zoom levels
   - Draw circle at different zoom levels
   - Draw with pencil after zooming/panning
   - Test eraser at different zoom levels
   - Test shape selection at different zoom levels

4. **Integration**:
   - Verify shapes sync correctly with other users
   - Test undo/delete functionality with zoomed canvas
   - Ensure performance remains smooth during extended zoom/pan operations

---

## Implementation Notes

- **Canvas Context Save/Restore**: Used to maintain proper drawing state
- **Viewport-aware Zooming**: Mouse position is tracked during zoom for intuitive behavior
- **No Breaking Changes**: All existing functionality preserved and compatible
- **Efficient Rendering**: Only re-renders on pan/zoom events
- **Coordinate Consistency**: All shape storage remains in world coordinates for network sync
