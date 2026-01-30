"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function BackgroundBlobs() {
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-cream"
      style={{
        top: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-peach-200 to-coral -top-[200px] -right-[100px]"
        style={{ y: backgroundY }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-lavender-soft to-lavender bottom-[20%] -left-[150px]"
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, -15, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-50 bg-gradient-to-br from-rose to-peach-300 top-[50%] right-[10%]"
        animate={{
          scale: [1, 1.08, 1],
          x: [0, 30, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
