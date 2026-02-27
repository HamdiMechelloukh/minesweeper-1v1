import React, { useState, useEffect } from 'react';

interface TimerProps {
  start: number;
  end?: number;
}

const Timer: React.FC<TimerProps> = ({ start, end }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (end) {
      setTime(Math.floor((end - start) / 1000));
      return;
    }

    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [start, end]);

  return (
    <div className="timer">
      <img src="/assets/timer.svg" alt="Timer" style={{ width: 24, height: 24, marginRight: 8 }} />
      <span>{time}s</span>
    </div>
  );
};

export default Timer;
