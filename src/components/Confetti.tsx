import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
}

export function Confetti({ show, onComplete }: ConfettiProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);
  const [containerStyle, setContainerStyle] = useState({ width: "100vw", height: "100vh" });
  const [animationStyle, setAnimationStyle] = useState<{ transform: string; transformOrigin?: string }>({ transform: "scale(1)" });

  useEffect(() => {
    let mounted = true;

    fetch("/assets/Confetti.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load animation");
        return res.json();
      })
      .then((json) => {
        if (mounted) setAnimationData(json);
      })
      .catch((error) => {
        console.error("Failed to load confetti animation:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updateStyles = () => {
      const width = window.innerWidth;
      if (width <= 767) {
        setContainerStyle({ width: "100vw", height: "100vh" });
        setAnimationStyle({ transform: "scale(1.5)", transformOrigin: "center center" });
      } else if (width >= 768 && width <= 1023) {
        setContainerStyle({ width: "100vw", height: "100vh" });
        setAnimationStyle({ transform: "scale(1.2)", transformOrigin: "center center" });
      } else {
        setContainerStyle({ width: "100vw", height: "100vh" });
        setAnimationStyle({ transform: "scale(1)", transformOrigin: "center center" });
      }
    };

    updateStyles();
    window.addEventListener("resize", updateStyles);
    return () => window.removeEventListener("resize", updateStyles);
  }, []);

  useEffect(() => {
    if (!show || !animationData) return;

    setVisible(true);
    setFadingOut(false);

    const fadeTimer = setTimeout(() => setFadingOut(true), 2200);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
      onComplete?.();
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [show, animationData, onComplete]);

  if (!visible || !animationData) return null;

  console.log("Lottie =", Lottie);
  console.log("animationData =", animationData);

  const LottieComponent = (Lottie as any).default || Lottie;

  return (
    <div
      className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
      style={containerStyle}
    >
      <div className="absolute inset-0 bg-black/10" />
      <LottieComponent
        animationData={animationData}
        loop={false}
        autoplay
        className="absolute inset-0"
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover",
          ...animationStyle
        }}
      />
    </div>
  );
}
