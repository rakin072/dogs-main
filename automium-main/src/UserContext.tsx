import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Declare the global Telegram object to avoid TypeScript errors
declare global {
  interface Window {
    Telegram: any;
  }
}

// Define the shape of the context's value
interface UserContextType {
  userID: string;
  setUserID: (newID: string) => void;
  points: number;
  setPoints: (newPoints: number | ((prevPoints: number) => number)) => void;
  trd: number;
  setTrd: (newTrd: number | ((prevTrd: number) => number)) => void;
  isStar: boolean;
  setIsStar: (value: boolean) => void;
  invitedby: string;
  setInvitedby: (value: string) => void;
  walletid: string;
  setWalletAddress: (value: string) => void;
  isDataLoaded: boolean; // Indicates whether data has been loaded from Telegram
}

// Creating the context with default placeholder values
const UserContext = createContext<UserContextType>({
  userID: '',
  setUserID: () => {},
  points: 0,
  setPoints: () => {},
  trd: 0,
  setTrd: () => {},
  isStar: false,
  setIsStar: () => {},
  invitedby: '',
  setInvitedby: () => {},
  walletid: '',
  setWalletAddress: () => {},
  isDataLoaded: false,
});

// Provider component to wrap around the application
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userID, setUserID] = useState<string>('');
  const [points, setPoints] = useState<number>(0);
  const [trd, setTrd] = useState<number>(0);
  const [isStar, setIsStar] = useState<boolean>(false);
  const [invitedby, setInvitedby] = useState<string>('');
  const [walletid, setWalletAddress] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const extractTelegramData = () => {
      if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.setHeaderColor("#000000");

        const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
        const extractedUserID = initDataUnsafe.user?.id;
        const extractedIsStar = initDataUnsafe.user?.is_premium;
        const startParam = initDataUnsafe.start_param;

        // Only set data if Telegram has provided it
        if (extractedUserID !== undefined) {
          setUserID(extractedUserID);
        }
        if (extractedIsStar !== undefined) {
          setIsStar(extractedIsStar);
        }
        if (startParam && startParam.startsWith("invitedby_")) {
          setInvitedby(startParam.replace("invitedby_", ""));
        }

        // If wallet ID is part of Telegram data, extract and set it here
        // Example:
        // const extractedWalletID = initDataUnsafe.wallet?.id;
        // if (extractedWalletID) setWalletAddress(extractedWalletID);

        setIsDataLoaded(true);
        clearInterval(intervalId); // Stop polling once data is loaded
      }
    };

    // Initial attempt to extract data
    extractTelegramData();

    // Set up polling to check for Telegram data every 500ms
    intervalId = setInterval(extractTelegramData, 500);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <UserContext.Provider
      value={{
        userID,
        setUserID,
        points,
        setPoints,
        trd,
        setTrd,
        isStar,
        setIsStar,
        invitedby,
        setInvitedby,
        walletid,
        setWalletAddress,
        isDataLoaded,
      }}
    >
      {isDataLoaded ? children : null} {/* Only render children when data is loaded */}
    </UserContext.Provider>
  );
};

// Custom hook to make using the context easier in other components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
