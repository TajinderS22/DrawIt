"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import axios from "axios";
import { BACKEND_URL } from "../app/config";
import { setUser } from "../redux/slices/UserSlice";
import {  usePathname, useRouter } from "next/navigation";

const useActiveSession = () => {
  const [jwt,setJwt]=useState<null|string>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname=usePathname()



  const user = useSelector((state: RootState) => state.user);

  const setUserToRedux = async () => {
    if (jwt) {
      const res = await axios.post(
        BACKEND_URL + "/user/verify",
        {},
        {
          headers: {
            authorization: jwt,
          },
        },
      );
      if (res.status == 200) {
        if(localStorage.getItem("jwt")){
          dispatch(setUser(res.data.user));
        }
      }else {
        router.push("/signin");
      }
    }else{
      // dispatch(clearUser())
      return 
    }

  };

  useEffect(() => {
    const jwt=localStorage.getItem("jwt");
    setJwt(jwt);
    if(!jwt){
      if(!pathname.includes("sign")){
        router.push("/signin");
      }
    }
    if (!user && jwt) {
      setUserToRedux();
    }
  }, [user,jwt]);

  return user;
};

export default useActiveSession;
