import { useState, useEffect, useRef } from "react";
import { spinner } from "../images";

const Spinner = () => {
  const [rotationSpeed, setRotationSpeed] = useState<number>(5); 
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const spinnerRef = useRef<HTMLDivElement | null>(null);

  // Detect touch events
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    const touchDiff = touchStartY - touch.clientY;

    // If swipe down (negative difference), increase speed
    if (touchDiff > 30) {
      setRotationSpeed((prevSpeed) => Math.max(1, prevSpeed + 1));
    }
    // If swipe up (positive difference), decrease speed
    if (touchDiff < -30) {
      setRotationSpeed((prevSpeed) => Math.max(1, prevSpeed - 1));
    }
  };

  // Reset speed when touch ends
  const handleTouchEnd = () => {
    setTouchStartY(0);
  };

  // Add touch event listeners
  useEffect(() => {
    const spinnerElement = spinnerRef.current;

    if (spinnerElement) {
      // Using native TouchEvent instead of React's synthetic event
      spinnerElement.addEventListener(
        "touchstart",
        handleTouchStart as EventListener
      );
      spinnerElement.addEventListener(
        "touchmove",
        handleTouchMove as EventListener
      );
      spinnerElement.addEventListener(
        "touchend",
        handleTouchEnd as EventListener
      );
    }

    return () => {
      if (spinnerElement) {
        spinnerElement.removeEventListener(
          "touchstart",
          handleTouchStart as EventListener
        );
        spinnerElement.removeEventListener(
          "touchmove",
          handleTouchMove as EventListener
        );
        spinnerElement.removeEventListener(
          "touchend",
          handleTouchEnd as EventListener
        );
      }
    };
  }, [touchStartY]);

  return (
    <div
      ref={spinnerRef}
      className="absolute w-full h-full"
      style={{
        animation: `spin ${rotationSpeed}s linear infinite`
      }}
    >
      <img src={spinner} alt="Mining Fan" className="w-full h-full" />
    </div>
  );
};

export default Spinner;
