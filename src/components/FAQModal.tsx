import type React from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoCloseSharp } from "react-icons/io5";

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const tableData = [
  {
    planet: "planet1",
    supply: "3%",
    xoob: "3,000,000.00",
    lucky: "18.00%",
    day: 9,
    className: "bg-[#1E1E1E]",
  },
  {
    planet: "planet2",
    supply: "5.00%",
    xoob: "5,000,000.00",
    lucky: "15.00%",
    day: 18,
    className: "bg-[#2B2B2B]",
  },
  {
    planet: "planet3",
    supply: "7.00%",
    xoob: "7,000,000.00",
    lucky: "15.00%",
    day: 27,
    className: "bg-[#1E1E1E]",
  },
  {
    planet: "planet4",
    supply: "7.00%",
    xoob: "7,000,000.00",
    lucky: "10.00%",
    day: 36,
    className: "bg-[#2B2B2B]",
  },
  {
    planet: "planet5",
    supply: "10.00%",
    xoob: "10,000,000.00",
    lucky: "10.00%",
    day: 45,
    className: "bg-[#1E1E1E]",
  },
  {
    planet: "planet6",
    supply: "10.00%",
    xoob: "10,000,000.00",
    lucky: "10.00%",
    day: 54,
    className: "bg-[#2B2B2B]",
  },
  {
    planet: "planet7",
    supply: "10.00%",
    xoob: "10,000,000.00",
    lucky: "7.00%",
    day: 63,
    className: "bg-[#1E1E1E]",
  },
  {
    planet: "planet8",
    supply: "15.00%",
    xoob: "15,000,000.00",
    lucky: "7.00%",
    day: 72,
    className: "bg-[#2B2B2B]",
  },
  {
    planet: "planet9",
    supply: "15.00%",
    xoob: "15,000,000.00",
    lucky: "5.00%",
    day: 81,
    className: "bg-[#1E1E1E]",
  },
  {
    planet: "planet10",
    supply: "18.00%",
    xoob: "18,000,000.00",
    lucky: "3%",
    day: 90,
    className: "bg-[#2B2B2B]",
  },
];

