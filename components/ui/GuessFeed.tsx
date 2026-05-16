import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type GuessEntry = {
  id: string;
  playerId: string;
  playerName: string;
  correct: boolean;
  guessText?: string;
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
            className={`flex items-center justify-between text-sm font-medium p-2 rounded-lg group transition-all duration-300 ${guess.correct ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <span className="font-bold flex-shrink-0">{guess.playerName}:</span>
              <span 
                className={`italic transition-all duration-300 cursor-help select-none
                  ${guess.correct ? 'text-green-600' : 'text-gray-500'} 
                  blur-sm group-hover:blur-none`}
                title="Hover to reveal guess"
              >
                "{guess.guessText}"
              </span>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              {guess.correct ? (
                <>
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-200 text-green-800 rounded-full">+{guess.points}</span>
                </>
              ) : (
                <span className="text-red-400 font-bold">✗</span>
              )}
            </div>
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
