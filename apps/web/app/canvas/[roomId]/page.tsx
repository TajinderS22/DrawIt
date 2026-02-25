"use client";

import { useSelector } from "react-redux";
import JWT from "../../../Components/JWT";
import { RootState } from "../../../redux/store";

import { useParams } from "next/navigation";
import ToolBar from "../../../Components/ToolBar";

const page = ({}) => {
  const params = useParams();

  const roomId = Number(params?.roomId);

  const selectedTool = useSelector<RootState, any>(
    (state) => state.selectedTool,
  );

  return (
    <div className="bg-white">
      <ToolBar selectedTool={selectedTool} />
      <JWT roomId={roomId}></JWT>
    </div>
  );
};

export default page;
