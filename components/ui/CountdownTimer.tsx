import { useEffect, useState, useRef } from 'react';

export function CountdownTimer({
  startedAt,
  duration = 30,
  paused = false,
  onExpire
}: {
  startedAt: string | null;
  duration?: number;
  paused?: boolean;
  onExpire?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onExpireRef = useRef(onExpire);
  // Tracks how many seconds were on the clock when pause began
  const frozenAt = useRef<number>(duration);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset when round changes
  useEffect(() => {
    expiredRef.current = false;
    frozenAt.current = duration;
    setTimeLeft(duration);
  }, [startedAt, duration]);

  useEffect(() => {
    if (!startedAt) return;

    if (paused) {
      // Snapshot the current remaining time so we can resume from here
      frozenAt.current = timeLeft;
      return;
    }

    // Running: count down from frozenAt relative to "now"
    const resumeTime = Date.now();
    const resumeRemaining = frozenAt.current;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - resumeTime) / 1000;
      const remaining = Math.max(0, resumeRemaining - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0 && !expiredRef.current) {
        expiredRef.current = true;
        if (onExpireRef.current) onExpireRef.current();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, paused]);

  const percentage = (timeLeft / duration) * 100;
  const isWarning = timeLeft <= 10;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" className="stroke-gray-100" strokeWidth="10" fill="none" />
        <circle
          cx="50" cy="50" r="45"
          className={`transition-colors duration-300 ${paused ? 'stroke-amber-400' : isWarning ? 'stroke-red-500' : 'stroke-brand-500'}`}
          strokeWidth="10"
          fill="none"
          strokeDasharray="283"
          strokeDashoffset={283 - (283 * percentage) / 100}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute font-bold text-lg ${paused ? 'text-amber-500' : isWarning ? 'text-red-500' : 'text-gray-700'}`}>
        {paused ? '⏸' : Math.ceil(timeLeft)}
      </span>
    </div>
  );
}
