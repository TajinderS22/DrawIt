import { useDispatch } from "react-redux";
import { setSelectedTool } from "../redux/slices/selectedToolSlice";
import IconButton from "./IconButton";
import {
  Circle,
  CrosshairIcon,
  Eraser,
  Pencil,
  RectangleHorizontalIcon,
} from "lucide-react";

type Shape = "circle" | "rectangle" | "pencil" | "eraser" | "select";

const ToolBar = ({ selectedTool }: { selectedTool: Shape }) => {
  const dispatch = useDispatch();

  return (
    <div className="border text-white rounded-md p-2 fixed top-10 left-10 flex z-50">
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
    </div>
  );
};

export default ToolBar;