const FAQ_DATA = [
  {
    title: "How to earn $ATM tokens",
    content: (
      <div className="space-y-3 text-sm font-[300]">
        <p>To start earning $ATM tokens, follow these steps:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Purchase a spaceship in the 'Shop' section. There are 6 types of
            spaceships available.
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                Spaceships with multipliers x1, x5, x10, and x15 can be
                purchased in the 'Shop' and increase the rate of $ATM mining.
              </li>
              <li>
                Spaceships with multipliers x30 and x50 can only be obtained
                from Mystery Boxes.
              </li>
            </ul>
          </li>
          <li>
            After purchasing a spaceship, press the 'Start' button to begin
            mining. Please note: Mining will stop if you close the app. Make
            sure to keep the app open to continue mining tokens.
          </li>
        </ol>
      </div>
    ),
  },
  {
    title: "How does mining work?",
    content: (
      <p className="text-sm font-[300]">
        Mining in ATM is based on principles similar to classic mining
        mechanisms and uses a comparable algorithm
      </p>
    ),
  },
  {
    title: "When will the listing take place?",
    content: (
      <p className="text-sm font-[300]">
        The listing is scheduled for the beginning of Q2. The ATM team and its
        partners have already secured agreements with certain exchanges for the
        token's launch.
      </p>
    ),
  },
  {
    title: "Where will the stars and crypto spent during mining go?",
    content: (
      <p className="text-sm font-[300]">
        All purchases made by miners, regardless of the currency, will be
        allocated to support the project's marketing efforts and liquidity for
        the token's listing.
      </p>
    ),
  },
  {
    title: "How long is the ship valid after purchase?",
    content: (
      <p className="text-sm font-[300]">
        The ship is purchased for the entire mining period, which lasts 90 days.
      </p>
    ),
  },
  {
    title: "Who are the partners and investors of the ATM project?",
    content: (
      <div className="space-y-3 text-sm font-[300]">
        <p>The partners and investors of the ATM project include:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Chromia
            <li>Mines of Dalarnia (a game launched via Binance Launchpool)</li>
            <li>My Neighbor Alice (a game launched via Binance Launchpool)</li>
          </li>
        </ul>
        <p className="pl-5">
          XOOB successfully raised $1.6 million in the pre-seed stage, securing
          the support of these key partners and laying a strong foundation for
          growth. These partnerships and investments strengthen XOOB's position
          in gaming ecosystems
        </p>
      </div>
    ),
  },
  {
    title: "What determines the number of tokens mined?",
    content: (
      <div className="space-y-3 text-sm font-[300] pb-20">
        <p>
          The number of tokens you can mine depends on the following key
          factors:
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            The number of miners online at the moment. The more miners are
            online, the more competitive the mining process becomes.
          </li>
          <li>
            The specific planet where mining takes place. Each planet has a
            limited token supply available for mining within a 9-day period.
            This ensures that mining remains profitable at any stage of the
            game.
          </li>
          <li>
            The multiplier of your spaceship. Spaceships with higher multipliers
            mine more tokens per block, giving you a significant advantage in
            earning rewards.
          </li>
          <li>
            The chance of becoming the "lucky block miner." Every user has a
            chance to be selected as the "lucky miner" for a block. The lucky
            miner receives a special percentage of the block's reward, as
            detailed in the table below.
          </li>
        </ol>
        <p className="pl-5">
          This system is designed to maintain fairness and ensure mining is
          rewarding for all participants. Refer to the table below for more
          details about token supply, rewards, and lucky miner percentages for
          each planet.
        </p>

        <div className="bg-gray-300 rounded-md overflow-hidden text-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left ">
              <thead>
                <tr className="text-white bg-[#1E1E1E] ">
                  <th className="py-2 px-1 text-center ">#</th>
                  <th className="py-2 text-center">% of supply</th>
                  <th className="py-2 text-center">$XOOB</th>
                  <th className="py-2 text-center">Lucky % from block</th>
                  <th className="py-2 px-3 text-center ">Day</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr
                    key={index}
                    className={`text-white  rounded-lg ${row.className} `}
                  >
                    <td className="py-2 pl-2 text-center">{row.planet}</td>
                    <td className="py-2 text-center">{row.supply}</td>
                    <td className="py-2 text-center">${row.xoob}</td>
                    <td className="py-2 text-center">{row.lucky}</td>
                    <td className="py-2  text-center">{row.day}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "What is energy?",
    content: (
      <div className="space-y-3 text-sm font-[300]">
        <p>
          Energy is the 'fuel' for your spaceship that mines $XOOB tokens. If
          you don't have enough energy to participate in block mining, the
          process will stop until you accumulate the required amount of energy.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            At the initial stage, 100 energy is required to participate in
            mining a block.
          </li>
          <li>
            At the initial stage, 100 energy is required to participate in
            mining a block.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "How do boosters work?",
    content: (
      <div className="space-y-3 text-sm font-[300]">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            How do boosters work?
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Instantly adds a fixed amount of energy.</li>
              <li>
                Currently, you can purchase up to 2,500 energy at a time, with
                no limit on the number of purchases.
              </li>
            </ul>
          </li>
          <li>
            Energy Recovery Booster:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Increases the rate of energy recovery.</li>
              <li>
                By default, all users regenerate 1 energy per second. Boosters
                can increase this rate by +10% to +20%, raising the recovery
                rate to 1.1 or 1.2 energy per second.
              </li>
              <li>
                The maximum recovery boost available in the store is +100%,
                allowing for 2 energy per second. However, boosters obtained
                from mystical chests have no limit, and the recovery rate can
                exceed 2 energy per second.
              </li>
            </ul>
          </li>
        </ol>
      </div>
    ),
  },
  {
    title: "How will you prevent bots and dishonest token mining?",
    content: (
      <p className="text-sm font-[300]">
        All tokens mined dishonestly or using bots will be confiscated and
        redirected to support the project's growth and future development.
      </p>
    ),
  },
  {
    title: "How many accounts, devices, and IPs can I use?",
    content: (
      <p className="text-sm font-[300]">
        We do not limit the number of devices you can use or monitor changes to
        your IP address—these will not affect your ability to mine. You can mine
        from your smartphone, tablet, or computer.
      </p>
    ),
  },
  {
    title: "What is a Multiplier Box?",
    content: (
      <div className="space-y-3 text-sm font-[300]">
        <p>
          A Multiplier Box is a special box that allows you to increase your
          ship's multiplier and improve your mining results.
        </p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            What does the Multiplier Box give you? <br /> A ship multiplier
            boost — the higher the multiplier, the more $XOOB you can mine.
            Additional energy for mining and faster recovery.
          </li>
          <li>
            How does it work? <br /> When you open the box, you can get a
            multiplier from x0.25 to x10. You can only open the Multiplier Box
            if you have a Legendary ship (x30) or a Diamond ship (x50). The
            multiplier carries over when you upgrade to a new ship.
          </li>
          <li>
            What is the maximum multiplier you can get? <br /> The maximum
            multiplier you can reach is x200.
          </li>
        </ol>
      </div>
    ),
  },
];

const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex overflow-y-scroll  bg-[#342B48] text-white  font-roboto "
        >
          <div className="flex flex-col h-full p-4 w-full ">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-white hover:text-gray-700 focus:outline-none"
            >
              <IoCloseSharp size={24} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold">ATM FAQ </h2>
            </div>

            <div className="w-full space-y-2 last:pb-28">
              {FAQ_DATA.map((item, index) => (
                <div key={index} className="">
                  <button
                    className="flex justify-between items-center w-full pt-3 pb-2 text-left font-medium  hover:bg-gray-200 duration-200 outline-none"
                    onClick={() => toggleAccordion(index)}
                  >
                    <span className="text-lg">{item.title}</span>
                    <motion.div
                      animate={{ rotate: activeIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg
                        className="w-[18px] h-[18px]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </motion.div>
                  </button>

                  <div className="border-t pt-2 border-t-gray-200">
                    <AnimatePresence>
                      {activeIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4">{item.content}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FAQModal;
