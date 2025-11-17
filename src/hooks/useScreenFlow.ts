import { useState, useCallback } from "react";
import type { ScreenType } from "../types/baseball";

export const useScreenFlow = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("pitch");
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>([]);

  const navigateToScreen = useCallback((screen: ScreenType) => {
    setScreenHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    if (screenHistory.length > 0) {
      const previousScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory((prev) => prev.slice(0, -1));
      setCurrentScreen(previousScreen);
    } else {
      setCurrentScreen("pitch");
    }
  }, [screenHistory]);

  const inputStep: "pitch" | "batted" | "result" | "buntType" =
    currentScreen === "batting"
      ? "batted"
      : currentScreen === "result"
      ? "result"
      : currentScreen === "buntType"
      ? "buntType"
      : "pitch";

  const setInputStep = useCallback((step: "pitch" | "batted" | "result" | "buntType") => {
    if (step === "batted") setCurrentScreen("batting");
    else if (step === "result") setCurrentScreen("result");
    else if (step === "buntType") setCurrentScreen("buntType");
    else setCurrentScreen("pitch");
  }, []);

  const canGoBack = screenHistory.length > 0 || currentScreen !== "pitch";

  return {
    currentScreen,
    setCurrentScreen,
    screenHistory,
    setScreenHistory,
    navigateToScreen,
    goBack,
    inputStep,
    setInputStep,
    canGoBack,
  };
};

