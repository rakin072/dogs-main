import { useState } from "react";
import { BiMinus, BiPlus } from "react-icons/bi";
import { FaX } from "react-icons/fa6";
import {
  advancedLevelMining,
  basicLevelMining,
  mediumLevelMining
} from "../images";

interface BoosterModalProps {
  onClose: () => void;
  onRentMiner: () => void;
}

const miners = [
  {
    id: 1,
    name: "Basic Miner",
    image: basicLevelMining
  },
  {
    id: 2,
    name: "Advanced Miner",
    image: mediumLevelMining
  },
  {
    id: 3,
    name: "Premium Miner",
    image: advancedLevelMining
  }
];

export default function BoosterModal({
  onClose,
  onRentMiner
}: BoosterModalProps) {
  const [selectedMiner, setSelectedMiner] = useState(2);
  const [quantity, setQuantity] = useState(1);
  const dailyProfit = 0.667008;
  const rentPeriod = 30;

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const totalProfit = dailyProfit * rentPeriod;
  const rentPrice = 100000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[3px] bg-black/40 text-[#323232]">
      <div className="w-[90%] max-w-md bg-white rounded-lg">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-2xl font-medium">Booster</h2>
          <button onClick={onClose} className="text-black">
            <FaX size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex justify-between gap-2 mb-6">
            {miners.map((miner) => (
              <button
                key={miner.id}
                className={`flex items-center justify-center p-2 border  rounded-lg ${
                  selectedMiner === miner.id
                    ? "border-[#D395DC] border-2"
                    : "border-[#D8D8D8]"
                }`}
                onClick={() => setSelectedMiner(miner.id)}
              >
                <img
                  src={miner.image || "/placeholder.svg"}
                  alt={miner.name}
                  className="h-full w-full "
                />
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="text-[#B3B3B3] font-normal text-[17px]">
                Rent Period
              </div>
              <div className="font-medium">{rentPeriod} days</div>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center text-[#B3B3B3] font-normal text-[17px]">
                Daily profit <span className="ml-1 text-red-500">🔥</span>
              </div>
              <div className="font-medium">{dailyProfit.toFixed(6)} ATM</div>
            </div>

            <div className="flex justify-between">
              <div className="flex items-center text-[#B3B3B3] font-normal text-[17px]">
                Total profit <span className="ml-1 text-red-500">🔥</span>
              </div>
              <div className="font-medium">{totalProfit.toFixed(5)} ATM</div>
            </div>

            <div>
              <div className="mb-2 text-[#B3B3B3] font-normal text-[17px]">
                Quantity
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                <button
                  onClick={decreaseQuantity}
                  className="flex items-center justify-center w-8 h-8 text-xl font-bold"
                >
                  <BiMinus size={20} />
                </button>
                <div className="text-xl font-medium">{quantity}</div>
                <button
                  onClick={increaseQuantity}
                  className="flex items-center justify-center w-8 h-8 text-xl font-bold"
                >
                  <BiPlus size={20} />
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="text-[#BF5AD2] font-medium">Rent Price</div>
              <div className="font-medium">
                {(rentPrice * quantity).toLocaleString()} $ATM
              </div>
            </div>
          </div>

          <button
            onClick={onRentMiner}
            className="w-full h-14 rounded-lg text-[#FFE7FF] mt-6 text-lg font-medium bg-[#BF5AD2] hover:bg-purple-600"
          >
            Rent Miner
          </button>
        </div>
      </div>
    </div>
  );
}
