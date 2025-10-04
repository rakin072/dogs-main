import { FaTelegramPlane } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io5";
import { FaFacebookMessenger, FaXTwitter } from "react-icons/fa6";
import { HiOutlineChatBubbleBottomCenter } from "react-icons/hi2";
import { LuLink } from "react-icons/lu";
import { trdLogo } from "../images";
import { useUser } from "../UserContext";

interface InviteFriendsProps {
  taskStatus: {
    [key: string]: "not_started" | "loading" | "claimable" | "completed";
  };
  refertotal: number;
  onInviteFriendsClick: (taskKey: string, column: string, reward: number, requiredFriends: number) => void;
}

export default function InviteFriends({ taskStatus, refertotal, onInviteFriendsClick }: InviteFriendsProps) {
  const { userID } = useUser();

  // Get invitation link
  const invitationLink = `https://t.me/tap2earnatmbot/ATM?startapp=${encodeURIComponent(userID)}`;

  const shareButtons = [
    { 
      icon: <FaTelegramPlane size={24} />, 
      color: "#0088cc",
      onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(invitationLink)}`, "_blank")
    },
    { 
      icon: <IoLogoWhatsapp size={24} />, 
      color: "#25D366",
      onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(invitationLink)}`, "_blank")
    },
    { 
      icon: <FaFacebookMessenger size={24} />, 
      color: "#0084ff",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(invitationLink)}`, "_blank")
    },
    { 
      icon: <HiOutlineChatBubbleBottomCenter size={24} />, 
      color: "#00B900",
      onClick: () => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(invitationLink)}`, "_blank")
    },
    { 
      icon: <FaXTwitter size={24} />, 
      color: "black",
      onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(invitationLink)}`, "_blank")
    },
    { 
      icon: <LuLink size={24} />, 
      color: "gray",
      onClick: () => {
        navigator.clipboard.writeText(invitationLink);
        // You could add a toast notification here
      }
    }
  ];

  const inviteTasks = [
    { taskKey: "task10", goal: 1, reward: 1000 },
    { taskKey: "task11", goal: 5, reward: 5000 },
    { taskKey: "task12", goal: 10, reward: 10000 }
  ];

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="mb-4 px-4">
        <h2 className="text-lg font-medium text-gray-800">Invite friends</h2>
        <p className="text-gray-600 text-xs font-normal">
          +1000 $ATM for each friend you invite
        </p>
      </div>

      {/* Share Buttons */}
      <div className="flex justify-center gap-2 items-center mb-6">
        {shareButtons.map((button, idx) => (
          <button
            key={idx}
            onClick={button.onClick}
            className="w-11 h-11 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
            style={{ backgroundColor: button.color }}
          >
            <span className="text-white">{button.icon}</span>
          </button>
        ))}
      </div>

      {/* Invite Progress */}
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar px-4 mt-4 text-black">
        {inviteTasks.map((task) => {
          const status = taskStatus[task.taskKey] || "not_started";
          const isCompleted = status === "completed";
          const isClaimable = refertotal >= task.goal && !isCompleted;

          return (
            <div
              key={task.taskKey}
              className="flex items-center min-w-[75%] justify-between py-2 shadow-md px-1"
            >
              <div className="flex items-center justify-center gap-2">
                {/* Progress Icon */}
                <img
                  src={trdLogo}
                  alt=""
                  className="h-[40px] w-[40px] rounded-full"
                />

                {/* Progress Info */}
                <div>
                  <p className="text-sm font-normal text-gray-500">
                    Invite {task.goal} friend{task.goal > 1 ? 's' : ''} ({Math.min(refertotal, task.goal)}/{task.goal})
                  </p>
                  <p className="text-sm text-gray-500 font-normal">
                    +{task.reward} MATM
                  </p>
                </div>
              </div>
              {/* GO/Claim Button */}
              <button
                className={`px-[10px] py-1 rounded-full ${
                  isCompleted 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isClaimable
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-[#C258D4] hover:bg-[#B048C4]'
                } text-white font-normal text-sm`}
                onClick={() => {
                  if (!isCompleted && isClaimable) {
                    onInviteFriendsClick(task.taskKey, task.taskKey, task.reward, task.goal);
                  }
                }}
                disabled={isCompleted}
              >
                {isCompleted ? 'Done' : isClaimable ? 'Claim' : 'GO'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
