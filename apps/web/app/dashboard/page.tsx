"use client";

// import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "../config";
import CanvasDisplayCard from "../../Components/CanvasDisplayCard";
import { Loader, X } from "lucide-react";
import useJwt from "../../Hooks/useJwt";
import Navbar from "../../Components/Navbar";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import useActiveSession from "../../Hooks/useActiveSession";
import Loading from "../../Components/Loading";
import Alert from "@repo/ui/Alert";

const Page = () => {
  const router = useRouter();

  const jwt =  useJwt()
  const user=useActiveSession()

  

  const joinRoomRef = useRef<HTMLInputElement>(null);
  const createRoomRef = useRef<HTMLInputElement>(null);

  const [createRoom, setCreateRoom] = useState<boolean>(false);
  const [joinRoom, setJoinRoom] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [allRooms, setAllRooms] = useState<any[]>([]);

  const getUserRooms = async () => {
    const rooms = await axios.get(BACKEND_URL + "/user/rooms", {
      headers: {
        authorization: jwt,
      },
    });
    if(rooms.status==200){
      setAllRooms(rooms.data.rooms);
      setLoading(false);
    }
  };

  const [refreshRooms,setRefreshRooms]= useState(true)

  useEffect(() => {
    if(jwt&&user){
      getUserRooms();
    }
    
  }, [jwt,user,refreshRooms]);

  const removeCardFromAllCanvases = (deletedId: string) => {
    setAllRooms((prev: any[]) => prev.filter((x) => x.id !== deletedId));
  };

  const handleCreateRoom = async () => {
    const response = await axios.post(
      BACKEND_URL + "/user/room/create",
      {
        slug: createRoomRef?.current?.value,
      },
      {
        headers: {
          authorization: localStorage.getItem("jwt"),
        },
      },
    );
      await axios.post(
      BACKEND_URL + "/user/room/join",
      {
        roomId: response.data.roomId,
      },
      {
        headers: {
          authorization: localStorage.getItem("jwt"),
        },
      },
    );
    setCreateRoom(false)
    setRefreshRooms(!refreshRooms)
  };

  const handleJoinRoomClick = async () => {
    const roomid = await axios.get(
      BACKEND_URL + "/user/canvas/" + joinRoomRef?.current?.value
    );
    await axios.post(
      BACKEND_URL + "/user/room/join",
      {
        roomId: roomid.data.roomId,
      },
      {
        headers: {
          authorization: localStorage.getItem("jwt"),
        },
      },
    );
    setJoinRoom(false);
    setRefreshRooms(!refreshRooms);
  };

  const [alertType, setAlertType] = useState('');
  const [alertMessage, setAlertMessage] = useState('');


  if(loading){

    return (
      <Loading/>
    );
  }






  return (
    <div className="p-2 max-w-[1920px] mx-auto ">
      <Alert type={alertType} message={alertMessage} />
      <div className="-z-10 b">
        <Navbar />
      </div>

      {joinRoom && (
        <div className="fixed w-full h-svh z-10 bg-slate-900/40 ">
          <div className="flex items-center  w-fill backdrop-blur-md flex-col mx-auto min-h-[98svh] pt-20 ">
            <div className="bg-stone-100/50 p-4 rounded-lg  ">
              <div className="flex  justify-between items-center text-xl m-2">
                <p className="text-2xl">Canvas Name</p>
                <button
                  className=" p-2  rounded-md  "
                  onClick={() => {
                    setJoinRoom(false);
                  }}
                >
                  <X height={30} width={30} />
                </button>
              </div>

              <div className="mt-6">
                <input
                  ref={joinRoomRef}
                  type="text"
                  placeholder="Please Enter Canvas Name"
                  className=" min-w-[400px] ring-1 bg-gray-300  p-2 rounded-md  border-amber-50/30 border "
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-400/80 mr-2 text-stone-900 ring-1  min-w-30  my-2 mt-8 rounded-md  "
                  onClick={() => {
                    handleJoinRoomClick();
                  }}
                >
                  Join Canvas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createRoom && (
        <div className="fixed w-full h-svh z-10 bg-slate-900/40 ">
          <div className="flex items-center  w-fill backdrop-blur-md flex-col mx-auto min-h-[98svh] pt-20 ">
            <div className="bg-stone-100/50 p-4 rounded-lg  ">
              <div className="flex  justify-between items-center text-xl m-2">
                <p className="text-2xl">Canvas Name</p>
                <button
                  className=" p-2  rounded-md  "
                  onClick={() => {
                    setCreateRoom(false);
                  }}
                >
                  <X height={30} width={30} />
                </button>
              </div>

              <div className="mt-6">
                <input
                  ref={createRoomRef}
                  type="text"
                  placeholder="Please Enter Canvas Name"
                  className=" min-w-[400px] ring-1 bg-gray-300  p-2 rounded-md  border-amber-50/30 border "
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-400/80 mr-2 text-stone-900 ring-1  min-w-30  my-2 mt-8 rounded-md  "
                  onClick={() => {
                    handleCreateRoom();
                  }}
                >
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div></div>

      {/* Actual data */}

      <div
        className={`text-xl p-2 my-2 mb-6 w-11/12 mx-auto
        flex items-center justify-between
        `}
      >
        <span className="text-5xl   text-white  bg-stone-800/60 py-4 p-2 px-4 rounded-lg ">
          My Canvases
        </span>

        <div>
          <button
            onClick={() => {
              setCreateRoom(!createRoom);
            }}
            className="bg-stone-400 m-2 rounded-md z-10 p-2 border boerder-purple-300"
          >
            Create room
          </button>

          <button
            onClick={() => {
              setJoinRoom(!joinRoom);
            }}
            className="bg-sky-300/80 m-2 rounded-md z-10 p-2 border boerder-purple-300"
          >
            Join Room
          </button>
        </div>
      </div>

      <div className="">
        {allRooms?.map((x) => (
          <div key={x.id}>
            <CanvasDisplayCard
              data={x}
              removeCardFromAllCanvases={removeCardFromAllCanvases}
              setAlertMessage={setAlertMessage}
              setAlertType={setAlertType}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
