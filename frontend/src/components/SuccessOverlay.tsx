import React, { useState, useEffect } from 'react';

interface SuccessPageProps {
  onFinish: () => void;
}

const SuccessOverlay: React.FC<SuccessPageProps> = ({ onFinish }) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      onFinish();
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prevCountdown => prevCountdown - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onFinish]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in"
      aria-live="assertive"
      role="alert"
    >
      <div className="text-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-green-500 mb-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-5xl md:text-6xl font-extrabold">
          VOTE CAST SUCCESSFULLY
        </h2>
        <p className="text-xl text-gray-300 mt-4 max-w-lg mx-auto">
          Thank you for your participation.
        </p>
        <div className="mt-12 text-center text-gray-400">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-brand-primary h-2.5 rounded-full" style={{ width: `${(10 - countdown) * 10}%`, transition: 'width 1s linear' }}></div>
            </div>
            <p className="mt-3 text-lg">
                Resetting for next voter in <span className="font-bold text-white">{countdown}</span> second{countdown !== 1 ? 's' : ''}...
            </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessOverlay;