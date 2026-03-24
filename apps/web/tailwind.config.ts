module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    "bg-white",
    "bg-red-500",
    "bg-green-300",
    "text-black",
    "text-white",
    "p-2",
    "m-1",
    "rounded-md",
    "max-w-[400px]",
    "bg-blue-100",
    "bg-red-200",
    "bg-green-200",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
