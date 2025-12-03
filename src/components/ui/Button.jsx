import React from 'react';

const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const baseStyle = "w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm flex items-center justify-center gap-2 text-sm";
  const variants = {
    primary: "bg-gradient-to-r from-[#ff7f00] to-[#ff9933] hover:from-[#e67300] hover:to-[#e68a00] text-white focus:ring-orange-500",
    secondary: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:ring-gray-200",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 focus:ring-red-500",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;