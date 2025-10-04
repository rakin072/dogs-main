import React from "react";
import { logo, loadingImage } from "./images";

const LoadingScreen: React.FC = () => {
  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${loadingImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Logo */}
        <div className="mb-8">
          <img
            src={logo}
            alt="Token Logo"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl"
          />
        </div>

        {/* Modern Spinning Loading Animation */}
        <div className="relative mb-6">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-transparent border-t-white border-r-purple-400 rounded-full animate-spin"></div>
          
          {/* Inner spinning ring */}
          <div className="absolute top-1 left-1 w-14 h-14 md:w-18 md:h-18 border-4 border-transparent border-t-blue-400 border-r-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 animate-pulse">
            Loading...
          </h1>
          <p className="text-white/80 text-sm md:text-base">
            Please wait while we prepare your experience
          </p>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-pink-400/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
