"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SHOW_AFTER = 400;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed bottom-24 right-4 z-[54] flex w-14 justify-center sm:right-6">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#082F63]/10 bg-white/95 text-[#082F63] shadow-[0_4px_20px_rgba(8,47,99,0.1)] backdrop-blur-sm transition hover:border-[#C89B3C]/50 hover:bg-[#082F63] hover:text-[#C89B3C]"
          >
            <ArrowUp size={17} strokeWidth={1.25} aria-hidden />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
