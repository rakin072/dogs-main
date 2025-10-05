/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { BiTask } from "react-icons/bi";
import { FaWallet, FaYoutube, FaTelegram, FaTwitter, FaGlobe, FaDiscord } from "react-icons/fa";
import { FaInstagram, FaTiktok } from "react-icons/fa6";
import { TfiGift } from "react-icons/tfi";
import { useUser } from "./UserContext";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import Modal from "./Modal";
import { img4 } from "./images";

// Removed ad SDK declaration as Watch Ads task is no longer used

// Interface for TaskItem component props
interface TaskItemProps {
  icon?: React.ReactNode | string | void;
  title: string;
  reward?: number;
  requiredFriends?: number; // New prop to define required number of friends
  status?: "not_started" | "loading" | "claimable" | "completed";
  onClick?: () => void;
  onClaim?: () => void;
}

// TaskItem Component: Represents each task in the UI
const TaskItem: React.FC<TaskItemProps> = ({
  icon,
  title,
  reward,
  requiredFriends,
  onClick,
  onClaim,
  status = "not_started"
}) => {
  return (
    <div
      onClick={status === "not_started" && onClick ? onClick : undefined}
      className="flex  items-center justify-between relative bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 p-4 shadow-lg"
    >
      <div className="absolute -inset-[0.3px] bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-xl blur-sm"></div>
      {icon ? (
        <div className="flex items-center gap-2">
          <div>
            {typeof icon === "string" ? (
              <img
                className="h-11 w-11 rounded-full border-2 border-[#BF5AD2]"
                src={icon}
                alt={title}
              />
            ) : (
              <div className="text-[22px] px-[8px] text-white rounded-lg py-2  bg-[#000000]">
                {icon}
              </div>
            )}
          </div>
          <div className="relative">
            <div className="flex items-center font-[400] justify-center gap-[2px] text-sm">
              <div className="text-white ">{title}</div>
              
            </div>
            {reward !== undefined && (
              <div className="flex items-center mt-1 text-[#7F8082] text-sm font-normal">
                +{reward} ATM{reward !== 1 ? "S" : ""}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="text-white">
            <div className="font-bold text-sm">{title}</div>
            {requiredFriends !== undefined && (
              <div className="flex items-center text-xs text-gray-300 mt-1">
                Requires {requiredFriends} Friend
                {requiredFriends > 1 ? "s" : ""}
              </div>
            )}
            {reward !== undefined && (
              <div className="flex items-center text-xs text-white/80 mt-1 font-semibold">
                +{reward} ATM{reward !== 1 ? "S" : ""}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="text-gray-300 relative">
        {status === "completed" && "✅"}
        {status === "loading" && <div className="loader"></div>}
        {status === "claimable" && onClaim && (
          <button
            onClick={onClaim}
            className="font-normal text-[14px] text-white px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-colors duration-300 shadow-md shadow-emerald-900/20 border border-emerald-400/30"
          >
            Claim
          </button>
        )}
        {status === "not_started" && reward !== undefined && (
          <>
            <a className="px-3 font-normal text-[15px] text-white py-[4px] rounded-full  bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 duration-500">
              Go
            </a>
          </>
        )}
      </div>
    </div>
  );
};

interface TasksPageProps {
  taskStatus: {
    [key: string]: "not_started" | "loading" | "claimable" | "completed";
  };
  setTaskStatus: React.Dispatch<
    React.SetStateAction<{
      [key: string]: "not_started" | "loading" | "claimable" | "completed";
    }>
  >;
  refertotal: number;
  setRefertotal: React.Dispatch<React.SetStateAction<number>>;
}

const TasksPage: React.FC<TasksPageProps> = ({
  taskStatus,
  setTaskStatus,
  refertotal,
  setRefertotal
}) => {
  const { setPoints, userID } = useUser();
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();

  const [modalMessage, setModalMessage] = useState<string | null>(null);
  // State for fetched tasks
  const [fetchedTasks, setFetchedTasks] = useState<any[]>([]);

  // New state to track if wallet connection is being initiated for a specific task
  const [connectingForTask, setConnectingForTask] = useState<string | null>(
    null
  );
  const dailyTasksRef = useRef<HTMLDivElement>(null);

  const showAlert = (message: string) => {
    setModalMessage(message);
  };

  const closeModal = () => setModalMessage(null);

  // Function to extract chat ID from a Telegram link
  const extractChatId = (link: string): string => {
    const parts = link.split("/");
    const lastPart = parts[parts.length - 1];
    return "@" + lastPart;
  };

  // Effect to fetch tasks from the backend
  useEffect(() => {
    const fetchTasks = async () => {
      const initData = window.Telegram.WebApp.initData || "";

      try {
        const response = await fetch(
          `https://frontend.goldenfrog.live/get_user_tasks?userid=${userID}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData
            }
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
          if (data.task_details) {
            setFetchedTasks(data.task_details);
          }

          // Handle completed tasks
          let completedTasks: number[] = [];
          if (data.completed_tasks) {
            if (Array.isArray(data.completed_tasks)) {
              completedTasks = data.completed_tasks.map((id: any) =>
                parseInt(id, 10)
              );
            } else if (typeof data.completed_tasks === "string") {
              completedTasks = data.completed_tasks
                .split(",")
                .map((id: string) => parseInt(id, 10))
                .filter((id: number) => !isNaN(id));
            } else if (typeof data.completed_tasks === "number") {
              completedTasks = [data.completed_tasks];
            }
          }

          // Initialize task status for fetched tasks
          const newTaskStatus: { [key: string]: "not_started" | "completed" } =
            {};
          data.task_details.forEach((task: any) => {
            newTaskStatus[task.taskid.toString()] = completedTasks.includes(
              task.taskid
            )
              ? "completed"
              : "not_started";
          });

          setTaskStatus((prevStatus) => ({
            ...prevStatus,
            ...newTaskStatus
          }));
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        showAlert("Failed to fetch tasks. Please check your connection.");
      }
    };

    if (userID) {
      fetchTasks();
    }
  }, [userID]);

  // Function to mark task as completed and reward points
  const saveTaskCompletion = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    const initData = window.Telegram.WebApp.initData || "";

    try {
      const response = await fetch(
        "https://frontend.goldenfrog.live/update_user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({ UserId: userID, [column]: "Done" })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed"
      }));

      setPoints((prevPoints) => prevPoints + reward);
      showAlert(`Thank you! You have earned ${reward} ATM.`);
    } catch (error) {
      console.error(`Failed to complete task ${taskKey}:`, error);
      showAlert(
        "An error occurred while completing the task. Please try again later."
      );
    }
  };

  /**
   * Updated handleInviteFriendsClick:
   * - Accepts required number of friends.
   * - Checks if user's refertotal meets the requirement.
   * - Rewards if condition is met; else shows "Not enough users".
   */
  const handleInviteFriendsClick = async (
    taskKey: string,
    column: string,
    reward: number,
    requiredFriends: number
  ) => {
    if (refertotal < requiredFriends) {
      showAlert("Not Enough Friends");
      return;
    }

    const initData = window.Telegram.WebApp.initData || "";

    try {
      // Update task status in the backend
      const response = await fetch(
        "https://frontend.goldenfrog.live/update_user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({ UserId: userID, [column]: "Done" })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      // Update task status locally
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed"
      }));

      // Reward points
      setPoints((prevPoints) => prevPoints + reward);

      // Optionally, update refertotal if needed
      // Here, you might want to subtract the requiredFriends from refertotal
      // to prevent multiple claims for the same friends.
      // Adjust this logic based on your application's requirements.
      setRefertotal((prev) => prev - requiredFriends); // Deduct the required friends from refertotal

      showAlert(
        `Congratulations! You have completed the Invite ${requiredFriends} Friend${
          requiredFriends > 1 ? "s" : ""
        } task and earned ${reward} ATM.`
      );
    } catch (error) {
      console.error(`Failed to complete ${taskKey} task:`, error);
      showAlert(
        "An error occurred while completing the task. Please try again later."
      );
    }
  };

  // Function to handle Telegram-related tasks (e.g., joining a channel)
  const handleTelegramTaskClick = async (taskKey: string, link: string) => {
    window.open(link, "_blank");

    const chatId = extractChatId(link);
    const userId = userID;

    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading"
    }));

    setTimeout(async () => {
      const initData = window.Telegram.WebApp.initData || "";

      try {
        const response = await fetch(
          `https://frontend.goldenfrog.live/check_telegram_status?user_id=${userId}&chat_id=${chatId}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData
            }
          }
        );
        const data = await response.json();

        if (data.status === "1") {
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "claimable"
          }));
        } else {
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "not_started"
          }));
          showAlert("Not found, please try again.");
        }
      } catch (error) {
        console.error("Error checking Telegram status:", error);
        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "not_started"
        }));
        showAlert("An error occurred. Please try again.");
      }
    }, 6000); // 6 seconds delay
  };

  // Function to handle generic task clicks (e.g., following on social media)
  const handleTaskClick = (taskKey: string, link: string) => {
    // Open the social media link in a new tab
    window.open(link, "_blank");

    // Set task status to loading
    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading"
    }));

    // After a delay to allow user to follow/subscribe, make the task claimable
    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "claimable"
      }));
    }, 30000); // 30 seconds delay
  };

  // Function to handle claiming a task's reward
  const handleTaskClaim = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    const initData = window.Telegram.WebApp.initData || "";

    try {
      // Update task status in the backend
      const response = await fetch(
        "https://frontend.goldenfrog.live/update_user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({ UserId: userID, [column]: "Done" })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.status}`);
      }

      // Update task status locally
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed"
      }));

      // Reward points
      setPoints((prevPoints) => prevPoints + reward);
      showAlert(`Congratulations! You have earned ${reward} ATM.`);
    } catch (error) {
      console.error(`Failed to complete ${taskKey} task:`, error);
      showAlert(
        "An error occurred while completing the task. Please try again later."
      );

      // Reset task status to not_started on error
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "not_started"
      }));
    }
  };

  // Function to handle connecting the TON wallet task
  const handleConnectWalletTask = () => {
    if (address) {
      // Wallet is already connected, reward the user instantly
      saveTaskCompletion("task2", "task2", 1000);
    } else {
      // Wallet is not connected, initiate the connection process
      setConnectingForTask("task2"); // Set the task we're connecting for
      tonConnectUI.connectWallet(); // Trigger the wallet connection UI
      // The reward will be handled in the onStatusChange useEffect upon successful connection
    }
  };

  // Function to handle fetched tasks (additional tasks)
  const handleFetchedTaskClick = (task: any) => {
    // Check if task is already completed
    if (taskStatus[task.taskid.toString()] === "completed") {
      return; // Do nothing if task is completed
    }

    // Use the link provided by the task to open in a new tab or default to "#"
    const taskLink = task.tasklink || "#";
    window.open(taskLink, "_blank");

    // Set task status to "loading"
    setTaskStatus((prevState) => ({
      ...prevState,
      [task.taskid.toString()]: "loading"
    }));

    // Simulate an asynchronous operation to make the task claimable
    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [task.taskid.toString()]: "claimable"
      }));
    }, 30000); // 30 seconds delay
  };

  // Function to handle claiming fetched tasks' rewards
  const handleFetchedTaskClaim = async (task: any) => {
    try {
      const initData = window.Telegram.WebApp.initData || "";

      // First API call: Mark task as done
      const markDoneResponse = await fetch(
        "https://frontend.goldenfrog.live/mark_task_done",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({
            userid: userID,
            taskid: task.taskid
          })
        }
      );

      const markDoneData = await markDoneResponse.json();

      if (!markDoneResponse.ok) {
        console.log(
          "Warning: Failed to mark task as done. Proceeding with increasing points."
        );
      } else if (
        !markDoneData.success &&
        markDoneData.message !== "Task marked as done for existing user" &&
        markDoneData.message !== "Task already marked as done"
      ) {
        console.log(
          "Warning: Task already marked as done or other non-critical issue."
        );
      }

      // Second API call: Increase total points (totalgot)
      const increasePointsResponse = await fetch(
        "https://frontend.goldenfrog.live/increase_totalgot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({
            UserId: userID,
            Amount: task.taskreward
          })
        }
      );

      const increasePointsData = await increasePointsResponse.json();

      if (
        !increasePointsResponse.ok ||
        !increasePointsData.totalgot ||
        !increasePointsData.message.includes("Total got updated successfully")
      ) {
        throw new Error(
          "Failed to increase points. Backend response indicates failure."
        );
      }

      // Update task status to completed if successful
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [task.taskid.toString()]: "completed"
      }));

      // Update user's points
      setPoints(increasePointsData.totalgot);

      // Show success alert
      showAlert(
        `You have earned ${task.taskreward} ATM. Your total is now ${increasePointsData.totalgot} ATM.`
      );
    } catch (error) {
      // Enhanced error message for debugging
      console.error("Failed to claim task:", error);
      showAlert(
        "An error occurred while claiming the task. Please try again later."
      );

      // Set task status back to not started only if increasing points failed
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [task.taskid.toString()]: "not_started"
      }));
    }
  };

  // Removed Watch ADs handler

  // Function to render tasks based on the selected segment
  const renderTasks = () => {
    return (
      <>
        <div className="mt-6 p-4 space-y-4">
          {/* Hardcoded Tasks */}
          <TaskItem
            icon={<FaTelegram />}
            title="Join Telegram Group"
            reward={1000}
            status={taskStatus["task1"] || "not_started"}
            onClick={() =>
              handleTelegramTaskClick("task1", "https://t.me/atomiumgamearts")
            }
            onClaim={() => handleTaskClaim("task1", "task1", 1000)}
          />

          {/* Task 7: Follow on Twitter */}
          <TaskItem
            icon={<FaTwitter />}
            title="Follow on Twitter"
            reward={1000}
            status={taskStatus["task7"] || "not_started"}
            onClick={() => handleTaskClick("task7", "https://x.com/Kevin1143765")}
            onClaim={() => handleTaskClaim("task7", "task7", 1000)}
          />

          {/* Task 14: Subscribe to YouTube */}
          <TaskItem
            icon={<FaYoutube />}
            title="Subscribe to YouTube"
            reward={1000}
            status={taskStatus["task14"] || "not_started"}
            onClick={() =>
              handleTaskClick(
                "task14",
                "https://youtube.com/@atomium-game-arts?si=jV_vjxxmrdJV76lE"
              )
            }
            onClaim={() => handleTaskClaim("task14", "task14", 1000)}
          />

          {/* Task 15: Visit Website */}
          <TaskItem
            icon={<FaGlobe />}
            title="Visit Website"
            reward={1000}
            status={taskStatus["task15"] || "not_started"}
            onClick={() =>
              handleTaskClick(
                "task15",
                "https://atomium-game-arts.com/"
              )
            }
            onClaim={() => handleTaskClaim("task15", "task15", 1000)}
          />

          {/* Task 16: Follow on Instagram */}
          <TaskItem
            icon={<FaInstagram />}
            title="Follow on Instagram"
            reward={1000}
            status={taskStatus["task16"] || "not_started"}
            onClick={() =>
              handleTaskClick("task16", "https://www.instagram.com/atomuim_game_arts?igsh=ZWR5MHJweG5ta2V3")
            }
            onClaim={() => handleTaskClaim("task16", "task16", 1000)}
          />

          {/* Task 18: Follow on TikTok */}
          <TaskItem
            icon={<FaTiktok />}
            title="Follow on TikTok"
            reward={1000}
            status={taskStatus["task18"] || "not_started"}
            onClick={() =>
              handleTaskClick("task18", "https://www.tiktok.com/@atomiumgamearts.c?_t=ZG-8xE2C5v7ytc&_r=1")
            }
            onClaim={() => handleTaskClaim("task18", "task18", 1000)}
          />

          {/* Task 19: Join Discord */}
          <TaskItem
            icon={<FaDiscord />}
            title="Join Discord"
            reward={1000}
            status={taskStatus["task19"] || "not_started"}
            onClick={() =>
              handleTaskClick("task19", "https://discord.gg/yW94dUBM")
            }
            onClaim={() => handleTaskClaim("task19", "task19", 1000)}
          />

          {/* Task 2: Connect TON wallet */}
          <TaskItem
            icon={<FaWallet />}
            title="Connect TON wallet"
            reward={3000}
            status={taskStatus["task2"] || "not_started"}
            onClick={handleConnectWalletTask}
            onClaim={() => handleTaskClaim("task2", "task2", 3000)}
          />

          {/* Task 10: Invite 1 Friend */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 1 Friend"
            reward={1000}
            status={taskStatus["task10"] || "not_started"}
            onClick={() =>
              handleInviteFriendsClick("task10", "task10", 1000, 1)
            }
            requiredFriends={1}
            onClaim={() => handleTaskClaim("task10", "task10", 1000)}
          />

          {/* Task 11: Invite 5 Friends */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 5 Friends"
            reward={5000}
            status={taskStatus["task11"] || "not_started"}
            onClick={() =>
              handleInviteFriendsClick("task11", "task11", 5000, 5)
            }
            requiredFriends={5}
            onClaim={() => handleTaskClaim("task11", "task11", 5000)}
          />

          {/* Task 12: Invite 10 Friends */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 10 Friends"
            reward={10000}
            status={taskStatus["task12"] || "not_started"}
            onClick={() =>
              handleInviteFriendsClick("task12", "task12", 10000, 10)
            }
            requiredFriends={10}
            onClaim={() => handleTaskClaim("task12", "task12", 10000)}
          />

          {/* Divider for Dynamic Tasks */}
          {fetchedTasks.length > 0 && (
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-gray-500">
                  Additional Tasks
                </span>
              </div>
            </div>
          )}

          {/* Dynamically Fetched Tasks */}
          {fetchedTasks.map((task) => (
            <TaskItem
              key={task.taskid}
              icon={task.taskimage} // Using task image as icon
              title={task.tasktitle}
              reward={task.taskreward}
              status={taskStatus[task.taskid.toString()] || "not_started"}
              onClick={() => handleFetchedTaskClick(task)}
              onClaim={() => handleFetchedTaskClaim(task)}
            />
          ))}
        </div>
      </>
    );
  };

  // Effect to handle wallet connection status changes
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        console.log("wallet info: ", wallet);
        // Check if the connection was initiated for the "Connect TON wallet" task
        if (connectingForTask === "task2") {
          // Wallet connected successfully for "Connect TON wallet" task
          saveTaskCompletion("task2", "task2", 1000);
          setConnectingForTask(null);
        }
      } else {
        // Wallet disconnected
        if (connectingForTask === "task2") {
          // If the user was trying to connect for "Connect TON wallet" task
          showAlert("Connect wallet first.");
          setConnectingForTask(null);
        }
      }
    });
    return () => unsubscribe();
  }, [tonConnectUI, connectingForTask]);

  return (
    <div className="relative min-h-screen bg-[#1A1A1C] z-10">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent z-0"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-blue-900/20 to-transparent z-0"></div>
      <div className="flex flex-col pt-4 h-[94vh] overflow-y-scroll hide-scrollbar pb-16 ">
        {/* Glowing Header */}
        <div className="flex flex-col items-center">
          <img 
            src={img4} 
            alt="Tasks Header" 
            className="w-full max-w-[200px] h-auto object-cover rounded-2xl shadow-lg"
            style={{ 
              borderTopLeftRadius: '1.5rem', 
              borderTopRightRadius: '1.5rem',
              borderBottomLeftRadius: '1.5rem', 
              borderBottomRightRadius: '1.5rem' 
            }}
          />
          <div className="flex items-center justify-center mt-2 space-x-1">
            <p className="text-xs text-gray-400 flex gap-1 text-center">
              <BiTask className="w-3 h-3 text-[#FDF1B6]" />
              Earn Rewards. Complete Tasks. Rise to the Top.
            </p>
          </div>
        </div>

        <div ref={dailyTasksRef}>{renderTasks()}</div>
      </div>
      {/* Modal for Alerts */}
      {modalMessage && <Modal message={modalMessage} onClose={closeModal} />}
    </div>
  );
};

export default TasksPage;
