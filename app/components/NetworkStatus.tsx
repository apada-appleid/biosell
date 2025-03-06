"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    // Set up event listeners for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hide the offline message after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!isOnline) {
      setShowOfflineMessage(true);
      timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline]);

  if (!showOfflineMessage) {
    return null;
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${isOnline ? "bg-green-500" : "bg-red-500"} text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2`}>
      {!isOnline && (
        <>
          <WifiOff className="h-4 w-4" />
          <span>شما آفلاین هستید</span>
        </>
      )}
    </div>
  );
}; 