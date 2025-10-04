import React, { useEffect, useRef, useState } from "react";
import { useTonAddress } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";
import { FaUserFriends } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { SiTask } from "react-icons/si";
import { RiWallet3Line } from "react-icons/ri";

import "./App.css";
import FriendsPage from "./Friends";
import Leaderboard from "./Leaderboard";
import LoadingScreen from "./LoadingScreen";
import Modal from "./Modal";
import OverlayPage from "./overlaypage";
import { useUser } from "./UserContext";
import Airdrop from "./Airdrop";
import ClaimAnimation from "./components/ClaimAnimation";
import Header from "./components/Header";
import TasksPage from "./Tasks";
import TapSection from "./components/TapSection";
import {  logo } from "./images";
import DailyRewardModal from "./components/DailyReward";
import LeagueSlider from "./components/LeagueSlider";

declare const Telegram: any;

/* ───────── helpers ───────── */

const isSameDay = (t1: number, t2: number) => {
  const d1 = new Date(t1 * 1000);
  const d2 = new Date(t2 * 1000);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/* ───────── component ───────── */

const App: React.FC = () => {
  const { points, setPoints, userID, setUserID, setWalletAddress, setTrd } =
    useUser();

  const address = useTonAddress();

  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<{
    [key: string]: "not_started" | "loading" | "claimable" | "completed";
  }>({});
  const [refertotal, setRefertotal] = useState<number>(0);

  const [showOverlayPage, setShowOverlayPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [userAdded, setUserAdded] = useState(false);

  const [dailyRewardAvailable, setDailyRewardAvailable] =
    useState<boolean>(false);

  /* UI state */
  const [showDailyLogin, setShowDailyLogin] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const claimButtonRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  const [lastSavedPoints, setLastSavedPoints] = useState<number>(points);

  const closeModal = () => setModalMessage(null);
  const closeOverlay = () => setShowOverlayPage(false);
  const showAlert = (msg: string) => setModalMessage(msg);

  /* use setShowAnimation once → no TS 6133 */
  useEffect(() => {
    // reset any leftover animation when user switches pages
    if (activePage !== "home" && showAnimation) setShowAnimation(false);
  }, [activePage, showAnimation]);

  /* ───── daily‑tap refill ───── */

  const refillDailyLimit = async (userid: string) => {
    const initData = window.Telegram.WebApp.initData || "";
    const now = Math.floor(Date.now() / 1000);
    await fetch("https://frontend.goldenfrog.live/update_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Telegram-Init-Data": initData
      },
      body: JSON.stringify({
        UserId: userid,
        dailycombotime: now.toString(),
        claimedtotal: "0"
      })
    });
    setTrd(0);
  };

  /* ───── save lifetime points ───── */

  const savePoints = async () => {
    if (!userID) return;
    const initData = window.Telegram.WebApp.initData || "";
    try {
      await fetch("https://frontend.goldenfrog.live/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ UserId: userID, totalgot: points })
      });
      setLastSavedPoints(points);
    } catch (err) {
      console.error("Failed to save points:", err);
      showAlert("Failed to save points. Please check your connection.");
    }
  };

  useEffect(() => {
    if (points !== lastSavedPoints) savePoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  /* ───── wallet address sync ───── */

  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  /* ───── Telegram init ───── */

  useEffect(() => {
    const initTg = async () => {
      try {
        if (typeof Telegram === "undefined" || !Telegram.WebApp) {
          showAlert("Telegram WebApp is not available. Open inside Telegram.");
          setLoading(false);
          return;
        }

        Telegram.WebApp.ready();
        const unsafe = Telegram.WebApp.initDataUnsafe;
        if (!unsafe?.user) throw new Error("Incomplete Telegram initData.");

        const tgUserId = unsafe.user.id?.toString();
        if (!tgUserId) throw new Error("User ID missing.");

        const username = unsafe.user.username || "Default Username";
        const startparam = unsafe.start_param || "";

        setUserID(tgUserId);
        await fetchOrAddUser(tgUserId, startparam, username);
      } catch (err) {
        console.error("Init error:", err);
        showAlert("Failed to initialize user. Please refresh and try again.");
        setLoading(false);
      }
    };

    initTg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───── fetch OR add user ───── */

  const fetchOrAddUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    try {
      const initData = window.Telegram.WebApp.initData || "";
      const res = await fetch(
        `https://frontend.goldenfrog.live/get_user?UserId=${userid}`,
        { headers: { "X-Telegram-Init-Data": initData } }
      );

      if (res.ok) {
        const data = await res.json();
        await loadPoints(userid, data);
        loadTaskStatus(data);
        setShowOverlayPage(false);
        setUserAdded(false);
      } else if (res.status === 404) {
        await addUser(userid, startparam, username);
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (err) {
      console.error("fetchOrAddUser error:", err);
      showAlert("Cannot fetch user data. Please try again.");
      setLoading(false);
    }
  };

  const addUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    const invitedBy = !startparam || userid === startparam ? null : startparam;
    const initData = window.Telegram.WebApp.initData || "";

    try {
      const res = await fetch("https://frontend.goldenfrog.live/add_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({
          UserId: userid,
          invitedby: invitedBy || undefined,
          Username: username
        })
      });

      if (!res.ok) throw new Error(`Failed to add user: ${res.status}`);

      setUserAdded(true);
      setShowOverlayPage(true);
      setLoading(false);
    } catch (err) {
      console.error("addUser error:", err);
      showAlert("Failed to add user. Check your connection.");
      setLoading(false);
    }
  };

  /* ───── load points + taps ───── */

  const loadPoints = async (userid: string, dataFromFetch?: any) => {
    try {
      const data =
        dataFromFetch ||
        (await (
          await fetch(
            `https://frontend.goldenfrog.live/get_user?UserId=${userid}`,
            {
              headers: {
                "X-Telegram-Init-Data": window.Telegram.WebApp.initData || ""
              }
            }
          )
        ).json());

      if (!(data && data.data)) return;

      const got = parseInt(data.data.totalgot, 10) || 0;
      setPoints(got);
      setLastSavedPoints(got);

      const claimed = parseInt(data.data.claimedtotal, 10) || 0;
      setTrd(claimed);

      const storedTime = parseInt(data.data.dailycombotime || "0", 10);
      const now = Math.floor(Date.now() / 1000);

      if (!storedTime) await refillDailyLimit(userid);
      else if (!isSameDay(storedTime, now)) await refillDailyLimit(userid);
    } catch (err) {
      console.error("loadPoints error:", err);
      showAlert("Failed to load points. Please check your connection.");
    }
  };

  /* ───── task status loader ───── */

  const loadTaskStatus = (data: any) => {
    const updatedTaskStatus: { [key: string]: "not_started" | "completed" } = {
      task1: data.data.task1 === "Done" ? "completed" : "not_started",
      task2: data.data.task2 === "Done" ? "completed" : "not_started",
      task7: data.data.task7 === "Done" ? "completed" : "not_started",
      task14: data.data.task14 === "Done" ? "completed" : "not_started",
      task15: data.data.task15 === "Done" ? "completed" : "not_started",
      task16: data.data.task16 === "Done" ? "completed" : "not_started",
      task17: data.data.task17 === "Done" ? "completed" : "not_started",
      task18: data.data.task18 === "Done" ? "completed" : "not_started",
      task19: data.data.task19 === "Done" ? "completed" : "not_started",
      task20: data.data.task20 === "Done" ? "completed" : "not_started",
      task21: data.data.task21 === "Done" ? "completed" : "not_started",
      task22: data.data.task22 === "Done" ? "completed" : "not_started",
      task10: data.data.task10 === "Done" ? "completed" : "not_started",
      task11: data.data.task11 === "Done" ? "completed" : "not_started",
      task12: data.data.task12 === "Done" ? "completed" : "not_started"
    };
    setTaskStatus((prev) => ({ ...prev, ...updatedTaskStatus }));

    const referrals = parseInt(data.data.referrewarded, 10);
    setRefertotal(isNaN(referrals) ? 0 : referrals);
  };

  /* ───── daily reward status ───── */

  const checkDailyRewardStatus = async () => {
    try {
      const initData = window.Telegram.WebApp.initData || "";
      const res = await fetch("https://frontend.goldenfrog.live/gamer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ GamerId: userID })
      });
      if (!res.ok) {
        setDailyRewardAvailable(false);
        return;
      }
      const data = await res.json();
      const startime = data.data.startime;
      const now = Math.floor(Date.now() / 1000);

      if (!startime) setDailyRewardAvailable(true);
      else setDailyRewardAvailable(!isSameDay(startime, now));
    } catch (err) {
      console.error("daily reward error:", err);
      setDailyRewardAvailable(false);
    }
  };

  /* ───── preload ───── */

  useEffect(() => {
    const preload = async () => {
      if (userID) {
        await loadPoints(userID);
        await checkDailyRewardStatus();
        setTimeout(() => setLoading(false), 2000);
      } else {
        setLoading(false);
      }
    };
    preload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID, showOverlayPage, dailyRewardAvailable]);

  /* ───── UI helper ───── */

  const toggleDailyLogin = () => setShowDailyLogin((v) => !v);

  /* ───── render ───── */

  return (
    <div className="telegram-webapp-container relative flex justify-center overflow-hidden">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          <div className="relative w-full max-w-xl font-bold text-white z-50">
            {activePage === "home" && (
              <div className="flex flex-col h-full max-h-full overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent z-0" />
                <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-blue-900/20 to-transparent z-0" />
                <div className="bg-[#1A1A1C] flex-shrink-0">
                  <Header
                    setActivePage={setActivePage}
                    address={address}
                  />
                </div>

                <main className="flex-1 flex flex-col justify-center items-center bg-[#1A1A1C] pb-[70px] overflow-hidden px-2">
                  <TapSection toggleDailyLogin={toggleDailyLogin}/>
                  
                </main>

                {showDailyLogin && (
                  <DailyRewardModal onClose={() => setShowDailyLogin(false)} />
                )}
                {showAnimation && (
                  <ClaimAnimation
                    trigger={showAnimation}
                    buttonRef={claimButtonRef}
                    targetRef={targetRef}
                  />
                )}
              </div>
            )}

            {activePage === "leaderboard" && <Leaderboard />}
            {activePage === "tasks" && (
              <TasksPage
                taskStatus={taskStatus}
                setTaskStatus={setTaskStatus}
                refertotal={refertotal}
                setRefertotal={setRefertotal}
              />
            )}
            {activePage === "friends" && <FriendsPage />}
            {activePage === "wallet" && <Airdrop />}
            {activePage === "league" && <LeagueSlider />}
          </div>

          {/* navbar */}
          {activePage !== "game" && (
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-xl rounded-t-2xl bg-[#342B48] flex justify-around items-center z-50 text-xs border-t border-black/15">
              <div
                className={`nav-item flex flex-col items-center ${
                  activePage === "tasks" ? "text-[#FEE9B3]" : "text-[#a7a5a5]"
                } w-1/4 p-3 transition-colors duration-300`}
                onClick={() => setActivePage("tasks")}
              >
                <SiTask size={20} />
                <p className="text-xs">Tasks</p>
              </div>

              <div
                className={`nav-item flex flex-col items-center ${
                  activePage === "leaderboard"
                    ? "text-[#FEE9B3]"
                    : "text-[#a7a5a5]"
                } w-1/4 p-3 transition-colors duration-300`}
                onClick={() => setActivePage("leaderboard")}
              >
                <FaRankingStar size={20} />
                <p className="text-xs">Leaderboard</p>
              </div>

              <div
                className={`relative nav-item flex flex-col items-center ${
                  activePage === "home"
                    ? "text-[#FEE9B3] opacity-100"
                    : "text-[#a7a5a5] opacity-80"
                } w-1/4 p-3 transition-colors duration-300`}
                onClick={() => setActivePage("home")}
              >
                <img src={logo} alt="tap" />
              </div>

              <div
                className={`nav-item flex flex-col items-center ${
                  activePage === "friends" ? "text-[#FEE9B3]" : "text-[#a7a5a5]"
                } w-1/4 p-3 transition-colors duration-300`}
                onClick={() => setActivePage("friends")}
              >
                <FaUserFriends size={20} />
                <p className="text-xs">Friends</p>
              </div>

              <div
                className={`nav-item flex flex-col items-center ${
                  activePage === "wallet" ? "text-[#FEE9B3]" : "text-[#a7a5a5]"
                } w-1/4 p-3 transition-colors duration-300`}
                onClick={() => setActivePage("wallet")}
              >
                <RiWallet3Line size={20} />
                <p className="text-xs">Wallet</p>
              </div>
            </div>
          )}

          {showOverlayPage && (
            <OverlayPage closeOverlay={closeOverlay} userAdded={userAdded} />
          )}

          {modalMessage && (
            <Modal message={modalMessage} onClose={closeModal} />
          )}
          <Toaster />
        </>
      )}
    </div>
  );
};

export default App;
