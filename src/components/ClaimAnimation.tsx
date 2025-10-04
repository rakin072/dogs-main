import { useState, useEffect } from "react";
import { trdLogo } from "../images";

interface ClaimAnimationProps {
  trigger: boolean;
  targetRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function ClaimAnimation({
  trigger,
  targetRef,
  buttonRef
}: ClaimAnimationProps) {
  const [coins, setCoins] = useState<
    {
      id: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      size: number;
      delay: number;
    }[]
  >([]);

  useEffect(() => {
    if (trigger && buttonRef.current && targetRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const targetRect = targetRef.current.getBoundingClientRect();

      const startX = buttonRect.left + buttonRect.width / 2;
      const startY = buttonRect.top + buttonRect.height / 2;

      const endX = targetRect.left + targetRect.width / 2;
      const endY = targetRect.top + targetRect.height / 2;

      const newCoins = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        startX,
        startY,
        endX: endX + (Math.random() * 20 - 10), 
        endY: endY + (Math.random() * 20 - 10),
        size: Math.random() * 10 + 20,
        delay: i * (Math.random() * 100 + 100) 
      }));

      setCoins(newCoins);
    }
  }, [trigger, buttonRef, targetRef]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {coins.map((coin) => (
        <FlyingCoin key={coin.id} {...coin} />
      ))}
    </div>
  );
}

interface FlyingCoinProps {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  delay: number;
}

function FlyingCoin({
  startX,
  startY,
  endX,
  endY,
  size,
  delay
}: FlyingCoinProps) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="absolute transition-all duration-[1200ms] ease-in-out"
      style={{
        left: `${started ? endX : startX}px`,
        top: `${started ? endY : startY}px`,
        width: `${size}px`,
        height: `${size}px`,
        transform: "translate(-50%, -50%) scale(1)",
        opacity: started ? 0 : 0.9,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)" // smoother
      }}
    >
      <img
        src={trdLogo}
        alt="Coin"
        width={size}
        height={size}
        className="rounded-full"
      />
    </div>
  );
}
