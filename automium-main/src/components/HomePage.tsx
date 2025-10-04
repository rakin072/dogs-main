import React, { useState } from "react";
import { FiZap } from "react-icons/fi";
import Button from "./ui/Button";
import { FaTelegramPlane, FaWhatsapp, FaFacebookMessenger, FaLine, FaTwitter, FaLink } from "react-icons/fa";

// import Image from "next/image"
// import { Calendar, Zap } from "lucide-react"
// import { Button } from "@/components/ui/button"

const socialIcons = [
  { icon: <FaTelegramPlane size={24} />, color: "#0088cc", name: "telegram" },
  { icon: <FaWhatsapp size={24} />, color: "#25D366", name: "whatsapp" },
  { icon: <FaFacebookMessenger size={24} />, color: "#0084ff", name: "messenger" },
  { icon: <FaLine size={24} />, color: "#00B900", name: "line" },
  { icon: <FaTwitter size={24} />, color: "#1DA1F2", name: "twitter" },
  { icon: <FaLink size={24} />, color: "#6366f1", name: "link" },
];

export default function HomePage() {
  const [rotation, setRotation] = useState(0);
  const [balance] = useState(0.00008505);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [hashrate] = useState(3);
  const [displayHashrate, setDisplayHashrate] = useState(0);

  // Animate balance counter
  React.useEffect(() => {
    let start = 0;
    const end = balance;
    if (start === end) return;
    let current = start;
    const increment = (end - start) / 40;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayBalance(end);
        clearInterval(timer);
      } else {
        setDisplayBalance(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [balance]);

  // Animate hashrate counter
  React.useEffect(() => {
    let start = 0;
    const end = hashrate;
    if (start === end) return;
    let current = start;
    const increment = (end - start) / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayHashrate(end);
        clearInterval(timer);
      } else {
        setDisplayHashrate(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [hashrate]);

  // Rotate the fan continuously
  React.useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#1a1a2e] via-[#342B48] to-[#0f3460] animate-gradient-bg">
      {/* Animated Glowing Header */}
      <div className="w-full flex flex-col items-center mb-4 mt-2">
        <div className="relative flex flex-col items-center">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-300 rounded-full blur-2xl opacity-40 animate-pulse-slow z-0" />
          <img
            src="/logo.png"
            alt="Logo"
            width={80}
            height={80}
            className="z-10 w-20 h-20 rounded-full shadow-2xl border-4 border-white/20 animate-float"
          />
          <h1 className="z-10 mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#FEE9B3] via-[#FFD700] to-[#FFA500] animate-gradient-x drop-shadow-lg">
            Welcome to Atomium!
          </h1>
        </div>
      </div>

      {/* Animated Mining Fan */}
      <div className="relative flex items-center justify-center w-64 h-64 mt-4 mb-8">
        <div
          className="absolute w-full h-full drop-shadow-2xl animate-fan-glow"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.1s linear",
          }}
        >
          <img
            src="/fan.png"
            alt="Mining Fan"
            width={256}
            height={256}
            className="w-full h-full animate-spin-slow"
          />
        </div>
        <div className="absolute flex items-center justify-center w-20 h-20 bg-black/80 rounded-full shadow-xl border-4 border-yellow-400/30 animate-pulse">
          <img
            src="/logo.png"
            alt="Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
        </div>
      </div>

      {/* Animated Balance and Hashrate */}
      <div className="flex flex-col items-center mb-6">
        <div className="text-4xl font-extrabold text-white drop-shadow-lg animate-fade-in">
          {displayBalance.toFixed(8)} <span className="text-yellow-400">SOL</span>
        </div>
        <div className="flex items-center gap-2 mb-2 text-lg text-gray-300 animate-fade-in">
          Hashrate: <span className="text-blue-400 font-bold">{displayHashrate.toFixed(1)} GH/s</span>
          <FiZap className="text-yellow-400 animate-zap" size={20} />
        </div>
      </div>

      {/* Animated Action Buttons */}
      <div className="grid w-full grid-cols-2 gap-4 mb-8">
        <Button
          className="h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-bounce-short"
        >
          Claim
        </Button>
        <Button className="h-14 text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-yellow-500 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-bounce-short">
          Booster
        </Button>
      </div>

      {/* Invite Friends Card */}
      <div className="w-full max-w-xl mb-4 animate-fade-in-up">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl p-6 border border-yellow-400/20">
          <h2 className="mb-1 text-2xl font-bold text-white drop-shadow">Invite friends</h2>
          <p className="mb-4 text-gray-200">
            <span className="text-yellow-400 font-bold">+1000 $MSOL</span> for each friend you invite
          </p>
          <div className="grid grid-cols-6 gap-3">
            {socialIcons.map((platform) => (
              <button
                key={platform.name}
                className="flex items-center justify-center p-2 rounded-xl shadow-md hover:scale-110 hover:shadow-xl transition-all duration-200"
                style={{ background: platform.color }}
              >
                <span className="text-white animate-social-pop">{platform.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Animated Gradient Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-yellow-900/30 to-transparent blur-2xl animate-bg-fade" />
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-tl from-orange-700/30 to-transparent blur-2xl animate-bg-fade" />
      </div>
    </div>
  );
}
