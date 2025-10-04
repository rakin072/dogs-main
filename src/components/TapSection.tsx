import { useState } from "react";
import { toast } from "react-hot-toast";
import { useUser } from "../UserContext";
import { dailyReward, logo } from "../images";

interface TapEffect {
  id: number;
  x: number;
  y: number;
}

interface TapSectionProps {
  toggleDailyLogin: () => void;
}

export default function TapSection({ toggleDailyLogin }: TapSectionProps) {
  const { points, setPoints, trd, setTrd, userID } = useUser();
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [nextId, setNextId] = useState(0);
  const [tapStyle, setTapStyle] = useState({});

  /* ────────────────────────── helpers ────────────────────────── */

  // fire‑and‑forget write‑through so UI stays instant
  const sendTapToBackend = async (
    newPoints: number,
    newClaimedTotal: number
  ) => {
    if (!userID) return;
    const initData = window.Telegram?.WebApp?.initData ?? "";
    try {
      await fetch("https://frontend.goldenfrog.live/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({
          UserId: userID,
          totalgot: newPoints,
          claimedtotal: newClaimedTotal
        })
      });
    } catch (err) {
      console.error("Tap sync failed:", err);
    }
  };

  /* ────────────────────────── tap handler ────────────────────────── */

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (trd >= 1000) {
      toast.error("Daily tap limit reached!");
      return;
    }

    /* tilt effect -------------------------------------------------- */
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = ((x - centerX) / centerX) * 20;
    const rotateX = ((centerY - y) / centerY) * 20;

    setTapStyle({
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`,
      boxShadow: "0 0 32px 8px rgba(236, 72, 153, 0.8), 0 0 64px 16px rgba(168, 85, 247, 0.6), 0 0 80px 20px rgba(249, 115, 22, 0.4)",
      transition: "transform 120ms cubic-bezier(.4,2,.6,1), box-shadow 200ms"
    });
    setTimeout(
      () =>
        setTapStyle({
          transform: "rotateX(0deg) rotateY(0deg) scale(1)",
          boxShadow: "0 0 16px 4px rgba(236, 72, 153, 0.6), 0 0 32px 8px rgba(168, 85, 247, 0.4), 0 0 40px 10px rgba(249, 115, 22, 0.2)",
          transition: "transform 200ms cubic-bezier(.4,2,.6,1), box-shadow 300ms"
        }),
      120
    );

    /* local state -------------------------------------------------- */
    const newPoints = points + 1;
    const newClaimedTotal = trd + 1;
    setPoints(newPoints);
    setTrd(newClaimedTotal);

    /* backend write‑through --------------------------------------- */
    sendTapToBackend(newPoints, newClaimedTotal);

    /* floating "+1" ----------------------------------------------- */
    const id = nextId;
    setNextId(id + 1);
    setTapEffects((prev) => [...prev, { id, x, y }]);
    setTimeout(
      () => setTapEffects((prev) => prev.filter((eff) => eff.id !== id)),
      900
    );
  };

  /* ────────────────────────── render ────────────────────────── */

  const tapsRemaining = 1000 - trd;
  const barPct = (tapsRemaining / 1000) * 100;

  return (
    <div className="tap-section-container flex flex-col gap-3 justify-center items-center w-full h-full px-4 animate-fade-in-up">
      {/* ATM Balance - Enhanced with New Color Grading */}
      <div className="flex items-center justify-center relative gap-3">
        <div className="h-[48px] w-[48px] rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-400 to-orange-400 shadow-2xl shadow-purple-900/50 relative overflow-hidden group">
          {/* Animated glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          <img
            src={logo}
            alt="ATM Token"
            className="h-[44px] w-[44px] object-cover rounded-full relative z-10 drop-shadow-lg"
          />
        </div>
        <div className="flex items-center text-white text-[36px] font-extrabold rounded-full shadow-lg relative">
          <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-orange-300 bg-clip-text text-transparent drop-shadow-md">
            {Math.floor(points).toLocaleString()}
          </span>
          <span className="text-[30px] bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent ml-2 font-bold drop-shadow-md">ATM</span>
        </div>
      </div>

      {/* Tap Area - Enhanced with New Color Grading */}
      <div
        className="tap-area relative w-full max-w-xs mt-4 rounded-full perspective-[800px] group"
        onClick={handleTap}
      >
        <div className="absolute inset-0 z-0 rounded-full bg-gradient-to-br from-purple-500/40 via-pink-400/30 to-orange-400/30 blur-xl group-hover:blur-2xl transition-all duration-300 animate-tap-glow" />
        <img
          src={logo}
          alt="Token"
          style={tapStyle}
          className="w-full h-auto rounded-full border-4 border-pink-300 shadow-2xl cursor-pointer select-none transition-all duration-200 animate-tap-pop relative z-10"
        />
        {tapEffects.map((eff) => (
          <span
            key={eff.id}
            className="absolute text-pink-400 font-extrabold text-[38px] animate-float pointer-events-none drop-shadow-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            style={{ left: eff.x, top: eff.y }}
          >
            +1
          </span>
        ))}
      </div>

      {/* Enhanced Progress Bar with New Color Grading */}
      <div className="progress-section flex flex-col gap-1 items-center w-full px-3">
        <div className="flex items-center gap-2 w-full max-w-[400px] px-3 py-2 bg-gray-900/80 rounded-full border-2 border-pink-300/40 shadow-lg animate-fade-in relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-400/20 to-orange-400/20 rounded-full"></div>
          <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400 transition-all duration-500 animate-progress-shine relative"
              style={{ width: `${barPct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-shimmer"></div>
            </div>
          </div>
          <span className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent min-w-[70px] text-center drop-shadow-md">
            {tapsRemaining}/1000
          </span>
        </div>

        {/* Daily Reward Button - Enhanced Colors & Effects */}
        <div className="w-full max-w-[400px] relative active:scale-95 transition-transform animate-fade-in-up">
          <button
            onClick={toggleDailyLogin}
            className="daily-reward-button w-full py-4 px-4 text-white flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-xl border-2 border-pink-300/60 shadow-2xl shadow-purple-900/50 font-bold text-lg hover:scale-105 hover:shadow-3xl hover:shadow-pink-900/60 transition-all duration-300 relative overflow-hidden group"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            
            {/* Shimmer effect */}
            <div className="daily-reward-shimmer absolute inset-0 -top-2 -left-2 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-xl"></div>
            
            <div className="flex items-center gap-2 relative z-10">
              <img
                src={dailyReward}
                className="w-9 h-9 animate-reward-pop drop-shadow-lg"
                alt="Daily Reward"
              />
              <span className="font-bold text-lg drop-shadow-md">Daily Reward</span>
              <div className="flex items-center">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-gradient-to-br from-pink-500 to-orange-500 text-sm items-center justify-center font-bold shadow-lg"></span>
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
