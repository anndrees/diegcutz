import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface WinnerAnimationProps {
  open: boolean;
  onClose: () => void;
  winnerName: string;
  winnerUsername: string;
  giveawayTitle: string;
}

export const WinnerAnimation = ({ 
  open, 
  onClose, 
  winnerName, 
  winnerUsername,
  giveawayTitle 
}: WinnerAnimationProps) => {
  const [countdown, setCountdown] = useState(10);
  const [showWinner, setShowWinner] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (open) {
      setCountdown(10);
      setShowWinner(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || showWinner) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        // Play beep sound
        playBeep(countdown <= 3);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Show winner and trigger confetti
      setShowWinner(true);
      triggerConfetti();
    }
  }, [countdown, open, showWinner]);

  const playBeep = (isLast: boolean) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContext.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = isLast ? 880 : 440;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  const triggerConfetti = () => {
    // Multiple confetti bursts
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#00E5FF', '#7B2DFF', '#FF00FF', '#FFD700']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#00E5FF', '#7B2DFF', '#FF00FF', '#FFD700']
      });
    }, 250);

    // Big burst in the middle
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#00E5FF', '#7B2DFF', '#FF00FF', '#FFD700'],
      zIndex: 9999
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-background via-background to-neon-purple/20 border-2 border-neon-cyan overflow-hidden [&>button]:hidden">
        <div className="relative min-h-[400px] flex flex-col items-center justify-center py-8">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden">
            {!showWinner && (
              <div className="absolute inset-0 bg-gradient-to-t from-neon-purple/20 to-transparent animate-pulse" />
            )}
            {showWinner && (
              <>
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-neon-cyan/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-neon-purple/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              </>
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {!showWinner ? (
              <>
                {/* Countdown */}
                <p className="text-xl text-muted-foreground mb-4 animate-pulse">
                  Sorteando ganador de...
                </p>
                <p className="text-2xl font-bold text-neon-cyan mb-8">
                  "{giveawayTitle}"
                </p>
                
                <div className="relative">
                  {/* Pulsing ring */}
                  <div className={`absolute inset-0 rounded-full border-4 border-neon-cyan ${countdown <= 3 ? 'animate-ping' : 'animate-pulse'}`} 
                       style={{ 
                         width: '200px', 
                         height: '200px', 
                         margin: 'auto',
                         left: '50%',
                         top: '50%',
                         transform: 'translate(-50%, -50%)'
                       }} 
                  />
                  
                  {/* Number */}
                  <div 
                    key={countdown}
                    className={`text-[120px] font-black leading-none transition-all duration-300 ${
                      countdown <= 3 
                        ? 'text-destructive animate-bounce' 
                        : 'text-neon-cyan'
                    }`}
                    style={{
                      textShadow: countdown <= 3 
                        ? '0 0 30px rgba(239, 68, 68, 0.8)' 
                        : '0 0 30px rgba(0, 229, 255, 0.8)',
                      animation: 'scale-in 0.3s ease-out'
                    }}
                  >
                    {countdown}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Winner reveal */}
                <div className="animate-scale-in">
                  <div className="text-6xl mb-4">🎉🏆🎉</div>
                  
                  <p className="text-xl text-muted-foreground mb-2">
                    ¡El ganador de "{giveawayTitle}" es...!
                  </p>
                  
                  <div className="my-8 p-6 bg-gradient-to-r from-neon-cyan/20 via-neon-purple/20 to-neon-cyan/20 rounded-2xl border-2 border-neon-cyan animate-pulse">
                    <h2 className="text-4xl md:text-5xl font-black text-foreground mb-2">
                      {winnerName}
                    </h2>
                    <p className="text-2xl md:text-3xl font-bold text-neon-cyan">
                      @{winnerUsername}
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-2 text-4xl mb-8">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🎊</span>
                    <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🎉</span>
                    <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🥳</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🎈</span>
                    <span className="animate-bounce" style={{ animationDelay: '400ms' }}>🎊</span>
                  </div>
                  
                  <Button 
                    onClick={onClose} 
                    variant="neon" 
                    size="lg"
                    className="text-lg px-8"
                  >
                    ¡Genial!
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};