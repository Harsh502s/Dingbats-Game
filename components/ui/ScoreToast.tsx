import { motion, AnimatePresence } from 'framer-motion';

export function ScoreToast({ points, visible }: { points: number | null, visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && points !== null && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center space-x-2 z-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
          <span>+{points} pts!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
