"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

const useJwt = () => {
  const [token, setToken] = useState<string | null>(null);
  // const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.user);

  const setJwtToken = () => {
    if(typeof window !== "undefined"){
      const jwtToken = localStorage.getItem("jwt");
      if (jwtToken) {
        setToken(jwtToken);
      } else {
        setToken(null);
      }
    }
  };

  useEffect(() => {
    setJwtToken();
  }, [pathname,user]);

  return token;
};

export default useJwt;
