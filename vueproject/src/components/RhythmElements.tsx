import { motion } from "motion/react";
import { useEffect, useState } from "react";

// maimai风格的八色环
export function MaimaiRing({ size = 200, className = "" }: { size?: number; className?: string }) {
  const segments = 8;
  const colors = [
    "#FF6B9D", // 粉
    "#C2E7FF", // 浅蓝
    "#FFA94D", // 橙
    "#B4E7CE", // 浅绿
    "#FFD93D", // 黄
    "#A5C9FF", // 蓝
    "#FF85A2", // 粉红
    "#D4F1F4", // 青
  ];

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {[...Array(segments)].map((_, i) => {
        const rotation = (360 / segments) * i;
        const isEven = i % 2 === 0;
        return (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              transformOrigin: "center",
              transform: `rotate(${rotation}deg)`,
            }}
            initial={{ opacity: 0.6 }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              delay: i * 0.125,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 origin-bottom"
              style={{
                width: `${size / 8}px`,
                height: `${size / 2}px`,
                background: `linear-gradient(to bottom, ${
                  isEven ? colors[i] : colors[(i + 1) % 8]
                }, transparent)`,
                clipPath: "polygon(40% 0%, 60% 0%, 50% 100%)",
              }}
            />
          </motion.div>
        );
      })}
      {/* 中心圆 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm"
        style={{ width: size * 0.3, height: size * 0.3 }}
      />
    </div>
  );
}

// 判定线动画
export function JudgmentLine({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-1 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-400 to-transparent"
        animate={{
          x: ["200%", "-100%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-cyan-500/50 to-pink-500/30" />
    </div>
  );
}

// 节奏方块
export function RhythmBeats({ count = 8, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
          animate={{
            height: ["20px", "60px", "20px"],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            delay: i * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// 节拍器
export function Metronome({ bpm = 120, className = "" }: { bpm?: number; className?: string }) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBeat((prev) => (prev + 1) % 4);
    }, (60 / bpm) * 1000);
    return () => clearInterval(interval);
  }, [bpm]);

  return (
    <div className={`flex gap-2 ${className}`}>
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-3 h-3 rounded-full ${
            i === beat
              ? "bg-cyan-400 shadow-lg shadow-cyan-400/50"
              : "bg-white/20"
          }`}
          animate={
            i === beat
              ? {
                  scale: [1, 1.4, 1],
                }
              : {}
          }
          transition={{
            duration: 0.2,
          }}
        />
      ))}
    </div>
  );
}

// 音符雨
export function NoteRain({ className = "" }: { className?: string }) {
  const notes = [
    { delay: 0, x: "10%", duration: 3 },
    { delay: 0.5, x: "30%", duration: 4 },
    { delay: 1, x: "50%", duration: 3.5 },
    { delay: 1.5, x: "70%", duration: 4.2 },
    { delay: 2, x: "90%", duration: 3.8 },
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {notes.map((note, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/60 to-purple-400/60 backdrop-blur-sm"
          style={{ left: note.x }}
          initial={{ y: -50, rotate: 0, opacity: 0 }}
          animate={{
            y: ["0vh", "120vh"],
            rotate: [0, 360],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: note.duration,
            delay: note.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// 简易音游演示（两个小角色）
export function MiniGameDemo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-64 h-40 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* 判定线 */}
      <div className="absolute bottom-12 left-0 right-0 h-0.5 bg-cyan-400/50" />
      
      {/* 下落的音符 */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-6 h-6 rounded bg-gradient-to-br from-pink-500 to-purple-500"
          style={{ left: `${25 + i * 25}%` }}
          animate={{
            y: [-20, 160],
          }}
          transition={{
            duration: 2,
            delay: i * 0.6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      
      {/* 玩家角色（左边） */}
      <motion.div
        className="absolute bottom-4 left-8 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1.4,
        }}
      />
      
      {/* 玩家角色（右边） */}
      <motion.div
        className="absolute bottom-4 right-8 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.6,
          delay: 0.7,
          repeat: Infinity,
          repeatDelay: 1.4,
        }}
      />
      
      {/* Perfect 特效 */}
      <motion.div
        className="absolute bottom-16 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-sm"
        initial={{ opacity: 0, y: 0, scale: 0.8 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: [0, -20],
          scale: [0.8, 1.2, 1.2, 0.8],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      >
        PERFECT
      </motion.div>
    </div>
  );
}

// 轨道式判定线（类似Arcaea）
export function ArcaeaTrack({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-32 ${className}`}>
      {/* 轨道线 */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute bottom-0 h-full border-l border-white/10"
          style={{ left: `${25 * (i + 1)}%` }}
        />
      ))}
      
      {/* 移动的音符 */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-12 h-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full"
          style={{ 
            left: `${10 + i * 20}%`,
            bottom: "20%",
          }}
          animate={{
            y: [-100, 0],
            opacity: [0, 1],
            scaleY: [0.5, 1],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.3,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* 判定线 */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
        animate={{
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            "0 0 10px rgba(34, 211, 238, 0.5)",
            "0 0 20px rgba(34, 211, 238, 1)",
            "0 0 10px rgba(34, 211, 238, 0.5)",
          ],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      />
    </div>
  );
}

// 圆形扩散波纹（点击效果）
export function RippleEffect({ x, y, color = "cyan" }: { x: number; y: number; color?: string }) {
  return (
    <motion.div
      className={`absolute w-20 h-20 rounded-full border-2 border-${color}-400`}
      style={{ left: x - 40, top: y - 40 }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}
