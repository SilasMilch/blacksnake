/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useEffect, useRef, useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import styles from "./page.module.css";
import ShareButton from "./ShareButton";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [dir, setDir] = useState("RIGHT");
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const box = 20;
  const size = 20;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const dirRef = useRef(dir);

  // ✅ Öffnet den NFT-Mint-Link (Warpcast Compose mit Embed)
  const mintNFT = async () => {
    try {
      const mintUrl =
        "https://warpcast.com/~/compose?text=🎉%20Ich%20habe%20ein%20NFT%20freigeschaltet!&embeds[]=https://zora.co/coin/base:0x93b874314a4c5b96dd6844b322686ec0d54ec7ac";

      await sdk.actions.openUrl(mintUrl);
      console.log("🌐 Mint-Link geöffnet:", mintUrl);
      alert("🚀 Öffne Warpcast, um dein NFT zu claimen!");
    } catch (err) {
      console.error("❌ Fehler beim Öffnen des Mint-Links:", err);
      alert("Fehler beim Öffnen des NFT-Mint-Links 😢");
    }
  };

  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);

  const isOpposite = (a: string, b: string) =>
    (a === "LEFT" && b === "RIGHT") ||
    (a === "RIGHT" && b === "LEFT") ||
    (a === "UP" && b === "DOWN") ||
    (a === "DOWN" && b === "UP");

  const safeSetDir = useCallback((newDir: string) => {
    const cur = dirRef.current;
    if (newDir === cur) return;
    if (isOpposite(newDir, cur)) return;
    setDir(newDir);
    dirRef.current = newDir;
  }, []);

  // 🕹 Spiel-Logik
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const newDir = e.key.replace("Arrow", "").toUpperCase();
      if (["UP", "DOWN", "LEFT", "RIGHT"].includes(newDir)) setDir(newDir);
    };
    document.addEventListener("keydown", handleKey);

    const gameInterval = setInterval(() => {
      setSnake((prev) => {
        const head = { ...prev[0] };

        if (dir === "LEFT") head.x -= 1;
        if (dir === "RIGHT") head.x += 1;
        if (dir === "UP") head.y -= 1;
        if (dir === "DOWN") head.y += 1;

        // 💥 Kollision = Game Over
        if (
          head.x < 0 ||
          head.y < 0 ||
          head.x >= size ||
          head.y >= size ||
          prev.some((p) => p.x === head.x && p.y === head.y)
        ) {
          setGameOver(true);
          return [{ x: 10, y: 10 }];
        }

        // 🍎 Essen gefressen
        if (head.x === food.x && head.y === food.y) {
          setScore((s) => {
            const newScore = s + 10;

            // 🪙 Bei 100 Punkten NFT freischalten
            if (newScore >= 100 && s < 100) {
              mintNFT(); // ✅ Jetzt korrekt verwendet
            }

            return newScore;
          });

          setFood({
            x: Math.floor(Math.random() * size),
            y: Math.floor(Math.random() * size),
          });
          return [head, ...prev]; // wächst
        } else {
          return [head, ...prev.slice(0, -1)]; // bewegt sich
        }
      });
    }, 150);

    return () => {
      clearInterval(gameInterval);
      document.removeEventListener("keydown", handleKey);
    };
  }, [dir, food, score]);

  // 🎨 Zeichnen
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "lime";
    snake.forEach((s) => ctx.fillRect(s.x * box, s.y * box, box, box));
    ctx.fillStyle = "red";
    ctx.fillRect(food.x * box, food.y * box, box, box);
  }, [snake, food]);

  // 📱 Touch-Controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => e.preventDefault();

    const handleTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const start = touchStartRef.current;
      if (!start) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 30;
      if (absX < threshold && absY < threshold) return;
      if (absX > absY) {
        if (dx > 0) safeSetDir("RIGHT");
        else safeSetDir("LEFT");
      } else {
        if (dy > 0) safeSetDir("DOWN");
        else safeSetDir("UP");
      }
      touchStartRef.current = null;
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [safeSetDir]);

  // SDK Ready
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // 📳 Vibrationsfeedback
  useEffect(() => {
    if (gameOver && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        (navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean })
          ?.vibrate?.(200);
      } catch {}
    }
  }, [gameOver]);

  // 🔁 Restart
  const restartGame = () => {
    setScore(0);
    setSnake([{ x: 10, y: 10 }]);
    setDir("RIGHT");
    setGameOver(false);
  };

  // 🖥 Render
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>🐍 Snake Mini App</h1>
        <canvas
          ref={canvasRef}
          width={box * size}
          height={box * size}
          style={{ touchAction: "none" }}
        />
        <p>Score: {score}</p>
      </div>

      {gameOver && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>💀 Game Over!</h2>
            <p>Dein Score: {score}</p>
            <div className={styles.buttons}>
              <button onClick={restartGame}>🔁 Restart</button>
              <ShareButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
