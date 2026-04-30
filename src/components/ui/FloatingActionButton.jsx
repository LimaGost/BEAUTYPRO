import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

export default function FloatingActionButton({ actions }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-4 z-30" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 mb-2 space-y-2"
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 bg-black text-white px-4 py-3 rounded-xl shadow-lg hover:bg-gray-900 transition-colors whitespace-nowrap"
              >
                <action.icon className="w-5 h-5 gold-text" />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
          isOpen ? 'bg-gray-800' : 'gold-gradient'
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-black" />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}