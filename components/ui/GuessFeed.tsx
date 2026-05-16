import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type GuessEntry = {
  id: string;
  playerName: string;
  correct: boolean;
  points?: number;
};

export function GuessFeed({ guesses }: { guesses: GuessEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [guesses]);

  return (
    <div ref={containerRef} className="w-full max-w-md h-48 overflow-y-auto bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
      <AnimatePresence>
        {guesses.map(guess => (
          <motion.div
            key={guess.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center space-x-2 text-sm font-medium ${guess.correct ? 'text-green-600' : 'text-gray-500'}`}
          >
            <span>{guess.playerName}</span>
            {guess.correct ? (
              <>
                <span>✓</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-green-100 rounded-full">+{guess.points}pts</span>
              </>
            ) : (
              <span className="text-red-400">✗</span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      {guesses.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          No guesses yet...
        </div>
      )}
    </div>
  );
}
