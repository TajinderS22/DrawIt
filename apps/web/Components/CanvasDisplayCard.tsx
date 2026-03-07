import axios from "axios";
import { ArrowRightCircleIcon, Loader, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BACKEND_URL } from "../app/config";


const colors = [
  "bg-cyan-200/75",
  "bg-amber-200/75",
  "bg-red-200/75",
  "bg-green-200/75",
  "bg-gray-200/75",
  "bg-teal-200/75",
];

const CanvasDisplayCard = ({
  data,
  removeCardFromAllCanvases,
  setAlertMessage,
  setAlertType,
}: {
  data: any;
  removeCardFromAllCanvases: any;
  setAlertMessage: any;
  setAlertType:any;
}) => {
  const { id, slug } = data;
  const router = useRouter();

  const [hovering, setHovering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [randomColor] = useState(
    colors[Math.floor(Math.random() * colors.length)],
  );


  const setAlert=async(message:string)=>{
     setAlertMessage(message);
     setAlertType("failure");
     setLoading(false);
     setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
     }, 5000);
  }


  const handleCanvasDelete = async () => {
    const res = await axios.post(
      BACKEND_URL + "/user/canvas/delete",
      {
        id: id,
      },
      {
        headers: {
          authorization: localStorage.getItem("jwt"),
        },
      },
    );

    console.log(res);
    if (res.data.authorized) {
      setLoading(false);
      removeCardFromAllCanvases(res.data.deleted.id);
      router.refresh();
    } else {
      setAlert(res.data.message)
    }
  };

  return (
    <div
      onClick={() => router.push("/canvas/" + id)}
      className={` p-6 text-xl  ${randomColor} m-2 rounded-lg w-11/12 mx-auto
      flex items-center  justify-between
      `}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      key={id}
    >
      <div className={`flex-`}>{slug}</div>
      {loading && (
        <div className="flex-1 flex justify-center">
          <div>
            <Loader className="animate-spin " />
          </div>
        </div>
      )}
      <div className="flex gap-4">
        {hovering && (
          <Trash2
            onClick={(e) => {
              setLoading(true);
              handleCanvasDelete();
              e.stopPropagation();
            }}
          />
        )}
        <ArrowRightCircleIcon />
      </div>
    </div>
  );
};

export default CanvasDisplayCard;
