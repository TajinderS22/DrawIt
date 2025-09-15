"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  type: 'primary'|"secondary"|"tertiary";
  
}

const classNames: any = {
  primary: "bg-green-300 rounded-md max-w-[400px] p-2 m-1 dark:bg-green-600 text-black dark:text-white",
  secondary: "bg-white p-2  max-w-[400px] m-1 text-black dark:bg-gray-700 dark:text-white border border-white",
  tertiary: "bg-transparent max-w-[400px]  p-2 m-1 text-blue-500"
}



export const Button = ({ children,type}: ButtonProps) => {
  

  return (
    <button
      className={classNames[type]}
      onClick={() => {
        
      }}
    >
      {children}
    </button>
  );
};
