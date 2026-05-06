import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Keyboard, Lock, Scissors } from "lucide-react";

interface Props {
  expectedCode: string;
  onUnlock: () => void;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export const TvLockScreen = ({ expectedCode, onUnlock }: Props) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [showSystemKb, setShowSystemKb] = useState(false);
  const max = expectedCode.length || 4;

  const press = (k: string) => {
    if (k === "del") {
      setCode((c) => c.slice(0, -1));
      setError(false);
      return;
    }
    if (!/\d/.test(k)) return;
    setCode((c) => (c.length >= max ? c : c + k));
    setError(false);
  };

  // physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Backspace") press("del");
      else if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Enter" && code.length === max) tryUnlock(code);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line
  }, [code, max]);

  const tryUnlock = (c: string) => {
    if (c === expectedCode) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => {
        setCode("");
        setError(false);
      }, 700);
    }
  };

  useEffect(() => {
    if (code.length === max) tryUnlock(code);
    // eslint-disable-next-line
  }, [code]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-white flex items-center justify-center">
      {/* atmospheric bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/70 via-black to-cyan-950/70" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.4) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center,black 30%,transparent 75%)",
        }}
      />
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <Scissors className="w-14 h-14 text-cyan-400 mx-auto drop-shadow-[0_0_20px_rgba(34,211,238,.8)]" />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-400/40 blur-xl"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
            DIEGCUTZ · MODO TV
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70 mt-2 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" /> Introduce el código
          </p>
        </div>

        {/* dots */}
        <motion.div
          animate={error ? { x: [-12, 12, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center gap-4 mb-10"
        >
          {Array.from({ length: max }).map((_, i) => {
            const filled = i < code.length;
            return (
              <motion.div
                key={i}
                animate={{ scale: filled ? 1.15 : 1 }}
                className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  error
                    ? "bg-red-500 border-red-400 shadow-[0_0_15px_rgba(239,68,68,.8)]"
                    : filled
                    ? "bg-cyan-400 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,.8)]"
                    : "border-white/30"
                }`}
              />
            );
          })}
        </motion.div>

        {/* keypad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) => {
            if (k === "")
              return (
                <button
                  key={i}
                  onClick={() => setShowSystemKb((s) => !s)}
                  className="aspect-square rounded-full text-cyan-300/70 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center transition-all"
                  aria-label="Mostrar teclado del dispositivo"
                  title="Mostrar teclado del dispositivo"
                >
                  <Keyboard className="w-6 h-6" />
                </button>
              );
            if (k === "del")
              return (
                <button
                  key={i}
                  onClick={() => press("del")}
                  className="aspect-square rounded-full text-fuchsia-300 hover:text-white hover:bg-fuchsia-500/20 border border-fuchsia-400/30 flex items-center justify-center transition-all"
                  aria-label="Borrar"
                >
                  <Delete className="w-6 h-6" />
                </button>
              );
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => press(k)}
                className="aspect-square rounded-full text-3xl font-light text-white bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/60 backdrop-blur-md transition-all shadow-[inset_0_0_20px_rgba(34,211,238,.05)] hover:shadow-[0_0_25px_rgba(34,211,238,.4)]"
              >
                {k}
              </motion.button>
            );
          })}
        </div>

        {/* hidden system keyboard input */}
        <AnimatePresence>
          {showSystemKb && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6"
            >
              <input
                autoFocus
                inputMode="numeric"
                pattern="\d*"
                maxLength={max}
                value={code}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, max);
                  setCode(v);
                  setError(false);
                }}
                className="w-full px-5 py-4 rounded-xl bg-black/60 border border-cyan-400/40 text-center text-2xl tracking-[0.5em] font-mono text-cyan-200 outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,.4)]"
                placeholder="••••"
              />
              <p className="mt-2 text-xs text-center text-cyan-300/60 uppercase tracking-widest">
                Teclado del dispositivo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};