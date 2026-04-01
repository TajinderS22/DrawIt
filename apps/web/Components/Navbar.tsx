import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { clearUser } from "../redux/slices/UserSlice";

const Navbar = () => {
  const user = useSelector((state: RootState) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch=useDispatch()

  return (
    <div
      className="w-11/12  hover:shadow-lg shadow-[#7bf1a8]/30 bg-black 
     mt-4 min-h-10 p-2 max-w-[1920px] mx-auto border rounded-lg 
      border-gray-100 flex justify-between items-center-safe -z-10 "
    >
      <div>
        <p className="text-white text-4xl">DrawIt</p>
      </div>

      {user ? (
        <div className="text-white">
          <div className="flex gap-2 items-center">
            <div className="bg-stone-800 p-2 rounded-md ring-stone-300 ring-1"
                onClick={()=>{
                    router.push("/dashboard")
                }}
            >
              Dashboard
            </div>
            <div
              className="bg-red-400 text-black p-2 rounded-md flex items-center gap-2"
              onClick={() => {
                localStorage.removeItem("jwt");
                dispatch(clearUser())
                router.push("/");
              }}
            >
              <p>Logout</p>
              <LogOutIcon />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div>
            {pathname == "/signup" ? (
              <div
                className="bg-[#7BF1A8]/80 mx-2 p-2 rounded-md"
                onClick={() => {
                  router.push("/signin");
                }}
              >
                Signin
              </div>
            ) : (
              <div
                className="bg-[#7BF1A8]/80 mx-2 p-2 rounded-md"
                onClick={() => {
                  router.push("/signup");
                }}
              >
                Signup
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
