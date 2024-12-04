'use client';
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import confetti from 'canvas-confetti';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Home() {
  const { publicKey } = useWallet();

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const fireFireworks = () => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

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
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);
  };

  const fireSchoolPride = () => {
    const end = Date.now() + (5 * 1000);

    const colors = ['#bb0000', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const fireCannon = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF4500'],
      angle: randomInRange(55, 125)
    });
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>
      
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-black/20 p-5 rounded-xl backdrop-blur-sm shadow-lg">
        <button 
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-purple-600 hover:to-indigo-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("Reset Timer clicked");
            fireConfetti();
          }}
        >
          <span className="relative z-10">Reset Timer</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
        
        <button 
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-emerald-600 hover:to-teal-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("I Won clicked");
            fireFireworks();
          }}
        >
          <span className="relative z-10">I Won</span>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
        
        <button 
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-rose-600 hover:to-pink-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("I Paid clicked");
            fireSchoolPride();
          }}
        >
          <span className="relative z-10">I Paid</span>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
        
        <button 
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg
            transform transition-all duration-200 ease-in-out
            hover:scale-105 hover:shadow-lg hover:from-amber-600 hover:to-orange-700
            active:scale-95 active:shadow-inner
            min-w-[170px] text-sm font-semibold
            border border-white/10 shadow-inner
            relative overflow-hidden group"
          onClick={() => {
            console.log("I Sent a Message clicked");
            fireCannon();
          }}
        >
          <span className="relative z-10">I Sent a Message</span>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>
    </div>
  );
}