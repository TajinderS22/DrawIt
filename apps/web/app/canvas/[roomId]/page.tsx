"use client";

import { useSelector } from "react-redux";

import { RootState } from "../../../redux/store";

import { useParams } from "next/navigation";
import ToolBar from "../../../Components/ToolBar";
import useJwt from "../../../Hooks/useJwt";
import RoomCanvas from "../../../Components/RoomCanvas";
import useActiveSession from "../../../Hooks/useActiveSession";

const Page = ({}) => {
  const params = useParams();

  const jwt = useJwt();
  useActiveSession();

  const roomId = Number(params?.roomId);

  const selectedTool = useSelector<RootState, any>(
    (state) => state.selectedTool,
  );

  return (
    <div className="bg-white">
      <div className="w-full flex justify-center  ">
        <ToolBar selectedTool={selectedTool} />
      </div>
      <RoomCanvas roomId={roomId} jwtToken={jwt!} />
    </div>
  );
};

export default Page;
