import React, { useState, useEffect } from "react";
import { useUser } from "../UserContext";
import { basicLevelMining, mediumLevelMining, advancedLevelMining } from "../images";
import Modal from "../Modal";

interface ShopItem {
  id: number;
  name: string;
  image: string;
  price: number;
  miningRate: number;
  description: string;
}

const shopItems: ShopItem[] = [
  { 
    id: 2, 
    name: "Level 2 Miner", 
    image: basicLevelMining, 
    price: 1500, 
    miningRate: 20,
    description: "20 ATM per hour"
  },
  { 
    id: 3, 
    name: "Level 3 Miner", 
    image: basicLevelMining, 
    price: 2500, 
    miningRate: 35,
    description: "35 ATM per hour"
  },
  { 
    id: 4, 
    name: "Level 4 Miner", 
    image: mediumLevelMining, 
    price: 3500, 
    miningRate: 50,
    description: "50 ATM per hour"
  },
  { 
    id: 5, 
    name: "Level 5 Miner", 
    image: mediumLevelMining, 
    price: 4500, 
    miningRate: 75,
    description: "75 ATM per hour"
  },
  { 
    id: 6, 
    name: "Level 6 Miner", 
    image: advancedLevelMining, 
    price: 5000, 
    miningRate: 100,
    description: "100 ATM per hour"
  },
  { 
    id: 7, 
    name: "Level 7 Miner", 
    image: advancedLevelMining, 
    price: 6000, 
    miningRate: 150,
    description: "150 ATM per hour"
  },
];

const Shop: React.FC = () => {
  const { userID, points, setPoints } = useUser();
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [currentMiningLevel, setCurrentMiningLevel] = useState<number>(1);

  // Fetch current mining level on component mount
  useEffect(() => {
    const fetchMiningLevel = async () => {
      try {
        const initData = window.Telegram.WebApp.initData || "";
        const response = await fetch(
          `https://frontend.goldenfrog.live/get_user?UserId=${userID}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData
            }
          }
        );
        const data = await response.json();
        if (data.data && data.data.claimedtotal) {
          setCurrentMiningLevel(parseInt(data.data.claimedtotal) || 1);
        }
      } catch (error) {
        console.error("Failed to fetch mining level:", error);
      }
    };

    if (userID) {
      fetchMiningLevel();
    }
  }, [userID]);

  // Function to handle purchase
  const handlePurchase = async (item: ShopItem) => {
    if (points < item.price) {
      setModalMessage("Insufficient ATM balance");
      return;
    }

    try {
      const initData = window.Telegram.WebApp.initData || "";
      
      // Update backend with new mining level and points
      const response = await fetch(
        "https://frontend.goldenfrog.live/update_user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({ 
            UserId: userID, 
            claimedtotal: item.id.toString(), // Save the mining level ID instead of rate
            totalgot: points - item.price
          })
        }
      );

      if (response.ok) {
        // Update local points and mining level
        setPoints(points - item.price);
        setCurrentMiningLevel(item.id);
        setModalMessage(`Successfully purchased ${item.name}! Your mining rate is now ${item.miningRate} ATM per hour.`);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      setModalMessage("Transaction failed. Please try again.");
    }
  };

  const closeModal = () => setModalMessage(null);

  return (
    <div className="p-4 bg-white">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-black">Mining Boosters</h2>
        <p className="text-sm text-gray-500">Upgrade your mining rate to earn more ATM!</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {shopItems.map((item) => {
          const isPurchased = item.id <= currentMiningLevel;
          return (
            <div key={item.id} className="relative bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              {/* Item Image */}
              <div className="flex justify-center mb-2">
                <img src={item.image} alt={item.name} className="w-20 h-20 object-contain" />
            </div>

              {/* Item Name and Description */}
              <h3 className="text-center text-black font-medium mb-1">{item.name}</h3>
              <p className="text-center text-sm text-gray-600 mb-2">{item.description}</p>

              {/* Price */}
              <div className="text-center text-[#BF5AD2] font-medium mb-2">
                {item.price} ATM
            </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(item)}
                disabled={isPurchased}
                className={`w-full rounded-lg py-2 px-4 flex items-center justify-center gap-2 transition-colors ${
                  isPurchased 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#BF5AD2] text-white hover:bg-purple-700'
                }`}
              >
                {isPurchased ? 'Purchased' : 'Purchase'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Modal component */}
      {modalMessage && (
        <Modal message={modalMessage} onClose={closeModal} />
      )}
    </div>
  );
};

export default Shop;
