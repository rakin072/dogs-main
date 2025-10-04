// DailyLoginModal.tsx
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { HiMiniXMark } from "react-icons/hi2";
import Button from "./ui/Button";
import { logo } from "../images";
import { useUser } from "../UserContext";

interface DailyRewardModalProps {
  onClose: () => void;
}

/* static reward table */
const days = [
  { day: 1, reward: 100 },
  { day: 2, reward: 200 },
  { day: 3, reward: 300 },
  { day: 4, reward: 400 },
  { day: 5, reward: 500 },
  { day: 6, reward: 600 },
  { day: 7, reward: 10_000 },
];

export default function DailyRewardModal({ onClose }: DailyRewardModalProps) {
  const { userID, setPoints } = useUser();

  /* local state */
  const [activeDay, setActiveDay] = useState(1); // which box is highlighted
  const [canClaim, setCanClaim] = useState(false); // claim-button enabled?
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalGot, setTotalGot] = useState<number>(0); // current balance from DB

  /* ------------------------------------------------------------------ */
  /* 1)  INITIAL FETCH – pull user info and decide UI state              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!userID) return;

    const fetchUserData = async () => {
      try {
        const initData = window.Telegram.WebApp.initData || "";
        const res = await fetch(
          `https://frontend.goldenfrog.live/get_user?UserId=${userID}`,
          { headers: { "X-Telegram-Init-Data": initData } }
        );

        if (!res.ok) throw new Error("Failed to fetch user data");

        const { data } = await res.json();
        const lastTimeRaw = data?.dailyclaimedtime ?? null; // Unix s or null/0
        const streakRaw = data?.alreadydailyclaimed ?? "0"; // string | number
        const pointsRaw = data?.totalgot ?? 0;

        const lastTime = parseInt(lastTimeRaw ?? "0", 10) || 0;
        const streak = parseInt(streakRaw ?? "0", 10) || 0;
        const points = parseInt(pointsRaw ?? "0", 10) || 0;

        setTotalGot(points);

        /* ---------- first-time user ---------- */
        if (lastTime === 0) {
          setActiveDay(1);
          setCanClaim(true);
          setIsLoading(false);
          return;
        }

        /* ---------- compare calendar days (UTC) ---------- */
        const now = new Date(); // js Date (ms)
        const last = new Date(lastTime * 1000); // convert to ms

        // midnight UTC for both dates
        const utcMidnight = (d: Date) =>
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

        const diffDays =
          (utcMidnight(now) - utcMidnight(last)) / (24 * 60 * 60 * 1000);

        if (diffDays === 0) {
          // same calendar day → already claimed
          setActiveDay(streak === 0 ? 1 : streak);
          setCanClaim(false);
          setErrorMessage("Already claimed today's reward!");
        } else if (diffDays === 1) {
          // exactly next calendar day → continue streak
          let next = streak + 1;
          if (next > 7) next = 1; // loop after day 7
          setActiveDay(next);
          setCanClaim(true);
        } else {
          // gap >1 day → streak broken
          setActiveDay(1);
          setCanClaim(true);
          setErrorMessage("Daily streak broken – starting over from Day 1");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load daily rewards");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userID]);

  /* ------------------------------------------------------------------ */
  /* 2)  CLAIM HANDLER                                                  */
  /* ------------------------------------------------------------------ */
  const handleClaim = async () => {
    if (!canClaim || isLoading) return;

    try {
      const reward = days[activeDay - 1].reward;
      const newTotal = totalGot + reward;
      const nowUnix = Math.floor(Date.now() / 1000);
      const newStreakStored = activeDay === 7 ? 0 : activeDay; // reset after day 7

      const initData = window.Telegram.WebApp.initData || "";
      const res = await fetch("https://frontend.goldenfrog.live/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify({
          UserId: userID,
          totalgot: newTotal.toString(),
          dailyclaimedtime: nowUnix.toString(),
          alreadydailyclaimed: newStreakStored.toString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to update user data");

      /* success – update UI & global points */
      setTotalGot(newTotal);
      setPoints(newTotal);
      setCanClaim(false);
      setErrorMessage("Reward claimed successfully!");

      // close modal after brief success message
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to claim reward – please try again");
    }
  };

  /* ------------------------------------------------------------------ */
  /* 3)  RENDER                                                         */
  /* ------------------------------------------------------------------ */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-[2px] font-roboto">
      <div className="px-4 w-full">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-normal">Daily Rewards</h2>
          <button onClick={onClose} className="text-gray-500">
            <HiMiniXMark size={34} className="text-white" />
          </button>
        </div>

        {/* messages */}
        {errorMessage && (
          <div
            className={`text-center mb-4 ${
              errorMessage.includes("success")
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {errorMessage}
          </div>
        )}

        {/* Day 1-6 grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {days.slice(0, 6).map(({ day, reward }) => (
            <div
              key={day}
              className={`flex flex-col items-center justify-center p-4 border rounded-lg ${
                day === activeDay
                  ? "bg-purple-500/25 backdrop-blur-sm text-white border-[#7B4B84]"
                  : day < activeDay
                  ? "border-[#7B4B84]"
                  : "border-[#1B2735]/90"
              }`}
            >
              <div className="mb-1 text-[14px] font-normal flex gap-1">
                <p>Day&nbsp;{day}</p>
                {day < activeDay && (
                  <FaCheck className="mt-[3px] text-[13px]" />
                )}
              </div>
              <div className="flex items-center text-[18px] font-normal">
                +{reward}
                <img
                  src={logo}
                  alt="Daily Reward"
                  className="ml-1 h-[22px] w-[22px] rounded-full -mt-1"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Day 7 row */}
        <div
          className={`flex flex-col items-center justify-center p-4 mb-6 border rounded-lg ${
            7 === activeDay
              ? "bg-purple-500/25 text-white border-[#7B4B84]"
              : 7 < activeDay
              ? "border-[#7B4B84]"
              : "border-[#1B2735]/90"
          }`}
        >
          <div className="mb-1">Day&nbsp;7</div>
          <div className="flex items-center">
            +{days[6].reward}
            <img
              src={logo}
              alt="Daily Reward"
              className="ml-1 h-[22px] w-[22px] rounded-full -mt-1"
            />
          </div>
        </div>

        {/* claim button */}
        <Button
          onClick={handleClaim}
          disabled={!canClaim || isLoading}
          className={`w-full h-12 !text-[18px] ${
            canClaim
              ? "bg-[#BF5AD2] hover:bg-purple-700"
              : "bg-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading
            ? "Loading…"
            : canClaim
            ? "Claim reward"
            : "Already claimed"}
        </Button>
      </div>
    </div>
  );
}
