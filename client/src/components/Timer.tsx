import React, { useState, useEffect } from 'react';

interface TimerProps {
  start: number;
  end?: number;
}

const Timer: React.FC<TimerProps> = ({ start, end }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    // Reset to 0 whenever the game starts (start changes)
    setElapsed(0);

    if (end) {
      // Game already ended — stop updating, keep last value
      return;
    }

    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [start, end]);

  return (
    <div className="timer">
      <img src="/assets/timer.svg" alt="Timer" style={{ width: 24, height: 24, marginRight: 8 }} />
      <span>{elapsed}s</span>
    </div>
  );
};

export default Timer;
