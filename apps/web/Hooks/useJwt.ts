"use client";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const useJwt = () => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const jwtToken = localStorage.getItem("jwt");
      if (jwtToken) {
        setToken(jwtToken);
      } else {
        if (!pathname.includes("sign")) {
          router.push("/signin");
        }
      }
    }
  }, [pathname, router]);

  return token;
};

export default useJwt;
