import React, { useState, useEffect, useCallback } from "react";

// ============================================
// 型定義
// ============================================
type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF";
type Base = 0 | 1 | 2 | 3 | 4;

type PitchResult =
  | "strike"
  | "ball"
  | "foul"
  | "swingingMiss"
  | "calledStrike"
  | "foulTip"
  | "hitByPitch"
  | "hit"
  | "bunt";

type HitDirection = "left" | "leftCenter" | "center" | "rightCenter" | "right";
type HitType = "grounder" | "liner" | "fly" | "popup";

type BattingResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "strikeout"
  | "walk"
  | "hitByPitch"
  | "error"
  | "fieldersChoice"
  | "doublePlay"
  | "triplePlay"
  | "sacrificeBunt"
  | "sacrificeFly"
  | "stolenBase"
  | "caughtStealing"
  | "pickoff"
  | "pickoffError"
  | "wildPitch"
  | "passedBall"
  | "balk"
  | "interference"
  | "obstruction";

type AdvancedPlayType =
  | "normal"
  | "tagUp"
  | "rundown"
  | "cutoffPlay"
  | "relay"
  | "appeal";

type BuntType =
  | "sacrifice"
  | "safety"
  | "squeeze"
  | "delayedSqueeze"
  | "buster";

type RunnerAdvanceReason =
  | "SB"
  | "CS"
  | "SB+E"
  | "PO"
  | "POE"
  | "WP"
  | "PB"
  | "BK"
  | "DI"
  | "Hit"
  | "BB"
  | "HBP"
  | "SF"
  | "SH"
  | "E"
  | "FC"
  | "Award"
  | "Interference"
  | "Appeal"
  | "Return"
  | "Other";

type ErrorType = "catch" | "throw";
type AwardBasis = "TOP" | "TOT";

interface Pitch {
  result: PitchResult;
  count: { balls: number; strikes: number };
  timestamp?: string;
}

interface DefensivePlay {
  positions: Position[];
  playType: AdvancedPlayType;
  description?: string;
}

interface RunnerAdvance {
  runnerId: "BR" | "R1" | "R2" | "R3";
  fromBase: Base;
  toBase: Base;
  reason: RunnerAdvanceReason;
  fieldersPath?: string[];
  award?: "NONE" | "1B" | "2B";
  awardBasis?: AwardBasis;
  out?: boolean;
  scored?: boolean;
  runnerName?: string;
  playType?: AdvancedPlayType;
  defensivePlay?: DefensivePlay;
  notes?: string;
}

interface ErrorInfo {
  position: Position;
  type: ErrorType;
  description?: string;
}

interface AtBat {
  batterName: string;
  battingResult: BattingResult;
  pitches: Pitch[];
  outs: number;
  rbis: number;
  hitDirection?: HitDirection;
  hitType?: HitType;
  position?: Position;
  defensePath?: string[];
  defensivePositions?: Position[];
  errors?: ErrorInfo[];
  runnerAdvances?: RunnerAdvance[];
  outsOrder?: Array<"batter" | "R1" | "R2" | "R3">;
  thirdOutType?: "force" | "time";
  flags?: {
    IF_declared?: boolean;
    IF_drop?: boolean;
    ballDead?: boolean;
    balkAdvantage?: boolean;
    simultaneousAdvance?: boolean;
  };
  buntType?: BuntType;
  timestamp?: string;
}

interface Inning {
  inningNumber: number;
  topBottom: "top" | "bottom";
  atBats: AtBat[];
  score: number;
  outs: number;
}

interface Game {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  innings: Inning[];
  currentInning: number;
  currentTopBottom: "top" | "bottom";
  homeScore: number;
  awayScore: number;
  lineup: string[];
}

interface GameAction {
  type: "EVENT_ADD" | "EVENT_REMOVE" | "EVENT_MODIFY" | "INNING_CHANGE";
  undoable: boolean;
  payload: any;
  timestamp: string;
  apply: (game: Game) => Game;
  revert: (game: Game) => Game;
}

interface RunnerInfo {
  base: 1 | 2 | 3;
  name: string;
  runnerId: "R1" | "R2" | "R3";
}

