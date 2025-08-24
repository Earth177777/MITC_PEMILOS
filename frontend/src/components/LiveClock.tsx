import React, { useState, useEffect } from 'react';

const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <div className="bg-blue-100 text-brand-primary font-semibold py-1 px-3 rounded-lg text-center">
      {time.toLocaleTimeString('en-GB')}
    </div>
  );
};

export default LiveClock;