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
      boxShadow: "0 0 32px 8px #fbbf24, 0 0 64px 16px #a78bfa",
      transition: "transform 120ms cubic-bezier(.4,2,.6,1), box-shadow 200ms"
    });
    setTimeout(
      () =>
        setTapStyle({
          transform: "rotateX(0deg) rotateY(0deg) scale(1)",
          boxShadow: "0 0 16px 4px #fbbf24, 0 0 32px 8px #a78bfa",
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
    <div className="flex flex-col gap-7 justify-between py-7 items-center w-full h-full animate-fade-in-up">
      {/* ATM Balance - No Animation */}
      <div className="flex items-center justify-center relative gap-3">
        <div className="h-[48px] w-[48px] rounded-full flex items-center justify-center bg-gradient-to-br to-[#FEE9B3] via-[#342B48] from-[#FEE9B3] shadow-xl">
          <img
            src={logo}
            alt="ATM Token"
            className="h-[44px] w-[44px] object-cover rounded-full"
          />
        </div>
        <div className="flex items-center text-white text-[36px] font-extrabold rounded-full shadow-lg">
          {Math.floor(points).toLocaleString()}
          <span className="text-[30px] text-yellow-300 ml-2 font-bold">ATM</span>
        </div>
      </div>

      {/* Tap Area - Animated, Glowing, Pulsing */}
      <div
        className="relative w-full max-w-xs mt-6 rounded-full perspective-[800px] group"
        onClick={handleTap}
      >
        <div className="absolute inset-0 z-0 rounded-full bg-gradient-to-br from-yellow-400/30 via-orange-400/20 to-yellow-400/20 blur-xl group-hover:blur-2xl transition-all duration-300 animate-tap-glow" />
        <img
          src={logo}
          alt="Token"
          style={tapStyle}
          className="w-full h-auto rounded-full border-4 border-yellow-300 shadow-2xl cursor-pointer select-none transition-all duration-200 animate-tap-pop"
        />
        {tapEffects.map((eff) => (
          <span
            key={eff.id}
            className="absolute text-yellow-300 font-extrabold text-[38px] animate-float pointer-events-none drop-shadow-lg"
            style={{ left: eff.x, top: eff.y }}
          >
            +1
          </span>
        ))}
      </div>

      {/* Animated Progress Bar */}
      <div className="flex flex-col gap-2 items-center w-full px-3">
        <div className="flex items-center gap-2 w-full max-w-[400px] px-3 py-2 bg-gray-900/80 rounded-full border-2 border-yellow-300/40 shadow-lg animate-fade-in">
          <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 transition-all duration-500 animate-progress-shine"
              style={{ width: `${barPct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
          <span className="text-base font-bold text-yellow-300 min-w-[70px] text-center">
            {tapsRemaining}/1000
          </span>
        </div>

        {/* Daily Reward Button - Updated Colors */}
        <div className="w-full max-w-[400px] relative active:scale-95 transition-transform animate-fade-in-up">
          <button
            onClick={toggleDailyLogin}
            className="w-full py-4 px-4 text-white flex items-center justify-center bg-gradient-to-br from-blue-600 to-yellow-600 rounded-xl border-2 border-yellow-300/40 shadow-xl shadow-blue-900/30 font-bold text-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 animate-bounce-short"
          >
            <div className="flex items-center gap-2">
              <img
                src={dailyReward}
                className="w-9 h-9 animate-reward-pop"
                alt="Daily Reward"
              />
              <span className="font-bold text-lg">Daily Reward</span>
              <div className="flex items-center">
                <span className="relative flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-yellow-500 text-sm items-center justify-center font-bold"></span>
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
