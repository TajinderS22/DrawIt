"use client";
import { Button } from "@repo/ui/button";
import Input from "@repo/ui/Input";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { BACKEND_URL } from "../app/config";
import Alert from "@repo/ui/Alert";
import { useRouter } from "next/navigation";
import { set } from "react-hook-form";
import Signin from "../app/signin/page";
import Navbar from "./Navbar";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/UserSlice";
import useActiveSession from "../Hooks/useActiveSession";

const AuthPage = ({ isSignin }: { isSignin: boolean }) => {
  const router = useRouter();
  const [AlertMessage, setAlertMessage] = useState("");
  const [AlertType, setAlertType] = useState("");
  const dispatch = useDispatch();

  const user = useActiveSession();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user]);

  const signinUser = async () => {
    const data = {
      email: emailRef?.current?.value,
      password: passwordRef?.current?.value,
    };
    try {
      const response = await axios.post(BACKEND_URL + `/user/signin`, data);

      if (response.status === 200) {
        localStorage.setItem("jwt", response.data.jwt);
        setAlertMessage("Signed in successfully!");
        setAlertType("success");
        dispatch(setUser(response.data.user));
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (error) {
      setAlertMessage("Please try again.");
      setAlertType("failure");
      setTimeout(() => {
        (setAlertMessage(""), setAlertType(""));
      }, 3000);
      console.error(error);
    }
  };

  const SignupUser = async () => {
    const firstname = FirstNameRef?.current?.value;
    const lastname = LastNameRef?.current?.value;
    const username = usernameRef?.current?.value;
    const email = emailRef?.current?.value;
    const password = passwordRef?.current?.value;

    if (!firstname || !lastname || !username || !email || !password) {
      setAlertMessage("All fields are required!");
      setAlertType("failure");
      setTimeout(() => {
        setAlertMessage("");
        setAlertType("");
      }, 3000);
      return;
    }

    const data = {
      firstname,
      lastname,
      username,
      email,
      password,
    };
    try {
      const response = await axios.post(BACKEND_URL + `/user/signup`, data);
      if (response.status === 201) {
        setAlertMessage("signed up successfully!");
        setAlertType("success");
        setTimeout(() => {
          router.push("/signin");
        }, 1500);
      } else if (response.status == 200) {
        console.log(response);
        setAlertMessage(response.data.message);
        setAlertType("failure");
        setTimeout(() => {
          (setAlertMessage(""), setAlertType(""));
        }, 3000);
      }
    } catch (error) {
      setAlertMessage("Please try again.");
      setAlertType("failure");
      setTimeout(() => {
        (setAlertMessage(""), setAlertType(""));
      }, 3000);
      console.error(error);
    }
  };

  const emailRef = useRef<HTMLInputElement>(null);
  const FirstNameRef = useRef<HTMLInputElement>(null);
  const LastNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-svh">
      <Alert type={AlertType} message={AlertMessage}></Alert>
      <div className="w-full absolute">
        <Navbar />
      </div>
      <div
        className="w-screen h-full
                flex justify-center items-center
                bg-black
            "
      >
        <div
          className="flex flex-col w-80  p-2 ring-slate-600  
        shadow-slate-400/50 shadow-md ring-2 rounded-md"
        >
          <div className="text-gray-100 text-xl p-2   ">
            {isSignin ? "Signin" : "Signup"}
          </div>
          {!isSignin && (
            <Input
              ref={FirstNameRef}
              placeholder="First name"
              type="text"
            ></Input>
          )}
          {!isSignin && (
            <Input
              ref={LastNameRef}
              placeholder="Last name"
              type="text"
            ></Input>
          )}

          <Input ref={emailRef} placeholder={"Email"} type={"email"}></Input>

          {!isSignin && (
            <Input ref={usernameRef} placeholder="Username" type="text"></Input>
          )}

          <Input
            placeholder={"password"}
            ref={passwordRef}
            type={"password"}
          ></Input>

          <div
            className="w-full flex justify-end"
            onClick={() => {
              if (isSignin) {
                signinUser();
              } else {
                SignupUser();
              }
            }}
          >
            <div></div>
            <Button type={"primary"}> {isSignin ? "Signin" : "Signup"} </Button>
          </div>
          <div className="border-t border-white my-4"></div>
          <div
            className="text-gray-50  py-2 pl-2
          hover:bg-sky-300/10 rounded-lg  flex"
          >
            {isSignin ? "New to DrawIt ?" : "Already a user ?"}
            <div
              className="mx-2 text-amber-100"
              onClick={() => {
                if (isSignin) {
                  router.push("/signup");
                } else {
                  router.push("/signin");
                }
              }}
            >
              {isSignin ? "Signup" : "Signin"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
