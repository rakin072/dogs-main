import React from "react";
import {   walletImage, woodLeague } from "../images";

import { FaAngleRight } from "react-icons/fa6";
import { useTonConnectUI } from "@tonconnect/ui-react";

interface HeaderProps {
  address: string;
  setActivePage: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  address,
  setActivePage
}) => {
  const [tonConnectUI] = useTonConnectUI();

  return (
    <header className="relative w-full px-3 mt-4   ">
      <div className="flex flex-row items-center justify-between w-full ">
        <div className="p-1 rounded-lg bg-gradient-to-r from-[#342B48] to-[#433754] border border-yellow-400/30 shadow-lg">
          <button
            onClick={() => setActivePage("league")}
            className="self-start p-1.5 rounded-full text-xs text-white flex gap-2 justify-center items-center hover:bg-yellow-400/20 transition-all duration-200 group"
          >
            <div className="relative">
              <img src={woodLeague} className="w-[24px] h-[24px] group-hover:scale-110 transition-transform duration-200" alt="" />
              <div className="absolute -inset-1 bg-yellow-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
            <span className="font-semibold group-hover:text-yellow-300 transition-colors duration-200">Wood</span>
            <FaAngleRight className="text-yellow-400 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        <div className="p-1 rounded-lg bg-gradient-to-r from-[#342B48] to-[#433754] border border-yellow-400/30 shadow-lg">
          <button
            onClick={() => {
              if (address) {
                tonConnectUI.disconnect();
              } else {
                tonConnectUI.connectWallet();
              }
            }}
            className="flex items-center justify-center p-1.5 rounded-full shadow-md transition-all hover:bg-yellow-400/20 group"
          >
            {address ? (
              <span className="text-white text-xs font-bold px-2 group-hover:text-yellow-300 transition-colors duration-200">
                Disconnect
              </span>
            ) : (
              <>
                <img src={walletImage} className="w-[24px] h-[24px] group-hover:scale-110 transition-transform duration-200" alt="" />
                <span className="text-white flex items-center gap-1 text-xs font-bold px-2 group-hover:text-yellow-300 transition-colors duration-200">
                  Connect Wallet
                  <FaAngleRight className="text-yellow-400 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