// ============================================
// メインコンポーネント
// ============================================
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
    pitches: Pitch[];
    strikes: number;
    balls: number;
  }>({
    pitches: [],
    strikes: 0,
    balls: 0,
  });

  const [isRunnerModalOpen, setIsRunnerModalOpen] = useState(false);
  const [lastAtBatBatterName, setLastAtBatBatterName] = useState<string>("");

  // タブ管理用の状態
  const [activeTab, setActiveTab] = useState<"attack" | "runner" | "defense">(
    "attack"
  );

  const [inputStep, setInputStep] = useState<
    "pitch" | "batted" | "result" | "buntType"
  >("pitch");

  const [selectedHitDirection, setSelectedHitDirection] = useState<
    HitDirection | ""
  >("");
  const [selectedHitType, setSelectedHitType] = useState<HitType | "">("");
  const [selectedPosition, setSelectedPosition] = useState<Position | "">("");
  const [buntType, setBuntType] = useState<BuntType | "">("");

  const [runnerActionType, setRunnerActionType] = useState<
    "stolenBase" | "pickoff" | "wildPitch" | "passedBall" | "balk" | ""
  >("");

  // 仮の打席結果を保持
  const [pendingAtBat, setPendingAtBat] = useState<AtBat | null>(null);

  // 現在のイニング取得
  const getCurrentInning = useCallback((): Inning => {
    let inning = gameState.game.innings.find(
      (i) =>
        i.inningNumber === gameState.game.currentInning &&
        i.topBottom === gameState.game.currentTopBottom
    );
    if (!inning) {
      inning = {
        inningNumber: gameState.game.currentInning,
        topBottom: gameState.game.currentTopBottom,
        atBats: [],
        score: 0,
        outs: currentOuts,
      };
      setGameState((prev) => ({
        ...prev,
        game: {
          ...prev.game,
          innings: [...prev.game.innings, inning] as Inning[],
        },
      }));
    }
    return inning;
  }, [gameState.game, currentOuts]);

  // 現在の走者取得
  const getCurrentRunners = useCallback((): RunnerInfo[] => {
    const currentInning = getCurrentInning();
    const runners: RunnerInfo[] = [];
    const baseOccupied: Record<1 | 2 | 3, string | null> = {
      1: null,
      2: null,
      3: null,
    };

    currentInning.atBats.forEach((atBat) => {
      if (
        [
          "single",
          "double",
          "triple",
          "homerun",
          "walk",
          "hitByPitch",
        ].includes(atBat.battingResult || "")
      ) {
        if (atBat.runnerAdvances && atBat.runnerAdvances.length > 0) {
          atBat.runnerAdvances.forEach((advance) => {
            if (advance.fromBase === 0 && !advance.out && !advance.scored) {
              const toBase = advance.toBase;
              if (toBase >= 1 && toBase <= 3) {
                baseOccupied[toBase as 1 | 2 | 3] =
                  advance.runnerName || atBat.batterName;
              }
            }
            if (advance.fromBase >= 1 && advance.fromBase <= 3) {
              const fromBase = advance.fromBase as 1 | 2 | 3;
              const runnerName = baseOccupied[fromBase];
              if (runnerName && !advance.out) {
                baseOccupied[fromBase] = null;
                if (
                  !advance.scored &&
                  advance.toBase >= 1 &&
                  advance.toBase <= 3
                ) {
                  baseOccupied[advance.toBase as 1 | 2 | 3] = runnerName;
                }
              }
            }
          });
        } else {
          if (atBat.battingResult === "single" && !baseOccupied[1])
            baseOccupied[1] = atBat.batterName;
          else if (atBat.battingResult === "double" && !baseOccupied[2])
            baseOccupied[2] = atBat.batterName;
          else if (atBat.battingResult === "triple" && !baseOccupied[3])
            baseOccupied[3] = atBat.batterName;
          else if (
            (atBat.battingResult === "walk" ||
              atBat.battingResult === "hitByPitch") &&
            !baseOccupied[1]
          ) {
            baseOccupied[1] = atBat.batterName;
          }
        }
      }
    });

    Object.entries(baseOccupied).forEach(([base, name]) => {
      if (name) {
        const b = Number(base) as 1 | 2 | 3;
        runners.push({
          base: b,
          name,
          runnerId: `R${b}` as "R1" | "R2" | "R3",
        });
      }
    });
    return runners;
  }, [getCurrentInning]);

  const getInningScore = (
    inningNumber: number,
    topBottom: "top" | "bottom"
  ): number => {
    const inning = gameState.game.innings.find(
      (i) => i.inningNumber === inningNumber && i.topBottom === topBottom
    );
    return inning?.score || 0;
  };

  const getTeamHits = (topBottom: "top" | "bottom"): number => {
    return gameState.game.innings
      .filter((inning) => inning.topBottom === topBottom)
      .reduce((total, inning) => {
        return (
          total +
          inning.atBats.filter((atBat) =>
            ["single", "double", "triple", "homerun"].includes(
              atBat.battingResult || ""
            )
          ).length
        );
      }, 0);
  };

  const getTeamErrors = (topBottom: "top" | "bottom"): number => {
    return gameState.game.innings
      .filter((inning) => inning.topBottom === topBottom)
      .reduce((total, inning) => {
        return (
          total +
          inning.atBats.reduce(
            (sum, atBat) => sum + (atBat.errors?.length || 0),
            0
          )
        );
      }, 0);
  };

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
        completeAtBat("strikeout");
        return;
      }
    } else if (result === "ball") {
      newBalls++;
      if (newBalls >= 4) {
        completeAtBat("walk");
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
    } else if (result === "hitByPitch") {
      completeAtBat("hitByPitch");
      return;
    } else if (result === "hit") {
      setInputStep("batted");
      return;
    } else if (result === "bunt") {
      setInputStep("buntType");
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

  // クイックアクションからの結果処理
  const handleQuickBattingResult = (result: BattingResult) => {
    completeAtBat(result);
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
      buntType: buntType || undefined,
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
        const revertedInning = {
          ...updatedInning,
          atBats: updatedInning.atBats.slice(0, -1),
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

    applyAction(action);

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
      updatedAtBats[lastIndex] = {
        ...updatedAtBats[lastIndex],
        runnerAdvances: advances,
        rbis: scoredCount,
      };

      const updatedInning = {
        ...currentInning,
        atBats: updatedAtBats,
        score: currentInning.score + scoredCount,
      };

      updateInningAndGame(updatedInning);

      const lastAtBat = updatedAtBats[lastIndex];
      const newOuts = currentOuts + lastAtBat.outs;
      if (newOuts >= 3) {
        nextInning();
      } else {
        advanceBatter();
      }
      setCurrentOuts(newOuts % 3);
    }

    setIsRunnerModalOpen(false);
    setLastAtBatBatterName("");
  };

  const updateInningAndGame = (updatedInning: Inning) => {
    setGameState((prev) => {
      const updatedInnings = prev.game.innings.map((i) =>
        i.inningNumber === updatedInning.inningNumber &&
        i.topBottom === updatedInning.topBottom
          ? updatedInning
          : i
      );

      let homeScore = 0;
      let awayScore = 0;
      updatedInnings.forEach((inning) => {
        if (inning.topBottom === "top") awayScore += inning.score;
        else homeScore += inning.score;
      });

      return {
        ...prev,
        game: { ...prev.game, innings: updatedInnings, homeScore, awayScore },
      };
    });
  };

  const applyAction = (action: GameAction) => {
    setGameState((prev) => {
      const newGame = action.apply(prev.game);
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(action);
      return {
        game: newGame,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  };

  const handleUndo = () => {
    setGameState((prev) => {
      if (prev.historyIndex < 0) return prev;
      const action = prev.history[prev.historyIndex];
      const newGame = action.revert(prev.game);
      return {
        ...prev,
        game: newGame,
        historyIndex: prev.historyIndex - 1,
      };
    });
  };

  const handleRedo = () => {
    setGameState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const action = prev.history[prev.historyIndex + 1];
      const newGame = action.apply(prev.game);
      return {
        ...prev,
        game: newGame,
        historyIndex: prev.historyIndex + 1,
      };
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

  // プレー終了ボタンの処理
  const handleFinishPlay = () => {
    if (pendingAtBat) {
      saveAtBatWithPending(pendingAtBat, true);
      setPendingAtBat(null);
    }

    resetAtBatInputs();
    setActiveTab("attack");

    const newOuts = currentOuts + (pendingAtBat?.outs || 0);
    if (newOuts >= 3) {
      nextInning();
    } else {
      advanceBatter();
    }
    setCurrentOuts(newOuts % 3);
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
                const score = getInningScore(i, "top");
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
              <td className="px-1 text-xs">{getTeamHits("top")}</td>
              <td className="px-1 text-xs">{getTeamErrors("top")}</td>
            </tr>
            <tr className="text-center border-t border-gray-700">
              <td className="text-left px-1 font-bold text-xs">
                {gameState.game.homeTeam}
              </td>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((i) => {
                const score = getInningScore(i, "bottom");
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
              <td className="px-1 text-xs">{getTeamHits("bottom")}</td>
              <td className="px-1 text-xs">{getTeamErrors("bottom")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 打者情報バー - 続く */}
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
      />

      {/* 走者進塁モーダル */}
      {isRunnerModalOpen && (
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
        />
      )}
    </div>
  );
};

// ============================================
// QuickActionsBar コンポーネント
// ============================================
interface QuickActionsBarProps {
  currentOuts: number;
  currentRunners: RunnerInfo[];
  onBattingResult: (result: BattingResult) => void;
}

// ============================================
// InputPanel コンポーネント
// ============================================
interface InputPanelProps {
  inputStep: "pitch" | "batted" | "result" | "buntType";
  currentAtBat: { pitches: Pitch[]; strikes: number; balls: number };
  runners: RunnerInfo[];
  selectedHitType: HitType | "";
  selectedHitDirection: HitDirection | "";
  selectedPosition: Position | "";
  onPitchResult: (result: PitchResult) => void;
  onSetInputStep: (step: "pitch" | "batted" | "result" | "buntType") => void;
  onSetHitType: (type: HitType) => void;
  onSetHitDirection: (dir: HitDirection) => void;
  onSetPosition: (pos: Position) => void;
  onSetBuntType: (type: BuntType) => void;
  onCompleteAtBat: (result: BattingResult) => void;
  onOpenRunnerModal: (
    actionType: "stolenBase" | "pickoff" | "wildPitch" | "passedBall" | "balk"
  ) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  inputStep,
  currentAtBat,
  runners,
  selectedHitType,
  selectedHitDirection,
  selectedPosition,
  onPitchResult,
  onSetInputStep,
  onSetHitType,
  onSetHitDirection,
  onSetPosition,
  onSetBuntType,
  onCompleteAtBat,
  onOpenRunnerModal,
}) => {
  return (
    <div className="bg-gray-900 px-2 py-2 border-t border-gray-700 flex-1 overflow-y-auto">
      {inputStep === "pitch" && (
        <div>
          <h3 className="text-sm font-bold mb-3 text-gray-300">
            投球結果を選択
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => onPitchResult("strike")}
              className="py-3 bg-red-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ストライク
            </button>
            <button
              onClick={() => onPitchResult("ball")}
              className="py-3 bg-blue-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ボール
            </button>
            <button
              onClick={() => onPitchResult("foul")}
              className="py-3 bg-yellow-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ファウル
            </button>
            <button
              onClick={() => onPitchResult("swingingMiss")}
              className="py-3 bg-red-700 rounded-lg font-bold text-sm active:scale-95"
            >
              空振り
            </button>
            <button
              onClick={() => onPitchResult("calledStrike")}
              className="py-3 bg-red-800 rounded-lg font-bold text-sm active:scale-95"
            >
              見逃し
            </button>
            <button
              onClick={() => onPitchResult("foulTip")}
              className="py-3 bg-yellow-700 rounded-lg font-bold text-sm active:scale-95"
            >
              チップ
            </button>
            <button
              onClick={() => onPitchResult("hit")}
              className="py-3 bg-green-600 rounded-lg font-bold text-sm active:scale-95"
            >
              打球
            </button>
            <button
              onClick={() => onPitchResult("bunt")}
              className="py-3 bg-teal-600 rounded-lg font-bold text-sm active:scale-95"
            >
              バント
            </button>
            <button
              onClick={() => onPitchResult("hitByPitch")}
              className="py-3 bg-orange-600 rounded-lg font-bold text-sm active:scale-95"
            >
              死球
            </button>
          </div>

          {runners.length > 0 && (
            <div className="mt-3 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">⚡ 走者アクション</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenRunnerModal("stolenBase")}
                  className="py-2 bg-purple-600 rounded-lg font-bold text-xs"
                >
                  盗塁
                </button>
                <button
                  onClick={() => onOpenRunnerModal("pickoff")}
                  className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                >
                  牽制
                </button>
                <button
                  onClick={() => onOpenRunnerModal("wildPitch")}
                  className="py-2 bg-red-700 rounded-lg font-bold text-xs"
                >
                  暴投
                </button>
                <button
                  onClick={() => onOpenRunnerModal("passedBall")}
                  className="py-2 bg-red-800 rounded-lg font-bold text-xs"
                >
                  捕逸
                </button>
                <button
                  onClick={() => onOpenRunnerModal("balk")}
                  className="py-2 bg-pink-600 rounded-lg font-bold text-xs"
                >
                  ボーク
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {inputStep === "batted" && (
        <BattedBallInput
          selectedHitType={selectedHitType}
          selectedHitDirection={selectedHitDirection}
          selectedPosition={selectedPosition}
          onSetHitType={onSetHitType}
          onSetHitDirection={onSetHitDirection}
          onSetPosition={onSetPosition}
          onNext={() => onSetInputStep("result")}
        />
      )}

      {inputStep === "result" && (
        <ResultSelection onCompleteAtBat={onCompleteAtBat} />
      )}

      {inputStep === "buntType" && (
        <BuntTypeSelection
          onSelectBuntType={(type) => {
            onSetBuntType(type);
            onSetInputStep("batted");
          }}
        />
      )}
    </div>
  );
};

// ============================================
// 打球入力コンポーネント
// ============================================
interface BattedBallInputProps {
  selectedHitType: HitType | "";
  selectedHitDirection: HitDirection | "";
  selectedPosition: Position | "";
  onSetHitType: (type: HitType) => void;
  onSetHitDirection: (dir: HitDirection) => void;
  onSetPosition: (pos: Position) => void;
  onNext: () => void;
}

const BattedBallInput: React.FC<BattedBallInputProps> = ({
  selectedHitType,
  selectedHitDirection,
  selectedPosition,
  onSetHitType,
  onSetHitDirection,
  onSetPosition,
  onNext,
}) => {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">打球の種類と方向</h3>
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">種類</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "grounder", label: "ゴロ" },
            { value: "liner", label: "ライナー" },
            { value: "fly", label: "フライ" },
            { value: "popup", label: "ポップ" },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => onSetHitType(type.value as HitType)}
              className={`py-2 rounded font-semibold text-xs ${
                selectedHitType === type.value ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">守備位置</div>
        <div className="grid grid-cols-9 gap-1">
          {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map((pos) => (
            <button
              key={pos}
              onClick={() => onSetPosition(pos as Position)}
              className={`py-2 rounded font-bold text-xs ${
                selectedPosition === pos ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
      {selectedHitType && selectedHitDirection && selectedPosition && (
        <button
          onClick={onNext}
          className="w-full py-3 bg-green-600 rounded-lg font-bold active:scale-95"
        >
          結果を選択 →
        </button>
      )}
    </div>
  );
};

// ============================================
// 結果選択コンポーネント
// ============================================
interface ResultSelectionProps {
  onCompleteAtBat: (result: BattingResult) => void;
}

const ResultSelection: React.FC<ResultSelectionProps> = ({
  onCompleteAtBat,
}) => {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">プレー結果を選択</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onCompleteAtBat("single")}
          className="py-3 bg-green-600 rounded-lg font-bold text-sm active:scale-95"
        >
          単打
        </button>
        <button
          onClick={() => onCompleteAtBat("double")}
          className="py-3 bg-blue-600 rounded-lg font-bold text-sm active:scale-95"
        >
          二塁打
        </button>
        <button
          onClick={() => onCompleteAtBat("triple")}
          className="py-3 bg-purple-600 rounded-lg font-bold text-sm active:scale-95"
        >
          三塁打
        </button>
        <button
          onClick={() => onCompleteAtBat("homerun")}
          className="py-3 bg-red-600 rounded-lg font-bold text-sm active:scale-95"
        >
          本塁打
        </button>
        <button
          onClick={() => onCompleteAtBat("strikeout")}
          className="py-3 bg-gray-600 rounded-lg font-bold text-sm active:scale-95"
        >
          アウト
        </button>
        <button
          onClick={() => onCompleteAtBat("error")}
          className="py-3 bg-pink-600 rounded-lg font-bold text-sm active:scale-95"
        >
          失策
        </button>
        <button
          onClick={() => onCompleteAtBat("fieldersChoice")}
          className="py-3 bg-indigo-600 rounded-lg font-bold text-sm active:scale-95"
        >
          野選
        </button>
        <button
          onClick={() => onCompleteAtBat("doublePlay")}
          className="py-3 bg-gray-700 rounded-lg font-bold text-sm active:scale-95"
        >
          併殺
        </button>
        <button
          onClick={() => onCompleteAtBat("sacrificeBunt")}
          className="py-3 bg-teal-600 rounded-lg font-bold text-sm active:scale-95"
        >
          犠打
        </button>
        <button
          onClick={() => onCompleteAtBat("sacrificeFly")}
          className="py-3 bg-cyan-600 rounded-lg font-bold text-sm active:scale-95"
        >
          犠飛
        </button>
      </div>
    </div>
  );
};

// ============================================
// バント種類選択コンポーネント
// ============================================
interface BuntTypeSelectionProps {
  onSelectBuntType: (type: BuntType) => void;
}

const BuntTypeSelection: React.FC<BuntTypeSelectionProps> = ({
  onSelectBuntType,
}) => {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">バントの種類</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelectBuntType("sacrifice")}
          className="py-3 bg-teal-600 rounded-lg font-bold text-sm"
        >
          犠打
        </button>
        <button
          onClick={() => onSelectBuntType("safety")}
          className="py-3 bg-green-600 rounded-lg font-bold text-sm"
        >
          セーフティ
        </button>
        <button
          onClick={() => onSelectBuntType("squeeze")}
          className="py-3 bg-orange-600 rounded-lg font-bold text-sm"
        >
          スクイズ
        </button>
        <button
          onClick={() => onSelectBuntType("delayedSqueeze")}
          className="py-3 bg-purple-600 rounded-lg font-bold text-sm"
        >
          ディレード
        </button>
      </div>
    </div>
  );
};

// ============================================
// RunnerAdvanceModal コンポーネント
// ============================================
interface RunnerAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advances: RunnerAdvance[]) => void;
  currentRunners: RunnerInfo[];
  currentBatterName?: string;
  actionType?:
    | "stolenBase"
    | "pickoff"
    | "wildPitch"
    | "passedBall"
    | "balk"
    | "";
}

// RunnerAdvanceModal コンポーネントの修正版（エラー修正済み）
const RunnerAdvanceModal: React.FC<RunnerAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentRunners,
  currentBatterName = "",
  actionType = "",
}) => {
  // ✅ 正しい型指定の書き方
  const [runnerStates, setRunnerStates] = React.useState<
    Map<
      number,
      {
        toBase: number;
        scored: boolean;
        out: boolean;
        reason: RunnerAdvanceReason;
      }
    >
  >(new Map());

  const [batterState, setBatterState] = React.useState<{
    toBase: number;
    scored: boolean;
  }>({ toBase: 1, scored: false });

  React.useEffect(() => {
    if (isOpen) {
      const initialStates = new Map<
        number,
        {
          toBase: number;
          scored: boolean;
          out: boolean;
          reason: RunnerAdvanceReason;
        }
      >();

      currentRunners.forEach((runner) => {
        let reason: RunnerAdvanceReason = "Other";
        if (actionType === "stolenBase") reason = "SB";
        else if (actionType === "pickoff") reason = "PO";
        else if (actionType === "wildPitch") reason = "WP";
        else if (actionType === "passedBall") reason = "PB";
        else if (actionType === "balk") reason = "BK";

        initialStates.set(runner.base, {
          toBase: runner.base,
          scored: false,
          out: false,
          reason,
        });
      });

      setRunnerStates(initialStates);
      setBatterState({ toBase: 1, scored: false });
    }
  }, [isOpen, currentRunners, actionType]);

  const handleRunnerMove = (fromBase: number, toBase: number) => {
    setRunnerStates(
      (
        prev: Map<
          number,
          {
            toBase: number;
            scored: boolean;
            out: boolean;
            reason: RunnerAdvanceReason;
          }
        >
      ) => {
        const newStates = new Map(prev);
        const current = newStates.get(fromBase) || {
          toBase: fromBase,
          scored: false,
          out: false,
          reason: "Other" as RunnerAdvanceReason,
        };

        let reason = current.reason;
        if (actionType === "stolenBase" && toBase === fromBase + 1) {
          reason = "SB";
        }

        newStates.set(fromBase, {
          ...current,
          toBase,
          scored: toBase === 4,
          out: false,
          reason,
        });
        return newStates;
      }
    );
  };

  const handleRunnerOut = (fromBase: number) => {
    setRunnerStates(
      (
        prev: Map<
          number,
          {
            toBase: number;
            scored: boolean;
            out: boolean;
            reason: RunnerAdvanceReason;
          }
        >
      ) => {
        const newStates = new Map(prev);
        const current = newStates.get(fromBase) || {
          toBase: fromBase,
          scored: false,
          out: false,
          reason: "Other" as RunnerAdvanceReason,
        };

        let reason = current.reason;
        if (actionType === "stolenBase") {
          reason = "CS";
        } else if (actionType === "pickoff") {
          reason = "PO";
        }

        newStates.set(fromBase, {
          ...current,
          out: true,
          scored: false,
          reason,
        });
        return newStates;
      }
    );
  };

  const handleBatterMove = (toBase: number) => {
    setBatterState({ toBase, scored: toBase === 4 });
  };

  const handleSave = () => {
    const advances: RunnerAdvance[] = [];

    if (
      !actionType ||
      ["", "stolenBase", "wildPitch", "passedBall"].includes(actionType)
    ) {
      if (currentBatterName) {
        advances.push({
          runnerId: "BR",
          fromBase: 0 as Base,
          toBase: batterState.toBase as Base,
          scored: batterState.scored,
          out: false,
          runnerName: currentBatterName,
          reason: "Hit",
        });
      }
    }

    currentRunners.forEach((runner) => {
      const state = runnerStates.get(runner.base);

      if (state) {
        advances.push({
          runnerId: runner.runnerId,
          fromBase: runner.base as Base,
          toBase: state.toBase as Base,
          scored: state.scored,
          out: state.out,
          runnerName: runner.name,
          reason: state.reason,
          playType: "normal",
        });
      }
    });

    onSave(advances);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-3">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
            <h2 className="text-lg font-bold">
              {actionType === "stolenBase" && "🏃 盗塁"}
              {actionType === "pickoff" && "👈 牽制"}
              {actionType === "wildPitch" && "🌀 暴投"}
              {actionType === "passedBall" && "🧤 捕逸"}
              {actionType === "balk" && "⚠️ ボーク"}
              {!actionType && "走者進塁"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          {currentBatterName && !actionType && (
            <div className="mb-4 bg-gray-800 rounded-lg p-3">
              <h3 className="text-sm font-bold mb-2 text-blue-400">
                ⚾ 打者: {currentBatterName}
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((base) => (
                  <button
                    key={base}
                    onClick={() => handleBatterMove(base)}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      batterState.toBase === base
                        ? "bg-blue-600 text-white scale-105"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {base === 4 ? "本塁" : `${base}塁`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentRunners.map((runner) => {
            const state = runnerStates.get(runner.base) || {
              toBase: runner.base,
              scored: false,
              out: false,
              reason: "Other" as RunnerAdvanceReason,
            };

            return (
              <div
                key={runner.base}
                className="mb-3 bg-gray-800 rounded-lg p-3"
              >
                <h3 className="text-sm font-bold mb-2 text-yellow-400">
                  🏃 {runner.base}塁走者: {runner.name}
                </h3>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[runner.base, runner.base + 1, runner.base + 2, 4]
                    .filter((b) => b <= 4)
                    .map((base) => (
                      <button
                        key={base}
                        onClick={() => handleRunnerMove(runner.base, base)}
                        className={`py-2 rounded-lg font-bold text-xs transition-all ${
                          state.toBase === base && !state.out
                            ? "bg-green-600 text-white scale-105"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        {base === 4 ? "本塁" : `${base}塁`}
                      </button>
                    ))}
                  <button
                    onClick={() => handleRunnerOut(runner.base)}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      state.out
                        ? "bg-red-600 text-white scale-105"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    OUT
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-sm"
              disabled={currentRunners.length === 0 && !currentBatterName}
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreInput;
