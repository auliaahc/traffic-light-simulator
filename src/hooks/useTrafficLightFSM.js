import { useState, useEffect, useRef, useCallback } from "react";

const COLOR_DURATION = {
  red: 5,
  green: 4,
  yellow: 2,
};

const COLORS = {
  RED: "red",
  GREEN: "green",
  YELLOW: "yellow",
};

const NEXT_COLOR = {
  [COLORS.RED]: COLORS.GREEN,
  [COLORS.GREEN]: COLORS.YELLOW,
  [COLORS.YELLOW]: COLORS.RED,
};

export function useTrafficLightFSM() {
  const [currentColor, setCurrentColor] = useState(COLORS.RED);
  const [secondsLeft, setSecondsLeft] = useState(COLOR_DURATION.red);
  const [isPlaying, setIsPlaying] = useState(false);

  const rafRef = useRef(null);
  const intervalRef = useRef(null);
  const secondsLeftRef = useRef(COLOR_DURATION.red);
  const lastTickTimeRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const switchToNextColor = useCallback(() => {
    setCurrentColor((prev) => {
      const next = NEXT_COLOR[prev];
      secondsLeftRef.current = COLOR_DURATION[next];
      setSecondsLeft(COLOR_DURATION[next]);
      lastTickTimeRef.current = null;
      return next;
    });
  }, []);

  const updateCountdown = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = Date.now();
    if (lastTickTimeRef.current === null) {
      lastTickTimeRef.current = now;
    }

    const delta = (now - lastTickTimeRef.current) / 1000;
    lastTickTimeRef.current = now;

    secondsLeftRef.current = Math.max(0, secondsLeftRef.current - delta);
    setSecondsLeft(Math.ceil(secondsLeftRef.current));

    if (secondsLeftRef.current <= 0) {
      switchToNextColor();
    }
  }, [switchToNextColor]);

  const startAnimationLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const loop = () => {
      updateCountdown();
      if (isPlayingRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [updateCountdown]);

  const startTimer = useCallback(() => {
    if (!isPlayingRef.current) {
      setIsPlaying(true);
      lastTickTimeRef.current = Date.now();
      startAnimationLoop();

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (secondsLeftRef.current <= 0 && isPlayingRef.current) {
          switchToNextColor();
        }
      }, 100);
    }
  }, [startAnimationLoop, switchToNextColor]);

  const pauseTimer = useCallback(() => {
    setIsPlaying(false);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleTimer = useCallback(() => {
    isPlayingRef.current ? pauseTimer() : startTimer();
  }, [startTimer, pauseTimer]);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setCurrentColor(COLORS.RED);
    secondsLeftRef.current = COLOR_DURATION.red;
    setSecondsLeft(COLOR_DURATION.red);
    lastTickTimeRef.current = null;
  }, [pauseTimer]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    currentColor,
    secondsLeft,
    isPlaying,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    COLORS,
    NEXT_COLOR,
    COLOR_DURATION,
  };
}
