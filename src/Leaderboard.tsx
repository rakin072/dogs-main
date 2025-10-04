/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useUser } from "./UserContext";
import { FaTrophy, FaCrown, FaUsers, FaChevronUp } from "react-icons/fa";
import { img3 } from "./images";

import medal1 from "./images/medal1.png";
import medal2 from "./images/medal2.png";
import medal3 from "./images/medal3.png";

// Define the fixed color sequence for the first 10 users
const fixedColors = [
  "#2ECC71", // Green
  "#9B59B6", // Purple
  "#8B4513", // Brown
  "#E74C3C", // Red
  "#000000", // Black
  "#2ECC71", // Green
  "#9B59B6", // Purple
  "#8B4513", // Brown
  "#E74C3C", // Red
  "#000000" // Black
];

// Define the color for all other users
const defaultColor = "#FDF1B6";

const LeaderboardPage: React.FC = () => {
  const { userID } = useUser();

  const [ownRanking, setOwnRanking] = useState({
    username: "",
    totalgot: 0,
    position: 0
  });

  const [leaderboardData, setLeaderboardData] = useState<
    Array<{ username: string; totalgot: number; position: number }>
  >([]);
  const [totalUsers, setTotalUsers] = useState("0");

  // Function to save data to localStorage
  const saveToLocalStorage = (key: string, value: any) => {
    const data = {
      value,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Function to retrieve data from localStorage
  const getFromLocalStorage = (key: string, expiry: number = 5 * 60 * 1000) => {
    const dataString = localStorage.getItem(key);
    if (!dataString) return null;

    const data = JSON.parse(dataString);
    const now = new Date().getTime();

    // Check if data is not expired
    if (now - data.timestamp > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data.value;
  };

  // Function to get a color for each user based on their position
  const getColorForPosition = (index: number, username: string): string => {
    if (username === ownRanking.username) {
      return "#FFC300";
    }
    return index < 10 ? fixedColors[index] : defaultColor;
  };

  // Function to format numbers with K, M, B suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // Load leaderboard data from localStorage if available
  useEffect(() => {
    const storedLeaderboardData = getFromLocalStorage("leaderboardData");
    const storedOwnRanking = getFromLocalStorage("ownRanking");
    const storedTotalUsers = getFromLocalStorage("totalUsers");

    if (storedLeaderboardData) {
      setLeaderboardData(storedLeaderboardData);
    }
    if (storedOwnRanking) {
      setOwnRanking(storedOwnRanking);
    }
    if (storedTotalUsers) {
      setTotalUsers(storedTotalUsers);
    }

    // Fetch latest leaderboard data from the server
    const fetchLeaderboardData = async () => {
      try {
        const initData = window.Telegram.WebApp.initData || ""; // Get initData from Telegram WebApp
        const response = await fetch(
          `https://frontend.goldenfrog.live/get_user_ranking?UserId=${userID}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData // Add initData to headers
            }
          }
        );
        const data = await response.json();

        if (data.requested_user) {
          const userRanking = {
            username: data.requested_user.username,
            totalgot: data.requested_user.totalgot,
            position: data.requested_user.position
          };
          setOwnRanking(userRanking);
          saveToLocalStorage("ownRanking", userRanking);
        }

        if (data.top_users) {
          const formattedLeaderboardData = data.top_users.map((user: any) => ({
            username: user.username,
            totalgot: user.totalgot,
            position: user.rank
          }));
          setLeaderboardData(formattedLeaderboardData);
          saveToLocalStorage("leaderboardData", formattedLeaderboardData);
        }

        if (data.total_users) {
          setTotalUsers(data.total_users);
          saveToLocalStorage("totalUsers", data.total_users);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
  }, [userID]);

  // const fakeLeaderboardData = [
  //   { username: "User1", totalgot: 100000, position: 1 },
  //   { username: "User2", totalgot: 90000, position: 2 },
  //   { username: "User3", totalgot: 80000, position: 3 },
  //   { username: "User4", totalgot: 70000, position: 4 },
  //   { username: "User5", totalgot: 60000, position: 5 },
  //   { username: "User6", totalgot: 50000, position: 6 },
  //   { username: "User7", totalgot: 40000, position: 7 },
  //   { username: "User8", totalgot: 30000, position: 8 },
  //   { username: "User9", totalgot: 20000, position: 9 },
  //   { username: "User10", totalgot: 10000, position: 10 }
  // ];

  return (
    <div className="relative min-h-screen bg-[#1A1A1C] z-10 text-gray-200">
      {/* Background gradient effects */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-blue-900/20 to-transparent z-0"></div>

      <div className="relative z-10 flex flex-col items-center pt-4 h-[94vh] overflow-y-scroll hide-scrollbar pb-16 px-4">
        {/* Header with glow effect */}
        <div className="mb-4">
          <div className="flex flex-col items-center">
            <img 
              src={img3} 
              alt="Leaderboard Header" 
              className="w-full max-w-[200px] h-auto object-cover rounded-2xl shadow-lg mb-2"
              style={{ 
                borderTopLeftRadius: '1.5rem', 
                borderTopRightRadius: '1.5rem',
                borderBottomLeftRadius: '1.5rem', 
                borderBottomRightRadius: '1.5rem' 
              }}
            />
            <div className="flex items-center justify-center mt-1 space-x-1">
              <FaTrophy className="w-3 h-3 text-[#FDF1B6]" />
              <p className="text-xs text-gray-400">
                Top ATM Miners in the Cosmos
              </p>
            </div>
          </div>
        </div>

        {/* Current User Card - Glowing Effect */}
        <div className="w-full mb-6 transform transition-all duration-300 hover:scale-[1.02]">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-[0.2px] bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>

            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              {/* Animated gradient background */}
              <div className="h-1 w-full bg-gradient-to-r from-[#342B48] via-blue-500 to-[#FEE9B3] bg-[length:200%_100%] animate-gradient-x"></div>

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#342B48] via-blue-500 to-[#FEE9B3] shadow-md shadow-blue-900/10">
                        <span className="text-white font-bold text-xl">
                          {ownRanking.username
                            ? ownRanking.username.slice(0, 2).toUpperCase()
                            : "YO"}
                        </span>
                      </div>
                      <div className="absolute -inset-0.5 border border-blue-500/30 rounded-full animate-pulse"></div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-lg font-semibold text-white">
                          {ownRanking.username || "Your Rank"}
                        </p>
                        {ownRanking.position <= 3 && (
                          <FaCrown className="w-4 h-4 text-[#FDF1B6]" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="px-2 py-0.5 bg-blue-900/40 rounded-full border border-blue-700/30">
                          <p className="text-sm text-blue-400 font-medium">
                            {formatNumber(ownRanking.totalgot)} ATM
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-200">
                          <FaChevronUp className="w-3 h-3 text-green-500" />
                          <span>Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="absolute -inset-[0.8px] bg-blue-500/10 rounded-full blur-sm"></div>
                      <div className="relative bg-gray-800 px-3 py-1 rounded-full border border-blue-500/30">
                        <span className="text-blue-400 font-bold text-xl">
                          #{ownRanking.position || "?"}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-200 mt-1">
                      Your Rank
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Members Card - Glassmorphism */}
        <div className="w-full mb-6 relative">
          <div className="absolute -inset-[0.3px] bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-xl blur-sm"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <FaUsers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Community</h2>
                  <p className="text-xs text-gray-300">Total ATM Miners</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-blue-400 font-bold text-xl">
                  {totalUsers
                    ? formatNumber(Number.parseInt(totalUsers))
                    : "47.2M+"}
                </span>
                <p className="text-xs text-gray-200">Active Miners</p>
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="mt-3 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#342B48] via-blue-500 to-[#FEE9B3] rounded-full animate-pulse"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Leaderboard List - Modern Cards with Hover Effects */}
        <div className="w-full space-y-3 pb-4">
          {leaderboardData.map((user, index) => (
            <div
              key={index}
              className="group relative bg-gray-900/80 rounded-xl p-4 border border-gray-800 shadow-lg transition-all duration-300 hover:bg-gray-800/80 hover:border-gray-700 hover:translate-x-1"
            >
              <div className="flex items-center justify-between">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-2 ring-offset-2 ring-offset-gray-900 ${
                        index === 0
                          ? "ring-[#FDF1B6]"
                          : index === 1
                          ? "ring-[#C0C0C0]"
                          : index === 2
                          ? "ring-[#CD7F32]"
                          : ""
                      }`}
                      style={{
                        backgroundColor: getColorForPosition(
                          index,
                          user.username
                        )
                      }}
                    >
                      <span className="font-bold text-white text-sm">
                        {user.username.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    {index < 3 && (
                      <div
                        className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full 
                        flex items-center justify-center shadow-lg ${
                          index === 0
                            ? "bg-[#C68541]"
                            : index === 1
                            ? "bg-gray-400"
                            : "bg-amber-700"
                        }`}
                      >
                        <span className="text-white text-xs font-bold">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-white">
                        {user.username}
                      </p>
                      {index === 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-[#FDF1B6] rounded-full border border-yellow-500/30">
                          Top Miner
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <p className="text-sm text-blue-400 font-medium">
                        {formatNumber(user.totalgot)} ATM
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className="h-1 w-1 bg-green-500 rounded-full"></div>
                        <p className="text-xs text-gray-300">Active Miner</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Position Indicator */}
                <div className="flex items-center">
                  {index < 3 ? (
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <div
                        className="absolute inset-0 rounded-full blur-sm"
                        style={{
                          backgroundColor:
                            index === 0
                              ? "rgba(255, 215, 0, 0.2)"
                              : index === 1
                              ? "rgba(192, 192, 192, 0.2)"
                              : "rgba(205, 127, 50, 0.2)"
                        }}
                      ></div>
                      <img
                        src={
                          index === 0 ? medal1 : index === 1 ? medal2 : medal3
                        }
                        alt={`Rank ${index + 1}`}
                        className="w-8 h-8 object-contain animate-softbounce relative z-10"
                      />
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                      <span className="text-gray-300 font-bold text-sm">
                        #{index + 1}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Line */}
              <div
                className="absolute bottom-0  left-1 h-[2px] bg-gradient-to-r from-[#342B48] to-[#E4DAA7]"
                style={{
                  width: `${Math.min((user.totalgot / 100000) * 100, 97)}%`
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
