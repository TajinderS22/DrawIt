import { useDispatch } from "react-redux";
import { setSelectedTool } from "../redux/slices/selectedToolSlice";
import IconButton from "./IconButton";
import {
  Circle,
  CrosshairIcon,
  Eraser,
  Pencil,
  RectangleHorizontalIcon,
  Download,
} from "lucide-react";

type Shape = "circle" | "rectangle" | "pencil" | "eraser" | "select";

const ToolBar = ({ selectedTool }: { selectedTool: Shape }) => {
  const dispatch = useDispatch();

  const downloadCanvas = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) {
      alert("Canvas not found");
      return;
    }

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `DrawIt-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ring-1 ring-[#444444] bg-[#161616]  rounded-md p-2 m-2 my-4 absolute flex justify-center z-50">
      <IconButton
        icon={<Pencil />}
        onClick={() => {
          dispatch(setSelectedTool("pencil"));
        }}
        activated={selectedTool == "pencil"}
      ></IconButton>

      <IconButton
        icon={<RectangleHorizontalIcon />}
        onClick={() => {
          dispatch(setSelectedTool("rectangle"));
        }}
        activated={selectedTool == "rectangle"}
      ></IconButton>

      <IconButton
        icon={<Circle />}
        onClick={() => {
          dispatch(setSelectedTool("circle"));
        }}
        activated={selectedTool == "circle"}
      ></IconButton>

      <IconButton
        icon={<Eraser />}
        activated={selectedTool == "eraser"}
        onClick={() => {
          dispatch(setSelectedTool("eraser"));
        }}
      ></IconButton>

      <IconButton
        icon={<CrosshairIcon />}
        activated={selectedTool == "select"}
        onClick={() => {
          dispatch(setSelectedTool("select"));
        }}
      ></IconButton>

      <div className="border-l border-gray-600 mx-1"></div>

      <IconButton
        icon={<Download />}
        activated={false}
        onClick={downloadCanvas}
        title="Download canvas as image"
      ></IconButton>
    </div>
  );
};

export default ToolBar;
