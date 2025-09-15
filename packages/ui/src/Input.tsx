import React, { forwardRef } from "react";

type InputProps = {
  placeholder: string;
  type: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ placeholder, type }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className="p-2 m-1 bg-blue-100 text-black rounded-md"
      />
    );
  }
);

// Optional but recommended: give the component a display name for debugging
Input.displayName = "Input";

export default Input;
