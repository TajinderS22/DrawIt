import { LineChart } from "lucide-react";
import { ReactNode } from "react";

const IconButton = ({
  icon,
  onClick,
  activated,
  title,
}: {
  icon: ReactNode;
  onClick?: () => void;
  activated: boolean;
  title?: string;
}) => {
  return (
    <div
      className={`pointer  bg-[#242424]  hover:bg-[#343434] hover:animate-pulse rounded-md  p-2 m-1 mx-2
                ${activated ? "text-amber-700" : "text-white"}
            
            `}
      onClick={onClick}
      title={title}
    >
      {icon}
    </div>
  );
};

export default IconButton;
