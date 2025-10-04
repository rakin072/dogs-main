import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { useUser } from "./UserContext";
import { click, telegramImage, friendsImage /*, tgStar*/ } from "./images";
import { RxCross2 } from "react-icons/rx";
import {
  FaAward,
  FaChevronRight,
  // FaComments,
  FaCopy,
  FaShare,
  FaUsers,
} from "react-icons/fa";

import { FaTelegramPlane } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io5";
import {
  FaFacebookMessenger,
  FaHandSparkles,
  FaMessage,
  FaXTwitter,
} from "react-icons/fa6";
import { HiOutlineChatBubbleBottomCenter } from "react-icons/hi2";
import { LuLink } from "react-icons/lu";

const FriendsPage: React.FC = () => {
  const { userID, setPoints } = useUser();
  const [friends, setFriends] = useState<
    Array<{ Username: string; totalgot: number }>
  >([]);
  const [modalMessage, setModalMessage] = useState<string | null>(null); // Modal state
  const FRIEND_REWARD = 1000; // Points reward per new friend
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const inviteModalRef = useRef<HTMLDivElement | null>(null);
  const [animateModal, setAnimateModal] = useState(false); // Animation trigger
  const [isLoading, setIsLoading] = useState(true);

  // Invitation link
  const invitationLink = `https://t.me/AUtomuiumbot/Automium?startapp=${encodeURIComponent(
    userID
  )}`;

  const shareButtons = [
    {
      icon: <FaTelegramPlane size={19} />,
      label: "Telegram",
      color: "#0088cc",
      onClick: () =>
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(invitationLink)}`,
          "_blank"
        ),
    },
    {
      icon: <IoLogoWhatsapp size={19} />,
      label: "WhatsApp",
      color: "#25D366",
      onClick: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(invitationLink)}`,
          "_blank"
        ),
    },
    {
      icon: <FaFacebookMessenger size={19} />,
      label: "Facebook",
      color: "#0084ff",
      onClick: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            invitationLink
          )}`,
          "_blank"
        ),
    },
    {
      icon: <HiOutlineChatBubbleBottomCenter size={19} />,
      label: "Line",
      color: "#00B900",
      onClick: () =>
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
            invitationLink
          )}`,
          "_blank"
        ),
    },
    {
      icon: <FaXTwitter size={19} />,
      label: "Twitter",
      color: "black",
      onClick: () =>
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            invitationLink
          )}`,
          "_blank"
        ),
    },
    {
      icon: <LuLink size={19} />,
      label: "Copy Link",
      color: "gray",
      onClick: () => {
        navigator.clipboard.writeText(invitationLink);
        showModal("Invitation link copied to clipboard!");
      },
    },
  ];

  const handleInvite = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(invitationLink)}`,
      "_blank"
    );
  };

  const setupInvitationLinkCopy = () => {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = invitationLink;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);
    showModal("Invitation link copied to clipboard!");
  };

  const showModal = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => {
    setModalMessage(null);
  };

  // Function to update the `referrewarded` count
  const updateReferrewarded = async (newReferrewardedCount: number) => {
    const initData = window.Telegram.WebApp.initData || "";
    try {
      await fetch("https://frontend.goldenfrog.live/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData,
        },
        body: JSON.stringify({
          UserId: userID,
          referrewarded: newReferrewardedCount.toString(),
        }),
      });
      console.log("referrewarded updated to", newReferrewardedCount);
    } catch (error) {
      console.error("Failed to update referrewarded:", error);
    }
  };

  // Fetch friends logic
  const fetchFriends = async () => {
    setIsLoading(true);
    const initData = window.Telegram.WebApp.initData || "";
    try {
      const response = await fetch(
        `https://frontend.goldenfrog.live/get_invitations?UserId=${userID}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "X-Telegram-Init-Data": initData,
          },
        }
      );
      const data = await response.json();

      if (data) {
        const invitations = data.invitations || [];
        const totalFriendsCount = invitations.length;
        const referrewardedCount = data.referrewarded
          ? parseInt(data.referrewarded, 10)
          : 0;

        setFriends(invitations);
        localStorage.setItem(`friends_${userID}`, JSON.stringify(invitations));

        if (totalFriendsCount > referrewardedCount) {
          const newUnrewardedFriends = totalFriendsCount - referrewardedCount;
          const rewardPoints = newUnrewardedFriends * FRIEND_REWARD;

          setPoints((prevPoints) => prevPoints + rewardPoints);
          showModal(
            `You have earned ${rewardPoints} points for inviting ${newUnrewardedFriends} new friends!`
          );

          await updateReferrewarded(totalFriendsCount);
        }
      } else {
        setFriends([]);
        localStorage.removeItem(`friends_${userID}`);
      }
      setIsLoading(false);
    } catch (error) {
      // console.error("Error fetching friends:", error);
      console.log("Error fetching friends:", error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch friends on load
  useEffect(() => {
    if (userID) {
      const localFriends = localStorage.getItem(`friends_${userID}`);
      if (localFriends) {
        setFriends(JSON.parse(localFriends));
        setIsLoading(false);
      }
      fetchFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID]);

  // Handle modal animation
  useEffect(() => {
    if (isInviteModalOpen) {
      setTimeout(() => setAnimateModal(true), 50);
    } else {
      setTimeout(() => setAnimateModal(false), 50);
    }
  }, [isInviteModalOpen]);

  // Function to get a random gradient for user avatars
  const getRandomGradient = (username: string) => {
    const gradients = [
      "from-purple-600 to-blue-500",
      "from-blue-500 to-teal-400",
      "from-green-500 to-emerald-400",
      "from-yellow-500 to-orange-400",
      "from-pink-500 to-rose-400",
      "from-indigo-500 to-purple-400",
    ];

    // Use the first character of username to deterministically select a gradient
    const charCode = username.charCodeAt(0);
    const index = charCode % gradients.length;

    return gradients[index];
  };

  // const fakeFriends = [
  //   {
  //     Username: "JohnDoe"
  //   },
  //   {
  //     Username: "JaneSmith"
  //   }
  // ];

  return (
    <div className="relative min-h-screen bg-[#1A1A1C] text-gray-200 z-10">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-blue-900/20 to-transparent z-0"></div>
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col h-full gap-4 pb-20 overflow-y-scroll hide-scrollbar px-4">
        {/* Header Section */}
        <div className="mt-4 z-40 w-full">
          <div className="mb-4 relative">
            <div className="relative flex flex-col items-center">
              <img 
                src={friendsImage} 
                alt="Friends Header" 
                className="w-full max-w-[200px] h-auto object-cover rounded-2xl shadow-lg mb-2"
                style={{ 
                  borderTopLeftRadius: '1.5rem', 
                  borderTopRightRadius: '1.5rem',
                  borderBottomLeftRadius: '1.5rem', 
                  borderBottomRightRadius: '1.5rem' 
                }}
              />
              <div className="flex items-center justify-center mt-1 space-x-1 bg-gray-800/50 px-2 py-1 rounded-full backdrop-blur-sm">
                <FaAward className="w-3 h-3 text-[#FEE9B3]" />
                <p className="text-xs text-gray-300">
                  Earn ATM by inviting friends
                </p>
              </div>
            </div>
          </div>

          {/* Invite Friends Card */}
          <div className="w-full mb-4 transform transition-all duration-300 hover:scale-[1.02]">
            <div className="relative">
              <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center">
                          <img
                            src={telegramImage || "/placeholder.svg"}
                            alt="Invite Friends"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="absolute -inset-1 border border-blue-500/30 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xl font-semibold text-white">
                            Invite Friends
                          </p>
                          <FaHandSparkles className="w-4 h-4 text-[#FEE9B3]" />
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="px-3 py-1 bg-yellow-500/10  rounded-full border border-blue-700/30 flex items-center space-x-1">
                            <p className="text-sm text-[#FEE9B3] font-medium">
                              +1000 ATM per friend
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="relative text-white text-base w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-purple-900/20 font-medium flex items-center justify-center space-x-2"
          >
            <FaShare className="w-5 h-5 mr-2" />
            <span>Share with friends</span>
            <img
              src={click || "/placeholder.svg"}
              alt=""
              className="absolute w-10 -right-2 -bottom-[5px] click-animate"
            />
          </button>
        </div>

        {/* Direct share buttons */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {shareButtons.map((button, idx) => (
            <button
              key={idx}
              onClick={button.onClick}
              className="flex flex-col items-center justify-center space-y-2 p-3 rounded-xl bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-700/70 transition-all duration-300 shadow-md"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: button.color }}
              >
                <span className="text-white">{button.icon}</span>
              </div>
              <span className="text-xs text-gray-300">{button.label}</span>
            </button>
          ))}
        </div>

        {/* Friends list */}
        <div className="w-full relative">
          <div className="absolute -inset-[0.1px] bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-xl blur-sm"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-800/50 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <FaUsers className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    My Friends ({friends.length})
                  </h2>
                  <p className="text-xs text-gray-400">Invited miners</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              // Loading skeleton
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                      <div className="h-4 w-24 bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map((friend, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/30 transition-all duration-300 hover:bg-gray-700/50 hover:border-gray-600/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${getRandomGradient(
                          friend.Username
                        )} shadow-md`}
                      >
                        <span className="text-white font-semibold">
                          {friend.Username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {friend.Username}
                        </p>
                        <p className="text-xs text-gray-400">Active miner</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-blue-900/30 rounded-full border border-blue-700/20 text-blue-400 text-sm font-medium">
                      +1000 ATM
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-gray-800/70 flex items-center justify-center">
                  <FaUsers className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 text-center">
                  No friends invited yet
                </p>
                <p className="text-xs text-gray-600 text-center max-w-xs">
                  Share your invitation link to start earning ATM rewards
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast-style modal */}
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}

      {/* Bottom-sheet invite modal */}
      {isInviteModalOpen && (
        <>
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
              animateModal ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsInviteModalOpen(false)}
          />

          <div
            ref={inviteModalRef}
            className={`fixed left-1/2 bottom-0 transform -translate-x-1/2 md:max-w-xl w-full bg-gray-900 text-gray-200 p-5 rounded-t-2xl z-50 transition-all duration-500 ease-in-out pb-24 border-t border-gray-800 shadow-2xl ${
              animateModal
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
          >
            {/* Sheet header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <FaShare className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">
                  Invite Friends
                </h2>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors"
              >
                <RxCross2 size={20} />
              </button>
            </div>

            {/* Sheet body */}
            <div className="space-y-4">
              {/* Send message */}
              <div
                onClick={handleInvite}
                className="flex items-center justify-between p-4 bg-gray-800/70 rounded-xl cursor-pointer hover:bg-gray-700/70 transition-colors border border-gray-700/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <FaMessage className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">Send message</span>
                </div>
                <FaChevronRight className="text-gray-500" />
              </div>

              {/* Copy link */}
              <div
                onClick={setupInvitationLinkCopy}
                className="flex items-center justify-between p-4 bg-gray-800/70 rounded-xl cursor-pointer hover:bg-gray-700/70 transition-colors border border-gray-700/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                    <FaCopy className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">Copy Link</span>
                </div>
                <FaChevronRight className="text-gray-500" />
              </div>

              {/* Invitation link display */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <p className="text-xs text-gray-400 mb-2">
                  Your invitation link:
                </p>
                <div className="flex items-center">
                  <div className="bg-gray-900 rounded p-2 text-sm text-gray-400 flex-1 truncate">
                    {invitationLink}
                  </div>
                  <button
                    onClick={setupInvitationLinkCopy}
                    className="ml-2 p-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FaCopy className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage;
