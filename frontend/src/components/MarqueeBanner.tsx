import React, { useState, useEffect } from 'react';

interface MarqueeBannerProps {
  messages?: string[];
  rotationInterval?: number; // in milliseconds
}

const MarqueeBanner: React.FC<MarqueeBannerProps> = ({ 
  messages = [
    "CAST YOUR VOTE RESPONSIBLY. YOUR VOICE SHAPES THE FUTURE.",
    "EVERY VOTE COUNTS. MAKE YOUR CHOICE WISELY.",
    "PARTICIPATE IN DEMOCRACY. YOUR OPINION MATTERS.",
    "VOTE FOR CHANGE. VOTE FOR PROGRESS."
  ],
  rotationInterval = 4000
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => 
          (prevIndex + 1) % messages.length
        );
      }, rotationInterval);

      return () => clearInterval(interval);
    }
  }, [messages.length, rotationInterval]);

  const currentMessage = messages[currentMessageIndex];

  return (
    <div className="h-10 bg-brand-primary text-white flex items-center overflow-hidden">
      <div className="w-full animate-marquee-ltr whitespace-nowrap">
        <span className="text-md font-semibold mx-16">{currentMessage}</span>
        <span className="text-md font-semibold mx-16">{currentMessage}</span>
        <span className="text-md font-semibold mx-16">{currentMessage}</span>
        <span className="text-md font-semibold mx-16">{currentMessage}</span>
      </div>
    </div>
  );
};

export default MarqueeBanner;