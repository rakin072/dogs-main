import { FaX } from "react-icons/fa6";

interface InsufficientFundsModalProps {
  onClose: () => void;
  onDailyTasks: () => void;
  onInviteFriends: () => void;
  onGoToShop: () => void;
  amountNeeded: number;
}

export default function InsufficientFundsModal({
  onClose,
  onDailyTasks,
  onInviteFriends,
  onGoToShop,
  amountNeeded
}: InsufficientFundsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[3px] bg-black/40 text-[#323232]">
      <div className="w-[90%] max-w-md bg-white rounded-lg">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-2xl font-bold">Insufficient $ATM</h2>
          <button onClick={onClose} className="text-black">
            <FaX size={20} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <p className="mb-6 text-lg text-[#484848] font-normal">
            {amountNeeded.toLocaleString()} $ATM needed, invite friends or
            complete tasks to earn more $ATM.
          </p>

          <div className="flex flex-col">
            <button
              onClick={onDailyTasks}
              className="w-full flex items-center justify-center rounded-lg h-14 mb-4 text-lg font-medium bg-[#EEEEEE] hover:bg-gray-200 text-gray-800"
            >
              Daily tasks
            </button>

            <button
              onClick={onInviteFriends}
              className="w-full h-14 mb-4 flex items-center justify-center rounded-lg text-lg font-medium bg-[#BF5AD2] hover:bg-purple-600 text-white"
            >
              Invite friends
            </button>

            <button
              onClick={onGoToShop}
              className="w-full text-center text-gray-800 hover:underline"
            >
              Go to the shop to purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
