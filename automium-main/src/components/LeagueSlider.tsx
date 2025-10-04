import { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { FaStar, FaMedal } from "react-icons/fa";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import {
  bronzeLeague,
  diamondLeague,
  eliteLeague,
  goldLeague,
  grandmasterLeague,
  legendaryLeague,
  masterLeague,
  mythicLeague,
  platinumLeague,
  silverLeague,
  woodLeague
} from "../images";

// League data with enhanced information
const leagues = [
  {
    name: "Wood League",
    description: "Begin your mining journey in the Wood League. Start from the bottom and climb your way to the top!",
    requirement: "0 - 4,999",
    image: woodLeague,
    color: "#8B4513",
    glowColor: "#CD853F",
    difficulty: "Beginner"
  },
  {
    name: "Bronze League",
    description: "Prove your worth in the Bronze League. Show your dedication and earn better rewards!",
    requirement: "5,000 - 49,999",
    image: bronzeLeague,
    color: "#CD7F32",
    glowColor: "#DAA520",
    difficulty: "Novice"
  },
  {
    name: "Silver League",
    description: "The Silver League awaits skilled miners. Your determination will be rewarded!",
    requirement: "50,000 - 249,999",
    image: silverLeague,
    color: "#C0C0C0",
    glowColor: "#E6E8FA",
    difficulty: "Intermediate"
  },
  {
    name: "Gold League",
    description: "Welcome to the prestigious Gold League. Only the elite miners reach this level!",
    requirement: "250,000 - 499,999",
    image: goldLeague,
    color: "#FFD700",
    glowColor: "#FFFACD",
    difficulty: "Advanced"
  },
  {
    name: "Platinum League",
    description: "The Platinum League is for true champions. Your mining skills are exceptional!",
    requirement: "500,000 - 999,999",
    image: platinumLeague,
    color: "#E5E4E2",
    glowColor: "#F5F5F5",
    difficulty: "Expert"
  },
  {
    name: "Diamond League",
    description: "Diamond League - where legends are born. Your mining prowess is legendary!",
    requirement: "1,000,000 - 4,999,999",
    image: diamondLeague,
    color: "#B9F2FF",
    glowColor: "#E0FFFF",
    difficulty: "Master"
  },
  {
    name: "Master League",
    description: "Master League - the pinnacle of mining excellence. You are among the greatest!",
    requirement: "5,000,000 - 9,999,999",
    image: masterLeague,
    color: "#9370DB",
    glowColor: "#E6E6FA",
    difficulty: "Grandmaster"
  },
  {
    name: "Elite League",
    description: "Elite League - only the most dedicated miners reach this exclusive tier!",
    requirement: "10,000,000 - 24,999,999",
    image: eliteLeague,
    color: "#FF69B4",
    glowColor: "#FFB6C1",
    difficulty: "Elite"
  },
  {
    name: "Grandmaster League",
    description: "Grandmaster League - you are a mining legend. Your skills are unmatched!",
    requirement: "25,000,000 - 49,999,999",
    image: grandmasterLeague,
    color: "#FF4500",
    glowColor: "#FF6347",
    difficulty: "Legendary"
  },
  {
    name: "Legendary League",
    description: "Legendary League - the ultimate achievement. You are a mining deity!",
    requirement: "50,000,000 - 99,999,999",
    image: legendaryLeague,
    color: "#FF1493",
    glowColor: "#FF69B4",
    difficulty: "Mythic"
  },
  {
    name: "Mythic League",
    description: "Mythic League - beyond legendary. You have transcended mortal mining limits!",
    requirement: "100,000,000+",
    image: mythicLeague,
    color: "#9400D3",
    glowColor: "#DDA0DD",
    difficulty: "Transcendent"
  }
];

export default function LeagueSlider() {
  const [mounted, setMounted] = useState(false);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-yellow-900/20 to-transparent blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-orange-900/20 to-transparent blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative z-10 h-screen px-4 flex items-center justify-center">
        <div className="w-full max-w-lg">
          <Swiper
            modules={[Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev"
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            className="league-slider"
          >
            {leagues.map((league, index) => (
              <SwiperSlide key={index}>
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                  {/* League Card */}
                  <div className="relative w-full max-w-sm">
                    {/* Glow Effect */}
                    <div 
                      className="absolute -inset-2 rounded-3xl blur-xl opacity-50 animate-pulse-slow"
                      style={{ 
                        background: `linear-gradient(45deg, ${league.glowColor}, ${league.color})` 
                      }}
                    />
                    
                    {/* Main Card */}
                    <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 shadow-2xl p-8">
                      {/* League Badge */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative">
                          <div 
                            className="absolute -inset-2 rounded-full blur-lg opacity-30 animate-pulse"
                            style={{ backgroundColor: league.color }}
                          />
                          <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700 border-2 border-gray-600">
                            <img
                              src={league.image || "/placeholder.svg"}
                              alt={league.name}
                              className="w-20 h-20 object-contain"
                            />
                          </div>
                        </div>
                      </div>

                      {/* League Info */}
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {league.name}
                          </h2>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <FaStar className="text-yellow-400" />
                            <span className="text-sm text-gray-300">{league.difficulty}</span>
                            <FaStar className="text-yellow-400" />
                          </div>
                        </div>

                        <p className="text-sm text-gray-300 leading-relaxed">
                          {league.description}
                        </p>

                        {/* Requirements */}
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <FaMedal className="text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-400">Requirements</span>
                            <FaMedal className="text-yellow-400" />
                          </div>
                          <p className="text-lg font-bold text-white">
                            {league.requirement} ATM
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
            
            {/* Navigation Buttons */}
            <div
              className={`swiper-button-prev custom-swiper-button !text-yellow-400 !opacity-70 hover:!opacity-100 !left-2 ${
                isBeginning ? "hidden" : ""
              }`}
            ></div>
            <div
              className={`swiper-button-next !text-yellow-400 !opacity-70 hover:!opacity-100 !right-2 ${
                isEnd ? "hidden" : ""
              }`}
            ></div>
          </Swiper>

          {/* Progress Indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {leagues.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
