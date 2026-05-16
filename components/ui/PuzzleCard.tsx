import { motion, AnimatePresence } from 'framer-motion';

export function PuzzleCard({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="w-full max-w-2xl aspect-[4/3] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative flex items-center justify-center">
      <AnimatePresence mode="wait">
        {imageUrl ? (
          <motion.img
            key={imageUrl}
            src={imageUrl}
            alt="Puzzle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-contain"
          />
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-400 font-medium"
          >
            No puzzle loaded
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
