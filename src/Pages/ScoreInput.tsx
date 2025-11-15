import React, { useState, useEffect, useCallback } from "react";
import type {
  Game,
  Inning,
  AtBat,
  RunnerInfo,
  RunnerAdvance,
  RunnerAdvanceReason,
  PitchResult,
  BattingResult,
  Base,
  GameAction,
  ScreenType,
  HitType,
  HitDirection,
  Position,
  BuntType,
} from "../types/baseball";
import {
  getOrCreateInning,
  getCurrentRunners as getCurrentRunnersUtil,
  getInningScore,
  getTeamHits,
  getTeamErrors,
  calculateForcedAdvances,
  updateInningAndGame,
  applyAction,
  recalculateOuts,
} from "../utils/gameUtils";
import { InputPanel } from "./ScoreInput/components/InputPanel";
import { RunnerAdvanceModal } from "./ScoreInput/components/RunnerAdvanceModal";

const ScoreInput: React.FC = () => {
  const [lineup] = useState<string[]>([
    "打者1",
    "打者2",
    "打者3",
    "打者4",
    "打者5",
    "打者6",
    "打者7",
    "打者8",
    "打者9",
  ]);

  const [gameState, setGameState] = useState<{
    game: Game;
    history: GameAction[];
    historyIndex: number;
  }>({
    game: {
      id: "1",
      date: new Date().toISOString().split("T")[0],
      homeTeam: "巨人",
      awayTeam: "阪神",
      innings: [],
      currentInning: 1,
      currentTopBottom: "top",
      homeScore: 0,
      awayScore: 0,
      lineup,
    },
    history: [],
    historyIndex: -1,
  });

  const [currentBatterIndex, setCurrentBatterIndex] = useState(0);
  const [currentOuts, setCurrentOuts] = useState(0);
  const [currentAtBat, setCurrentAtBat] = useState<{
    pitches: Array<{
      result: PitchResult;
      count: { balls: number; strikes: number };
    }>;
    strikes: number;
    balls: number;
  }>({
    pitches: [],
    strikes: 0,
    balls: 0,
  });

  const [isRunnerModalOpen, setIsRunnerModalOpen] = useState(false);
  const [lastAtBatBatterName, setLastAtBatBatterName] = useState<string>("");

  const [currentScreen, setCurrentScreen] = useState<ScreenType>("pitch");
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>([]);

  // 画面遷移を管理する関数（履歴を記録）
  const navigateToScreen = (screen: ScreenType) => {
    setScreenHistory((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
  };

  // 一つ前の画面に戻る関数
  const goBack = () => {
    if (screenHistory.length > 0) {
      const previousScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory((prev) => prev.slice(0, -1));
      setCurrentScreen(previousScreen);
    } else {
      // 履歴がない場合はpitch画面に戻る
      setCurrentScreen("pitch");
    }
  };

  const inputStep =
    currentScreen === "batting"
      ? "batted"
      : currentScreen === "result"
      ? "result"
      : currentScreen === "buntType"
      ? "buntType"
      : "pitch";
  const setInputStep = (step: "pitch" | "batted" | "result" | "buntType") => {
    if (step === "batted") setCurrentScreen("batting");
    else if (step === "result") setCurrentScreen("result");
    else if (step === "buntType") setCurrentScreen("buntType");
    else setCurrentScreen("pitch");
  };

  const [selectedHitDirection, setSelectedHitDirection] = useState<
    HitDirection | ""
  >("");
  const [selectedHitType, setSelectedHitType] = useState<HitType | "">("");
  const [selectedPosition, setSelectedPosition] = useState<Position | "">("");
  const [buntType, setBuntType] = useState<BuntType | "">("");

  const [runnerActionType, setRunnerActionType] = useState<
    "stolenBase" | "pickoff" | "wildPitch" | "passedBall" | "balk" | ""
  >("");

  const [pendingAtBat, setPendingAtBat] = useState<AtBat | null>(null);

  // 現在のイニング取得
  const getCurrentInning = useCallback((): Inning => {
    return getOrCreateInning(
      gameState.game,
      gameState.game.currentInning,
      gameState.game.currentTopBottom,
      currentOuts,
      setGameState
    );
  }, [gameState.game, currentOuts]);

  // 現在の走者取得
  const getCurrentRunners = useCallback((): RunnerInfo[] => {
    const currentInning = getCurrentInning();
    return getCurrentRunnersUtil(currentInning);
  }, [getCurrentInning]);

  const getInningScoreUtil = (
    inningNumber: number,
    topBottom: "top" | "bottom"
  ): number => {
    return getInningScore(gameState.game.innings, inningNumber, topBottom);
  };

  const getTeamHitsUtil = (topBottom: "top" | "bottom"): number => {
    return getTeamHits(gameState.game.innings, topBottom);
  };

  const getTeamErrorsUtil = (topBottom: "top" | "bottom"): number => {
    return getTeamErrors(gameState.game.innings, topBottom);
  };

  // 振り逃げ条件判定（1塁不占有 or 2アウト）
  const canDroppedThirdStrike = useCallback((): boolean => {
    const runners = getCurrentRunners();
    const hasRunnerOnFirst = runners.some((r) => r.base === 1);
    return !hasRunnerOnFirst || currentOuts >= 2;
  }, [getCurrentRunners, currentOuts]);

  // インフィールドフライ条件判定
  const checkInfieldFlyCondition = useCallback((): boolean => {
    const runners = getCurrentRunners();
    const runnerBases = runners.map((r) => r.base).sort();
    const isIFCondition =
      ((currentOuts === 0 || currentOuts === 1) &&
        runnerBases.length === 2 &&
        runnerBases.includes(1) &&
        runnerBases.includes(2)) ||
      (runnerBases.length === 2 &&
        runnerBases.includes(1) &&
        runnerBases.includes(3)) ||
      runnerBases.length === 3;
    return isIFCondition;
  }, [getCurrentRunners, currentOuts]);

  // 強制進塁連鎖計算（四球/死球/申告敬遠時）
  const calculateForcedAdvancesUtil = useCallback(
    (batterToBase: Base): RunnerAdvance[] => {
      const runners = getCurrentRunners();
      return calculateForcedAdvances(batterToBase, runners);
    },
    [getCurrentRunners]
  );

  // 四球/申告敬遠のAtBatを作成する共通ヘルパー
  const createWalkAtBat = useCallback(
    (
      pitches: Array<{
        result: PitchResult;
        count: { balls: number; strikes: number };
      }>,
      reason: RunnerAdvanceReason = "BB"
    ): AtBat => {
      const currentBatter = lineup[currentBatterIndex];
      const forcedAdvances = calculateForcedAdvancesUtil(1);

      const batterAdvance: RunnerAdvance = {
        runnerId: "BR",
        fromBase: 0,
        toBase: 1,
        reason,
        scored: false,
        out: false,
        runnerName: currentBatter,
      };

      const allAdvances = [batterAdvance, ...forcedAdvances];
      const scoredCount = allAdvances.filter(
        (a) => a.scored || a.toBase === 4
      ).length;

      return {
        batterName: currentBatter,
        battingResult: "walk",
        pitches,
        outs: 0,
        rbis: scoredCount,
        runnerAdvances: allAdvances,
        timestamp: new Date().toISOString(),
      };
    },
    [lineup, currentBatterIndex, calculateForcedAdvancesUtil]
  );

  // 投球結果処理
  const handlePitchResult = (result: PitchResult) => {
    let newStrikes = currentAtBat.strikes;
    let newBalls = currentAtBat.balls;

    if (
      result === "strike" ||
      result === "swingingMiss" ||
      result === "calledStrike"
    ) {
      newStrikes++;
      if (newStrikes >= 3) {
        if (canDroppedThirdStrike()) {
          navigateToScreen("runner");
          setPendingAtBat({
            batterName: lineup[currentBatterIndex],
            battingResult: "strikeout",
            pitches: [
              ...currentAtBat.pitches,
              { result, count: { balls: newBalls, strikes: newStrikes } },
            ],
            outs: 0,
            rbis: 0,
            droppedThirdStrike: true,
            strikeoutType: "droppedThird",
          });
          return;
        } else {
          completeAtBat("strikeout");
          return;
        }
      }
    } else if (result === "ball") {
      newBalls++;
      if (newBalls >= 4) {
        // 四球: 共通ヘルパーを使用してAtBatを作成し、saveAtBatWithPendingで打者進行とアウト処理を完結
        const atBat = createWalkAtBat(
          [
            ...currentAtBat.pitches,
            { result, count: { balls: newBalls, strikes: newStrikes } },
          ],
          "BB"
        );
        saveAtBatWithPending(atBat);
        resetAtBatInputs();
        return;
      }
    } else if (result === "foul") {
      if (newStrikes < 2) newStrikes++;
    } else if (result === "foulTip") {
      newStrikes++;
      if (newStrikes >= 3) {
        completeAtBat("strikeout");
        return;
      }
      const runners = getCurrentRunners();
      if (runners.length > 0) {
        setCurrentScreen("runner");
      }
    } else if (result === "hitByPitch") {
      // 死球: 打者(BR)の進塁を含めてRunnerAdvanceModalで処理
      const advances = calculateForcedAdvancesUtil(1);
      setLastAtBatBatterName(lineup[currentBatterIndex]);
      setPendingAtBat({
        batterName: lineup[currentBatterIndex],
        battingResult: "hitByPitch",
        pitches: [
          ...currentAtBat.pitches,
          { result, count: { balls: newBalls, strikes: newStrikes } },
        ],
        outs: 0,
        rbis: 0,
        runnerAdvances: advances,
      });
      setIsRunnerModalOpen(true);
      setRunnerActionType(""); // 汎用モーダルとして開く
      return;
    } else if (result === "hit") {
      navigateToScreen("batting");
      return;
    } else if (result === "bunt") {
      if (newStrikes >= 2) {
        completeAtBat("strikeout");
        return;
      }
      navigateToScreen("buntType");
      return;
    }

    setCurrentAtBat({
      ...currentAtBat,
      strikes: newStrikes,
      balls: newBalls,
      pitches: [
        ...currentAtBat.pitches,
        { result, count: { balls: newBalls, strikes: newStrikes } },
      ],
    });
  };

  // 打席完了処理
  const completeAtBat = (result: BattingResult) => {
    const currentBatter = lineup[currentBatterIndex];
    let outs = 0;
    if (result === "strikeout") outs = 1;
    else if (result === "doublePlay") outs = 2;
    else if (result === "triplePlay") outs = 3;
    else if (result === "sacrificeBunt" || result === "sacrificeFly") outs = 1;

    const atBat: AtBat = {
      batterName: currentBatter,
      battingResult: result,
      pitches: currentAtBat.pitches,
      outs,
      rbis: 0,
      hitDirection: selectedHitDirection || undefined,
      hitType: selectedHitType || undefined,
      position: selectedPosition || undefined,
      buntType: (buntType || undefined) as BuntType | undefined,
      timestamp: new Date().toISOString(),
    };

    if (
      [
        "single",
        "double",
        "triple",
        "homerun",
        "sacrificeFly",
        "walk",
        "hitByPitch",
      ].includes(result)
    ) {
      saveAtBatWithPending(atBat, false);
      setLastAtBatBatterName(currentBatter);
      setIsRunnerModalOpen(true);
    } else {
      saveAtBatWithPending(atBat);
    }

    resetAtBatInputs();
  };

  const saveAtBatWithPending = (
    atBat: AtBat,
    shouldAdvanceBatter: boolean = true
  ) => {
    const currentInning = getCurrentInning();
    const updatedInning = {
      ...currentInning,
      atBats: [...currentInning.atBats, atBat],
      outs: (currentOuts + atBat.outs) % 3,
    };

    const action: GameAction = {
      type: "EVENT_ADD",
      undoable: true,
      payload: { inning: updatedInning, atBat },
      timestamp: new Date().toISOString(),
      apply: (game: Game) => {
        const updatedInnings = game.innings.map((i) =>
          i.inningNumber === updatedInning.inningNumber &&
          i.topBottom === updatedInning.topBottom
            ? updatedInning
            : i
        );
        return { ...game, innings: updatedInnings };
      },
      revert: (game: Game) => {
        const revertedAtBats = updatedInning.atBats.slice(0, -1);
        const revertedOuts = recalculateOuts(revertedAtBats);
        const revertedInning = {
          ...updatedInning,
          atBats: revertedAtBats,
          outs: revertedOuts,
        };
        const revertedInnings = game.innings.map((i) =>
          i.inningNumber === revertedInning.inningNumber &&
          i.topBottom === revertedInning.topBottom
            ? revertedInning
            : i
        );
        return { ...game, innings: revertedInnings };
      },
    };

    applyAction(action, setGameState);

    if (shouldAdvanceBatter) {
      const newOuts = currentOuts + atBat.outs;
      if (newOuts >= 3) {
        nextInning();
      } else {
        advanceBatter();
      }
      setCurrentOuts(newOuts % 3);
    }
  };

  const handleSaveRunnerAdvances = (advances: RunnerAdvance[]) => {
    const currentInning = getCurrentInning();
    const currentBatter = lastAtBatBatterName;

    if (pendingAtBat) {
      const scoredCount = advances.filter((a) => a.scored).length;
      const updatedAtBat = {
        ...pendingAtBat,
        batterName: pendingAtBat.batterName || currentBatter,
        runnerAdvances: advances,
        rbis: scoredCount,
      };

      const hasOuts = advances.some((a) => a.out) || updatedAtBat.outs > 0;
      if (hasOuts) {
        setPendingAtBat(updatedAtBat);
        setCurrentScreen("result");
        setIsRunnerModalOpen(false);
        return;
      }

      saveAtBatWithPending(updatedAtBat);
      setPendingAtBat(null);
      setIsRunnerModalOpen(false);
      setLastAtBatBatterName("");
      setCurrentScreen("pitch");
      return;
    }

    if (!currentBatter) {
      setIsRunnerModalOpen(false);
      return;
    }

    const updatedAtBats = [...currentInning.atBats];
    const lastIndex = updatedAtBats.length - 1;

    if (
      lastIndex >= 0 &&
      updatedAtBats[lastIndex].batterName === currentBatter
    ) {
      const scoredCount = advances.filter((a) => a.scored).length;
      const runnerOuts = advances.filter((a) => a.out).length;
      const lastAtBat = updatedAtBats[lastIndex];
      updatedAtBats[lastIndex] = {
        ...lastAtBat,
        runnerAdvances: advances,
        rbis: scoredCount,
      };

      const outsThisPlay = (lastAtBat.outs || 0) + runnerOuts;
      const newOuts = currentOuts + outsThisPlay;

      const updatedInning = {
        ...currentInning,
        atBats: updatedAtBats,
        score: currentInning.score + scoredCount,
        outs: newOuts % 3,
      };

      updateInningAndGame(updatedInning, setGameState);

      if (newOuts >= 3) {
        nextInning();
      } else {
        advanceBatter();
      }
      setCurrentOuts(newOuts % 3);
    }

    setIsRunnerModalOpen(false);
    setLastAtBatBatterName("");
    setCurrentScreen("pitch");
  };

  const handleUndo = () => {
    setGameState((prev) => {
      if (prev.historyIndex < 0) return prev;
      const action = prev.history[prev.historyIndex];
      const newGame = action.revert(prev.game);
      const updatedState = {
        ...prev,
        game: newGame,
        historyIndex: prev.historyIndex - 1,
      };

      // Undo後にcurrentOutsを再計算
      const currentInning = newGame.innings.find(
        (i) =>
          i.inningNumber === newGame.currentInning &&
          i.topBottom === newGame.currentTopBottom
      );
      if (currentInning) {
        const recalculatedOuts = recalculateOuts(currentInning.atBats);
        setCurrentOuts(recalculatedOuts);
      }

      return updatedState;
    });
  };

  const handleRedo = () => {
    setGameState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const action = prev.history[prev.historyIndex + 1];
      const newGame = action.apply(prev.game);
      const updatedState = {
        ...prev,
        game: newGame,
        historyIndex: prev.historyIndex + 1,
      };

      // Redo後にcurrentOutsを再計算
      const currentInning = newGame.innings.find(
        (i) =>
          i.inningNumber === newGame.currentInning &&
          i.topBottom === newGame.currentTopBottom
      );
      if (currentInning) {
        const recalculatedOuts = recalculateOuts(currentInning.atBats);
        setCurrentOuts(recalculatedOuts);
      }

      return updatedState;
    });
  };

  const advanceBatter = () => {
    setCurrentBatterIndex((prev) => (prev + 1) % lineup.length);
  };

  const nextInning = () => {
    setGameState((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        currentTopBottom:
          prev.game.currentTopBottom === "top" ? "bottom" : "top",
        currentInning:
          prev.game.currentTopBottom === "bottom"
            ? prev.game.currentInning + 1
            : prev.game.currentInning,
      },
    }));
    setCurrentOuts(0);
    setCurrentBatterIndex(0);
  };

  // 打撃結果選択時の処理
  const handleBattingResultSelect = (result: BattingResult) => {
    const currentBatter = lineup[currentBatterIndex];
    let outs = 0;
    let runnerAdvances: RunnerAdvance[] = [];

    if (result === "strikeout") outs = 1;
    else if (result === "doublePlay") outs = 2;
    else if (result === "triplePlay") outs = 3;
    else if (result === "sacrificeBunt" || result === "sacrificeFly") outs = 1;

    const runners = getCurrentRunners();

    if (result === "single") {
      runnerAdvances.push({
        runnerId: "BR",
        fromBase: 0,
        toBase: 1,
        reason: "Hit",
        scored: false,
        out: false,
        runnerName: currentBatter,
      });
      runners.forEach((runner) => {
        const newBase = Math.min(runner.base + 1, 4);
        runnerAdvances.push({
          runnerId: runner.runnerId,
          fromBase: runner.base as Base,
          toBase: newBase as Base,
          reason: "Hit",
          scored: newBase === 4,
          out: false,
          runnerName: runner.name,
        });
      });
    } else if (result === "double") {
      runnerAdvances.push({
        runnerId: "BR",
        fromBase: 0,
        toBase: 2,
        reason: "Hit",
        scored: false,
        out: false,
        runnerName: currentBatter,
      });
      runners.forEach((runner) => {
        const newBase = Math.min(runner.base + 2, 4);
        runnerAdvances.push({
          runnerId: runner.runnerId,
          fromBase: runner.base as Base,
          toBase: newBase as Base,
          reason: "Hit",
          scored: newBase === 4,
          out: false,
          runnerName: runner.name,
        });
      });
    } else if (result === "triple") {
      runnerAdvances.push({
        runnerId: "BR",
        fromBase: 0,
        toBase: 3,
        reason: "Hit",
        scored: false,
        out: false,
        runnerName: currentBatter,
      });
      runners.forEach((runner) => {
        const newBase = Math.min(runner.base + 3, 4);
        runnerAdvances.push({
          runnerId: runner.runnerId,
          fromBase: runner.base as Base,
          toBase: newBase as Base,
          reason: "Hit",
          scored: newBase === 4,
          out: false,
          runnerName: runner.name,
        });
      });
    } else if (result === "homerun") {
      runnerAdvances.push({
        runnerId: "BR",
        fromBase: 0,
        toBase: 4,
        reason: "Hit",
        scored: true,
        out: false,
        runnerName: currentBatter,
      });
      runners.forEach((runner) => {
        runnerAdvances.push({
          runnerId: runner.runnerId,
          fromBase: runner.base as Base,
          toBase: 4,
          reason: "Hit",
          scored: true,
          out: false,
          runnerName: runner.name,
        });
      });
    }

    const scoredCount = runnerAdvances.filter((a) => a.scored).length;

    const atBat: AtBat = {
      batterName: currentBatter,
      battingResult: result,
      pitches: currentAtBat.pitches,
      outs,
      rbis: scoredCount,
      hitDirection: selectedHitDirection || undefined,
      hitType: selectedHitType || undefined,
      position: selectedPosition || undefined,
      runnerAdvances: runnerAdvances.length > 0 ? runnerAdvances : undefined,
      timestamp: new Date().toISOString(),
    };

    setPendingAtBat(atBat);
  };

  // プレー終了ボタンの処理
  const handleFinishPlay = () => {
    if (pendingAtBat) {
      saveAtBatWithPending(pendingAtBat, true);
      setPendingAtBat(null);
    }

    resetAtBatInputs();
    setCurrentScreen("pitch");
  };

  const resetAtBatInputs = () => {
    setCurrentAtBat({ pitches: [], strikes: 0, balls: 0 });
    setInputStep("pitch");
    setSelectedHitDirection("");
    setSelectedHitType("");
    setSelectedPosition("");
    setBuntType("");
  };

  const handleSave = () => {
    localStorage.setItem(
      "baseballGame",
      JSON.stringify(gameState.game, null, 2)
    );
    alert("保存しました");
  };

  useEffect(() => {
    const saved = localStorage.getItem("baseballGame");
    if (saved) {
      try {
        const loadedGame = JSON.parse(saved);
        setGameState((prev) => ({ ...prev, game: loadedGame }));

        // ロード後にcurrentOutsを同期
        const currentInning = loadedGame.innings.find(
          (i: Inning) =>
            i.inningNumber === loadedGame.currentInning &&
            i.topBottom === loadedGame.currentTopBottom
        );
        if (currentInning) {
          const recalculatedOuts = recalculateOuts(currentInning.atBats);
          setCurrentOuts(recalculatedOuts);
        }
      } catch (e) {
        console.error("Failed to load game data", e);
      }
    }
  }, []);

  const runners = getCurrentRunners();
  const canUndo = gameState.historyIndex >= 0;
  const canRedo = gameState.historyIndex < gameState.history.length - 1;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ヘッダー */}
      <div className="bg-black px-3 py-2 flex items-center justify-between">
        <div className="flex gap-2">
          {canUndo && (
            <button
              onClick={handleUndo}
              className="px-3 py-1 bg-gray-700 rounded text-xs font-semibold"
            >
              ← 元に戻す
            </button>
          )}
          {canRedo && (
            <button
              onClick={handleRedo}
              className="px-3 py-1 bg-gray-700 rounded text-xs font-semibold"
            >
              やり直し →
            </button>
          )}
        </div>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-blue-700 rounded text-xs font-semibold"
        >
          保存
        </button>
      </div>

      {/* スコアボード */}
      <div className="bg-gradient-to-b from-gray-900 to-black px-2 py-2">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left px-1 w-12 text-[10px]">チーム</th>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((i) => (
                <th key={i} className="px-0.5 w-5 text-[10px]">
                  {i}
                </th>
              ))}
              <th className="px-1 text-yellow-400 w-6 text-[10px]">計</th>
              <th className="px-1 w-5 text-[10px]">安</th>
              <th className="px-1 w-5 text-[10px]">失</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center border-t border-gray-700">
              <td className="text-left px-1 font-bold text-xs">
                {gameState.game.awayTeam}
              </td>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((i) => {
                const score = getInningScoreUtil(i, "top");
                const isCurrent =
                  gameState.game.currentInning === i &&
                  gameState.game.currentTopBottom === "top";
                return (
                  <td
                    key={i}
                    className={`px-0.5 py-0.5 text-xs ${
                      isCurrent ? "bg-blue-600 font-bold" : ""
                    }`}
                  >
                    {score || "0"}
                  </td>
                );
              })}
              <td className="px-1 text-yellow-400 font-bold text-sm">
                {gameState.game.awayScore}
              </td>
              <td className="px-1 text-xs">{getTeamHitsUtil("top")}</td>
              <td className="px-1 text-xs">{getTeamErrorsUtil("top")}</td>
            </tr>
            <tr className="text-center border-t border-gray-700">
              <td className="text-left px-1 font-bold text-xs">
                {gameState.game.homeTeam}
              </td>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((i) => {
                const score = getInningScoreUtil(i, "bottom");
                const isCurrent =
                  gameState.game.currentInning === i &&
                  gameState.game.currentTopBottom === "bottom";
                return (
                  <td
                    key={i}
                    className={`px-0.5 py-0.5 text-xs ${
                      isCurrent ? "bg-blue-600 font-bold" : ""
                    }`}
                  >
                    {score || "0"}
                  </td>
                );
              })}
              <td className="px-1 text-yellow-400 font-bold text-sm">
                {gameState.game.homeScore}
              </td>
              <td className="px-1 text-xs">{getTeamHitsUtil("bottom")}</td>
              <td className="px-1 text-xs">{getTeamErrorsUtil("bottom")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 打者情報バー */}
      <div className="bg-blue-600 px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xs">
            {currentBatterIndex + 1}
          </div>
          <div className="font-bold text-sm">{lineup[currentBatterIndex]}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] opacity-80">B</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < currentAtBat.balls ? "bg-green-400" : "bg-blue-800"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] opacity-80">S</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < currentAtBat.strikes ? "bg-yellow-400" : "bg-blue-800"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-[10px] opacity-80">O</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < currentOuts ? "bg-red-400" : "bg-blue-800"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 野球場ビジュアル */}
      <div className="bg-black px-3 py-1">
        <svg viewBox="0 0 400 200" className="w-full max-w-xl mx-auto h-auto">
          <path
            d="M 200 180 L 140 120 L 200 60 L 260 120 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle
            cx="200"
            cy="140"
            r="14"
            fill="none"
            stroke="#888888"
            strokeWidth="1.5"
          />
          <path
            d="M 200 180 L 193 176 L 193 168 L 200 164 L 207 168 L 207 176 Z"
            fill="white"
            stroke="#333"
            strokeWidth="1"
          />
          <rect
            x="254"
            y="114"
            width="12"
            height="12"
            fill={runners.some((r) => r.base === 1) ? "#fbbf24" : "white"}
            stroke="#333"
            strokeWidth="1"
          />
          {runners.find((r) => r.base === 1) && (
            <text
              x="260"
              y="140"
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              {runners.find((r) => r.base === 1)?.name}
            </text>
          )}
          <rect
            x="194"
            y="54"
            width="12"
            height="12"
            fill={runners.some((r) => r.base === 2) ? "#fbbf24" : "white"}
            stroke="#333"
            strokeWidth="1"
            transform="rotate(45 200 60)"
          />
          {runners.find((r) => r.base === 2) && (
            <text
              x="200"
              y="48"
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              {runners.find((r) => r.base === 2)?.name}
            </text>
          )}
          <rect
            x="134"
            y="114"
            width="12"
            height="12"
            fill={runners.some((r) => r.base === 3) ? "#fbbf24" : "white"}
            stroke="#333"
            strokeWidth="1"
          />
          {runners.find((r) => r.base === 3) && (
            <text
              x="140"
              y="140"
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              {runners.find((r) => r.base === 3)?.name}
            </text>
          )}
        </svg>
      </div>

      {/* 入力パネル */}
      <InputPanel
        inputStep={inputStep}
        currentAtBat={currentAtBat}
        runners={runners}
        selectedHitType={selectedHitType}
        selectedHitDirection={selectedHitDirection}
        selectedPosition={selectedPosition}
        onPitchResult={handlePitchResult}
        onSetInputStep={setInputStep}
        onSetHitType={setSelectedHitType}
        onSetHitDirection={setSelectedHitDirection}
        onSetPosition={setSelectedPosition}
        onSetBuntType={setBuntType}
        onCompleteAtBat={completeAtBat}
        onOpenRunnerModal={(actionType) => {
          setRunnerActionType(actionType);
          setIsRunnerModalOpen(true);
        }}
        currentScreen={currentScreen}
        setCurrentScreen={navigateToScreen}
        onBack={goBack}
        canGoBack={screenHistory.length > 0 || currentScreen !== "pitch"}
        pendingAtBat={pendingAtBat}
        setPendingAtBat={setPendingAtBat}
        saveAtBatWithPending={saveAtBatWithPending}
        checkInfieldFlyCondition={checkInfieldFlyCondition}
        lineup={lineup}
        currentBatterIndex={currentBatterIndex}
        handleSaveRunnerAdvances={handleSaveRunnerAdvances}
        resetAtBatInputs={resetAtBatInputs}
        handleBattingResultSelect={handleBattingResultSelect}
        handleFinishPlay={handleFinishPlay}
        currentOuts={currentOuts}
        calculateForcedAdvances={calculateForcedAdvancesUtil}
      />

      {/* 走者進塁モーダル（オプション処理用） */}
      {isRunnerModalOpen && currentScreen === "pitch" && (
        <RunnerAdvanceModal
          isOpen={isRunnerModalOpen}
          onClose={() => {
            setIsRunnerModalOpen(false);
            setLastAtBatBatterName("");
            setRunnerActionType("");
          }}
          onSave={handleSaveRunnerAdvances}
          currentRunners={runners}
          currentBatterName={lastAtBatBatterName}
          actionType={runnerActionType}
          batterReason={
            pendingAtBat?.battingResult === "hitByPitch"
              ? "HBP"
              : pendingAtBat?.battingResult === "walk"
              ? "BB"
              : "Hit"
          }
        />
      )}
    </div>
  );
};

export default ScoreInput;
