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
  | "normal" // 通常
  | "safety" // セーフティ
  | "squeeze"; // スーサイド（スクイズ）

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

// 守備プレーの各ステップ
interface DefensiveStep {
  position?: Position;
  errorType?: "catch" | "throw" | "FC"; // 捕球E, 送球E, FC
  stepIndex: number;
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
  // 要件対応の追加フィールド
  droppedThirdStrike?: boolean;
  strikeoutType?: "normal" | "droppedThird";
  caughtFoul?: boolean;
  foulTip?: boolean;
  infieldFly?: boolean;
  resultType?: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay";
  playType?: AdvancedPlayType;
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

  // 画面フロー管理（要件に合わせて拡張）
  const [currentScreen, setCurrentScreen] = useState<
    | "pitch"
    | "batting"
    | "defense"
    | "runner"
    | "cutPlay"
    | "rundown"
    | "result"
    | "buntType"
  >("pitch");

  // 後方互換性のため
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
        runnerBases.includes(2)) || // 一二塁
      (runnerBases.length === 2 &&
        runnerBases.includes(1) &&
        runnerBases.includes(3)) || // 一三塁
      runnerBases.length === 3; // 満塁
    return isIFCondition;
  }, [getCurrentRunners, currentOuts]);

  // 強制進塁連鎖計算（四球/死球/申告敬遠時）
  const calculateForcedAdvances = useCallback(
    (batterToBase: Base): RunnerAdvance[] => {
      const runners = getCurrentRunners();
      const advances: RunnerAdvance[] = [];
      const baseOccupied: Record<1 | 2 | 3, boolean> = {
        1: false,
        2: false,
        3: false,
      };

      // 現在の走者をマッピング
      runners.forEach((runner) => {
        baseOccupied[runner.base] = true;
      });

      // 打者が1塁に進む場合、強制進塁を計算
      if (batterToBase >= 1) {
        // 1塁に走者がいる場合、順次押し出す
        if (baseOccupied[1] && batterToBase >= 1) {
          if (baseOccupied[2] && batterToBase >= 2) {
            if (baseOccupied[3] && batterToBase >= 3) {
              // 満塁押し出し
              advances.push({
                runnerId: "R3",
                fromBase: 3,
                toBase: 4,
                reason: "BB",
                scored: true,
                out: false,
                runnerName: runners.find((r) => r.base === 3)?.name || "",
              });
            }
            advances.push({
              runnerId: "R2",
              fromBase: 2,
              toBase: 3,
              reason: "BB",
              scored: false,
              out: false,
              runnerName: runners.find((r) => r.base === 2)?.name || "",
            });
          }
          advances.push({
            runnerId: "R1",
            fromBase: 1,
            toBase: 2,
            reason: "BB",
            scored: false,
            out: false,
            runnerName: runners.find((r) => r.base === 1)?.name || "",
          });
        }
      }

      return advances;
    },
    [getCurrentRunners]
  );

  // 投球結果処理（要件に合わせて拡張）
  const handlePitchResult = (result: PitchResult) => {
    let newStrikes = currentAtBat.strikes;
    let newBalls = currentAtBat.balls;

    if (
      result === "strike" ||
      result === "swingingMiss" ||
      result === "calledStrike"
    ) {
      newStrikes++;
      // 三振確定時のみ処理
      if (newStrikes >= 3) {
        // 振り逃げ条件チェック
        if (canDroppedThirdStrike()) {
          // 振り逃げ: 守備画面→走者画面
          setCurrentScreen("defense");
          setPendingAtBat({
            batterName: lineup[currentBatterIndex],
            battingResult: "strikeout",
            pitches: [
              ...currentAtBat.pitches,
              { result, count: { balls: newBalls, strikes: newStrikes } },
            ],
            outs: 0, // 振り逃げのため一旦0
            rbis: 0,
            droppedThirdStrike: true,
            strikeoutType: "droppedThird",
          });
          return;
        } else {
          // 通常の三振: 結果確定
          completeAtBat("strikeout");
          return;
        }
      }
      // 三振未確定時は投球継続（何もしない）
    } else if (result === "ball") {
      newBalls++;
      if (newBalls >= 4) {
        // 四球: 自動で走者を一塁ずつ進塁させ、カウントをリセット
        const advances = calculateForcedAdvances(1);
        const currentBatter = lineup[currentBatterIndex];

        // 打者が1塁に進む
        const batterAdvance: RunnerAdvance = {
          runnerId: "BR",
          fromBase: 0,
          toBase: 1,
          reason: "BB",
          scored: false,
          out: false,
          runnerName: currentBatter,
        };

        // 進塁情報を更新（打者の進塁も含める）
        const allAdvances = [batterAdvance, ...advances];

        // 得点を計算
        const scoredCount = allAdvances.filter((a) => a.scored).length;

        // 打席データを作成
        const atBat: AtBat = {
          batterName: currentBatter,
          battingResult: "walk",
          pitches: [
            ...currentAtBat.pitches,
            { result, count: { balls: newBalls, strikes: newStrikes } },
          ],
          outs: 0, // アウトカウントはそのまま
          rbis: scoredCount,
          runnerAdvances: allAdvances,
          timestamp: new Date().toISOString(),
        };

        // 自動で保存（カウントをリセット）
        saveAtBatWithPending(atBat);
        resetAtBatInputs();

        // 次の打者へ
        const newOuts = currentOuts + atBat.outs;
        if (newOuts >= 3) {
          nextInning();
        } else {
          advanceBatter();
        }
        setCurrentOuts(newOuts % 3);
        return;
      }
    } else if (result === "foul") {
      // 通常のファウル: 継続（2ストライク未満ならストライク+1）
      if (newStrikes < 2) newStrikes++;
      // 捕球ファウルの選択肢を提供する必要がある場合は、別途処理
    } else if (result === "foulTip") {
      // ファウルチップ: ストライク扱い、ボールインプレー
      newStrikes++;
      if (newStrikes >= 3) {
        completeAtBat("strikeout");
        return;
      }
      // ボールインプレーなので、盗塁等があれば走者画面へ
      const runners = getCurrentRunners();
      if (runners.length > 0) {
        setCurrentScreen("runner");
      }
    } else if (result === "hitByPitch") {
      // 死球: 強制進塁連鎖を計算して走者画面へ
      const advances = calculateForcedAdvances(1);
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
      return;
    } else if (result === "hit") {
      setCurrentScreen("batting");
      return;
    } else if (result === "bunt") {
      // 2ストライクでのバントファウル＝三振は自動で結果化
      if (newStrikes >= 2) {
        // バントファウルで三振
        completeAtBat("strikeout");
        return;
      }
      setCurrentScreen("buntType");
      return;
    }

    // 投球継続
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

    // pendingAtBatがある場合はそれを使用
    if (pendingAtBat) {
      const scoredCount = advances.filter((a) => a.scored).length;
      const updatedAtBat = {
        ...pendingAtBat,
        batterName: pendingAtBat.batterName || currentBatter,
        runnerAdvances: advances,
        rbis: scoredCount,
      };

      // 結果画面へ遷移（アウトがある場合）
      const hasOuts = advances.some((a) => a.out) || updatedAtBat.outs > 0;
      if (hasOuts) {
        setPendingAtBat(updatedAtBat);
        setCurrentScreen("result");
        setIsRunnerModalOpen(false);
        return;
      }

      // アウトがない場合は直接保存
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
    setCurrentScreen("pitch");
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

  // 打撃結果選択時の処理
  const handleBattingResultSelect = (result: BattingResult) => {
    // 打撃結果に応じてランナー進塁、アウトカウント、スコアボードを更新
    const currentBatter = lineup[currentBatterIndex];
    let outs = 0;
    let runnerAdvances: RunnerAdvance[] = [];

    // アウトカウントを計算
    if (result === "strikeout") outs = 1;
    else if (result === "doublePlay") outs = 2;
    else if (result === "triplePlay") outs = 3;
    else if (result === "sacrificeBunt" || result === "sacrificeFly") outs = 1;

    // ランナー進塁を計算
    if (result === "single") {
      // 単打: 打者が1塁に進む、走者は1塁ずつ進塁
      runnerAdvances.push({
        runnerId: "BR",
        fromBase: 0,
        toBase: 1,
        reason: "Hit",
        scored: false,
        out: false,
        runnerName: currentBatter,
      });
      // 既存の走者を1塁ずつ進塁
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
      // 二塁打: 打者が2塁に進む、走者は2塁ずつ進塁
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
      // 三塁打: 打者が3塁に進む、走者は3塁ずつ進塁
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
      // 本塁打: 打者と全ての走者が本塁に進む
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

    // 得点を計算
    const scoredCount = runnerAdvances.filter((a) => a.scored).length;

    // 打席データを作成
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

    // pendingAtBatを更新
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

    const newOuts = currentOuts + (pendingAtBat?.outs || 0);
    if (newOuts >= 3) {
      nextInning();
    } else {
      advanceBatter();
    }
    setCurrentOuts(newOuts % 3);
  };

  // 戻るボタンの処理
  const handleBack = () => {
    if (currentScreen === "batting") {
      setCurrentScreen("pitch");
    } else if (currentScreen === "defense") {
      setCurrentScreen("batting");
    } else if (currentScreen === "runner") {
      setCurrentScreen("defense");
    } else if (currentScreen === "result") {
      setCurrentScreen("runner");
    } else if (currentScreen === "cutPlay") {
      setCurrentScreen("batting");
    } else if (currentScreen === "rundown") {
      setCurrentScreen("batting");
    } else if (currentScreen === "buntType") {
      setCurrentScreen("pitch");
    }
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
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
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
        handleBack={handleBack}
        currentOuts={currentOuts}
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
  currentScreen:
    | "pitch"
    | "batting"
    | "defense"
    | "runner"
    | "cutPlay"
    | "rundown"
    | "result"
    | "buntType";
  setCurrentScreen: (
    screen:
      | "pitch"
      | "batting"
      | "defense"
      | "runner"
      | "cutPlay"
      | "rundown"
      | "result"
      | "buntType"
  ) => void;
  pendingAtBat: AtBat | null;
  setPendingAtBat: React.Dispatch<React.SetStateAction<AtBat | null>>;
  saveAtBatWithPending: (atBat: AtBat, shouldAdvanceBatter?: boolean) => void;
  checkInfieldFlyCondition: () => boolean;
  lineup: string[];
  currentBatterIndex: number;
  handleSaveRunnerAdvances: (advances: RunnerAdvance[]) => void;
  resetAtBatInputs: () => void;
  handleBattingResultSelect: (result: BattingResult) => void;
  handleFinishPlay: () => void;
  handleBack: () => void;
  currentOuts: number;
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
  currentScreen,
  setCurrentScreen,
  pendingAtBat,
  setPendingAtBat,
  saveAtBatWithPending,
  checkInfieldFlyCondition,
  lineup,
  currentBatterIndex,
  handleSaveRunnerAdvances,
  resetAtBatInputs,
  handleBattingResultSelect,
  handleFinishPlay,
  handleBack,
  currentOuts,
}) => {
  // カットプレー、挟殺、走者、結果画面では投球結果を表示しない
  const showPitchScreen =
    inputStep === "pitch" &&
    currentScreen !== "cutPlay" &&
    currentScreen !== "rundown" &&
    currentScreen !== "runner" &&
    currentScreen !== "result";

  return (
    <div className="bg-gray-900 px-2 py-2 border-t border-gray-700 flex-1 overflow-y-auto">
      {showPitchScreen && (
        <div>
          <h3 className="text-sm font-bold mb-3 text-gray-300">
            投球結果を選択
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => onPitchResult("calledStrike")}
              className="py-3 bg-red-800 rounded-lg font-bold text-sm active:scale-95"
            >
              見逃しストライク
            </button>
            <button
              onClick={() => onPitchResult("swingingMiss")}
              className="py-3 bg-red-700 rounded-lg font-bold text-sm active:scale-95"
            >
              空振り
            </button>
            <button
              onClick={() => onPitchResult("foul")}
              className="py-3 bg-yellow-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ファール
            </button>
            <button
              onClick={() => onPitchResult("ball")}
              className="py-3 bg-blue-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ボール
            </button>
            <button
              onClick={() => onPitchResult("hitByPitch")}
              className="py-3 bg-orange-600 rounded-lg font-bold text-sm active:scale-95"
            >
              死球
            </button>
            <button
              onClick={() => onPitchResult("bunt")}
              className="py-3 bg-teal-600 rounded-lg font-bold text-sm active:scale-95"
            >
              バント
            </button>
            <button
              onClick={() => onPitchResult("hit")}
              className="py-3 bg-green-600 rounded-lg font-bold text-sm active:scale-95 "
            >
              打球
            </button>
          </div>
        </div>
      )}

      {inputStep === "batted" && currentScreen === "batting" && (
        <BattedBallInput
          selectedHitType={selectedHitType}
          selectedHitDirection={selectedHitDirection}
          selectedPosition={selectedPosition}
          onSetHitType={onSetHitType}
          onSetHitDirection={onSetHitDirection}
          onSetPosition={onSetPosition}
          onNext={() => {
            // 打球種別選択後、守備画面へ（バントの場合は種類選択済み）
            setCurrentScreen("defense");
          }}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBattingResultSelect={handleBattingResultSelect}
          onFinishPlay={handleFinishPlay}
          onBack={handleBack}
        />
      )}

      {inputStep === "result" && (
        <ResultSelection onCompleteAtBat={onCompleteAtBat} />
      )}

      {inputStep === "buntType" && (
        <BuntTypeSelection
          onSelectBuntType={(type) => {
            onSetBuntType(type);
            // バント: 種類選択 → 打球種別 → 守備 → 走者
            onSetInputStep("batted");
          }}
          onBack={handleBack}
        />
      )}

      {currentScreen === "defense" && (
        <DefenseScreen
          hitType={selectedHitType || undefined}
          onNext={() => {
            // 守備画面から走者画面へ（振り逃げ時など）
            setCurrentScreen("runner");
          }}
          onComplete={(defensiveSequence, errors) => {
            // 守備位置確定後、走者画面へ
            const positions = defensiveSequence
              .filter((step) => step.position)
              .map((step) => step.position!);
            const defensePath = defensiveSequence
              .map((step) => {
                if (step.errorType === "catch") return "捕球E";
                if (step.errorType === "throw") return "送球E";
                if (step.errorType === "FC") return "FC";
                return step.position;
              })
              .filter((x) => x) as string[];

            if (pendingAtBat) {
              setPendingAtBat({
                ...pendingAtBat,
                defensivePositions: positions,
                defensePath,
                errors: errors.length > 0 ? errors : undefined,
              });
            } else {
              // 通常の打球の場合
              const atBat: AtBat = {
                batterName: "",
                battingResult: "single", // 仮
                pitches: currentAtBat.pitches,
                outs: 0,
                rbis: 0,
                hitDirection: selectedHitDirection || undefined,
                hitType: selectedHitType || undefined,
                position: selectedPosition || undefined,
                defensivePositions: positions,
                defensePath,
                errors: errors.length > 0 ? errors : undefined,
                infieldFly:
                  checkInfieldFlyCondition() && selectedHitType === "fly",
              };
              setPendingAtBat(atBat);
            }
            setCurrentScreen("runner");
          }}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBack={handleBack}
        />
      )}

      {currentScreen === "cutPlay" && (
        <CutPlayScreen
          onComplete={(positions) => {
            if (pendingAtBat) {
              setPendingAtBat({
                ...pendingAtBat,
                defensivePositions: positions,
                playType: "cutoffPlay",
              });
            }
            setCurrentScreen("result");
          }}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBack={handleBack}
        />
      )}

      {currentScreen === "rundown" && (
        <RundownScreen
          runners={runners}
          onComplete={(positions, runnerId) => {
            if (pendingAtBat) {
              setPendingAtBat({
                ...pendingAtBat,
                defensivePositions: positions,
                playType: "rundown",
              });
            }
            setCurrentScreen("result");
          }}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBack={handleBack}
        />
      )}

      {currentScreen === "runner" && (
        <RunnerScreen
          runners={runners}
          currentBatterName={
            pendingAtBat?.batterName || lineup[currentBatterIndex]
          }
          onComplete={handleSaveRunnerAdvances}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBack={handleBack}
        />
      )}

      {currentScreen === "result" && (
        <ResultScreen
          onConfirm={(
            resultType: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay"
          ) => {
            if (pendingAtBat) {
              const atBat = {
                ...pendingAtBat,
                resultType,
                outs:
                  resultType === "out" || resultType === "tagOut"
                    ? 1
                    : resultType === "doublePlay"
                    ? 2
                    : resultType === "triplePlay"
                    ? 3
                    : 0,
              };
              saveAtBatWithPending(atBat);
              setPendingAtBat(null);
              setCurrentScreen("pitch");
              resetAtBatInputs();
            }
          }}
          onFinishPlay={handleFinishPlay}
          onBack={handleBack}
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
  onNavigateToCutPlay: () => void;
  onNavigateToRundown: () => void;
  onNavigateToRunner: () => void;
  onNavigateToResult: () => void;
  onBattingResultSelect?: (result: BattingResult) => void;
  onFinishPlay?: () => void;
  onBack?: () => void;
}

const BattedBallInput: React.FC<BattedBallInputProps> = ({
  selectedHitType,
  selectedHitDirection,
  selectedPosition,
  onSetHitType,
  onSetHitDirection,
  onSetPosition,
  onNext,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
  onBattingResultSelect,
  onFinishPlay,
  onBack,
}) => {
  const [selectedBattingResult, setSelectedBattingResult] = useState<
    BattingResult | ""
  >("");
  const [defensiveSequence, setDefensiveSequence] = useState<DefensiveStep[]>(
    []
  );
  const [nextStepIndex, setNextStepIndex] = useState(0);

  // ポジション名のマッピング
  const positionLabels: Record<Position, string> = {
    P: "投手",
    C: "捕手",
    "1B": "一塁",
    "2B": "二塁",
    "3B": "三塁",
    SS: "遊撃",
    LF: "左翼",
    CF: "中堅",
    RF: "右翼",
  };

  // 守備位置を順番に選択
  const handlePositionSelect = (pos: Position) => {
    const currentIndex = nextStepIndex;
    setDefensiveSequence((prev) => {
      const newSequence = [...prev];
      const positionStep: DefensiveStep = {
        position: pos,
        stepIndex: currentIndex,
      };
      newSequence.push(positionStep);
      // 最初の守備位置をselectedPositionに反映
      if (newSequence.length === 1) {
        onSetPosition(pos);
      }
      return newSequence;
    });
    setNextStepIndex((prev) => prev + 1);
  };

  // エラー/FCを選択（直前のポジションに関連付ける）
  const handleErrorSelect = (errorType: "catch" | "throw" | "FC") => {
    setDefensiveSequence((prev) => {
      if (prev.length === 0) return prev;

      // 直前のポジションステップを探す
      const sortedSequence = [...prev].sort(
        (a, b) => a.stepIndex - b.stepIndex
      );
      let lastPositionIndex = -1;

      for (let i = sortedSequence.length - 1; i >= 0; i--) {
        if (sortedSequence[i].position) {
          lastPositionIndex = i;
          break;
        }
      }

      if (lastPositionIndex === -1) return prev;

      // 直前のポジションステップにエラーを追加
      const newSequence = [...prev];
      const targetStep = newSequence.find(
        (step) => step.stepIndex === sortedSequence[lastPositionIndex].stepIndex
      );

      if (targetStep) {
        targetStep.errorType = errorType;
      }

      return newSequence;
    });
  };

  // 最後を削除
  const handleRemoveLast = () => {
    setDefensiveSequence((prev) => {
      if (prev.length === 0) return prev;

      const sortedSequence = [...prev].sort(
        (a, b) => a.stepIndex - b.stepIndex
      );
      const lastStep = sortedSequence[sortedSequence.length - 1];

      // 最後のステップがエラーの場合、そのエラーを削除
      if (lastStep.errorType && lastStep.position) {
        const newSequence = prev.map((step) => {
          if (step.stepIndex === lastStep.stepIndex) {
            const { errorType, ...rest } = step;
            return rest;
          }
          return step;
        });
        return newSequence;
      }

      // 最後のステップがポジションの場合、そのステップを削除
      setNextStepIndex((prev) => prev - 1);
      return prev.filter((step) => step.stepIndex !== lastStep.stepIndex);
    });
  };

  // ステップの表示ラベルを取得
  const getStepLabel = (step: DefensiveStep): string => {
    if (step.position) {
      return positionLabels[step.position];
    }
    if (step.errorType === "catch") return "捕球E";
    if (step.errorType === "throw") return "送球E";
    if (step.errorType === "FC") return "FC";
    return "";
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">打球の種類を選択</h3>
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

      {selectedHitType && (
        <>
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">
              守備の処理順にポジションを選択
            </div>
            <div className="grid grid-cols-9 gap-1 mb-2">
              {[
                { value: "P", label: "投手" },
                { value: "C", label: "捕手" },
                { value: "1B", label: "一塁" },
                { value: "2B", label: "二塁" },
                { value: "3B", label: "三塁" },
                { value: "SS", label: "遊撃" },
                { value: "LF", label: "左翼" },
                { value: "CF", label: "中堅" },
                { value: "RF", label: "右翼" },
              ].map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => handlePositionSelect(pos.value as Position)}
                  className="py-2 rounded font-bold text-xs bg-gray-700"
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* エラー/FC選択ボタン */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">エラー/FCを選択</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => handleErrorSelect("catch")}
                className="py-2 rounded font-bold text-xs bg-red-600"
              >
                捕球E
              </button>
              <button
                onClick={() => handleErrorSelect("throw")}
                className="py-2 rounded font-bold text-xs bg-red-700"
              >
                送球E
              </button>
              <button
                onClick={() => handleErrorSelect("FC")}
                className="py-2 rounded font-bold text-xs bg-orange-600"
              >
                FC
              </button>
            </div>
          </div>

          {/* 選択された順番で表示 */}
          {defensiveSequence.length > 0 && (
            <div className="mb-3 p-2 bg-gray-800 rounded">
              <div className="text-xs text-gray-400 mb-1">選択された順番</div>
              <div className="flex flex-wrap items-center gap-1">
                {defensiveSequence
                  .sort((a, b) => a.stepIndex - b.stepIndex)
                  .map((step, idx, array) => {
                    // ポジションとエラーを一緒に表示
                    const hasError = step.errorType && step.position;
                    const nextStep = array[idx + 1];
                    const showArrow =
                      idx < array.length - 1 &&
                      (!hasError || nextStep?.position);

                    return (
                      <React.Fragment key={idx}>
                        {step.position && (
                          <>
                            <span className="px-2 py-1 rounded text-xs font-bold bg-purple-600">
                              {getStepLabel(step)}
                            </span>
                            {hasError && (
                              <>
                                <span className="text-white text-xs font-bold">
                                  →
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    step.errorType === "FC"
                                      ? "bg-orange-600"
                                      : "bg-red-600"
                                  }`}
                                >
                                  {step.errorType === "catch"
                                    ? "捕球E"
                                    : step.errorType === "throw"
                                    ? "送球E"
                                    : "FC"}
                                </span>
                              </>
                            )}
                            {showArrow && (
                              <span className="text-white text-xs font-bold">
                                →
                              </span>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
              </div>
              <button
                onClick={handleRemoveLast}
                className="mt-2 text-xs text-red-400 underline"
              >
                最後を削除
              </button>
            </div>
          )}

          {/* 打撃結果選択（守備位置を選択した後） */}
          {defensiveSequence.length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">打撃結果を選択</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => {
                    setSelectedBattingResult("single");
                    if (onBattingResultSelect) onBattingResultSelect("single");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "single"
                      ? "bg-green-600"
                      : "bg-gray-700"
                  }`}
                >
                  単打
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("double");
                    if (onBattingResultSelect) onBattingResultSelect("double");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "double"
                      ? "bg-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  二塁打
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("triple");
                    if (onBattingResultSelect) onBattingResultSelect("triple");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "triple"
                      ? "bg-purple-600"
                      : "bg-gray-700"
                  }`}
                >
                  三塁打
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("homerun");
                    if (onBattingResultSelect) onBattingResultSelect("homerun");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "homerun"
                      ? "bg-red-600"
                      : "bg-gray-700"
                  }`}
                >
                  本塁打
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("strikeout");
                    if (onBattingResultSelect)
                      onBattingResultSelect("strikeout");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "strikeout"
                      ? "bg-gray-600"
                      : "bg-gray-700"
                  }`}
                >
                  凡打
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("doublePlay");
                    if (onBattingResultSelect)
                      onBattingResultSelect("doublePlay");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "doublePlay"
                      ? "bg-gray-700"
                      : "bg-gray-700"
                  }`}
                >
                  併殺
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("sacrificeBunt");
                    if (onBattingResultSelect)
                      onBattingResultSelect("sacrificeBunt");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "sacrificeBunt"
                      ? "bg-teal-600"
                      : "bg-gray-700"
                  }`}
                >
                  犠打
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("sacrificeFly");
                    if (onBattingResultSelect)
                      onBattingResultSelect("sacrificeFly");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "sacrificeFly"
                      ? "bg-cyan-600"
                      : "bg-gray-700"
                  }`}
                >
                  犠飛
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("error");
                    if (onBattingResultSelect) onBattingResultSelect("error");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "error"
                      ? "bg-pink-600"
                      : "bg-gray-700"
                  }`}
                >
                  失策
                </button>
                <button
                  onClick={() => {
                    setSelectedBattingResult("fieldersChoice");
                    if (onBattingResultSelect)
                      onBattingResultSelect("fieldersChoice");
                  }}
                  className={`py-2 rounded-lg font-bold text-xs ${
                    selectedBattingResult === "fieldersChoice"
                      ? "bg-indigo-600"
                      : "bg-gray-700"
                  }`}
                >
                  野選
                </button>
              </div>

              {/* プレー終了ボタンと戻るボタン */}
              <div className="flex gap-2 mt-3">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="flex-1 py-2 bg-gray-700 rounded-lg font-bold text-xs"
                  >
                    戻る
                  </button>
                )}
                {onFinishPlay && selectedBattingResult && (
                  <button
                    onClick={onFinishPlay}
                    className="flex-1 py-2 bg-green-600 rounded-lg font-bold text-xs"
                  >
                    プレー終了
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 処理順選択ボタン（従来の流れ用） */}
          {defensiveSequence.length > 0 && !selectedBattingResult && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={onNavigateToCutPlay}
                  className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
                >
                  カット
                </button>
                <button
                  onClick={onNavigateToRundown}
                  className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                >
                  挟殺
                </button>
                <button
                  onClick={onNavigateToRunner}
                  className="py-2 bg-green-600 rounded-lg font-bold text-xs"
                >
                  走者
                </button>
                <button
                  onClick={onNavigateToResult}
                  className="py-2 bg-red-600 rounded-lg font-bold text-xs"
                >
                  結果
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 戻るボタン（打撃画面全体） */}
      {onBack && !selectedHitType && (
        <div className="mt-4">
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        </div>
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
  onBack?: () => void;
}

const BuntTypeSelection: React.FC<BuntTypeSelectionProps> = ({
  onSelectBuntType,
  onBack,
}) => {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">バントの種類</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onSelectBuntType("normal")}
          className="py-3 bg-teal-600 rounded-lg font-bold text-sm"
        >
          通常
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
          スーサイド
        </button>
      </div>

      {/* 戻るボタン */}
      {onBack && (
        <div className="mt-3">
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// DefenseScreen コンポーネント
// ============================================
interface DefenseScreenProps {
  onNext: () => void;
  onComplete: (defensiveSequence: DefensiveStep[], errors: ErrorInfo[]) => void;
  onNavigateToCutPlay: () => void;
  onNavigateToRundown: () => void;
  onNavigateToRunner: () => void;
  onNavigateToResult: () => void;
  hitType?: HitType;
  onBack?: () => void;
}

const DefenseScreen: React.FC<DefenseScreenProps> = ({
  onNext,
  onComplete,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
  hitType,
  onBack,
}) => {
  const [defensiveSequence, setDefensiveSequence] = useState<DefensiveStep[]>(
    []
  );
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [nextStepIndex, setNextStepIndex] = useState(0);

  // 守備位置を追加
  const handlePositionSelect = (pos: Position) => {
    const currentIndex = nextStepIndex;

    setDefensiveSequence((prev) => {
      const newSequence = [...prev];

      // 守備位置を追加
      const positionStep: DefensiveStep = {
        position: pos,
        stepIndex: currentIndex,
      };
      newSequence.push(positionStep);

      return newSequence;
    });

    // インデックスを更新
    setNextStepIndex((prev) => prev + 1);
  };

  // エラー/FCを追加
  const handleErrorSelect = (
    errorType: "catch" | "throw" | "FC",
    pos: Position
  ) => {
    const currentIndex = nextStepIndex;

    setDefensiveSequence((prev) => {
      const newSequence = [...prev];

      // エラーステップを追加
      const errorStep: DefensiveStep = {
        position: pos,
        errorType: errorType,
        stepIndex: currentIndex,
      };
      newSequence.push(errorStep);

      // エラー情報も記録（FCはエラー情報に含めない）
      if (errorType === "catch" || errorType === "throw") {
        setErrors((prevErrors) => [
          ...prevErrors,
          {
            position: pos,
            type: errorType,
          },
        ]);
      }

      return newSequence;
    });

    // インデックスを更新
    setNextStepIndex((prev) => prev + 1);
  };

  // 最後のステップを削除
  const handleRemoveLast = () => {
    setDefensiveSequence((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];

      // エラー情報も削除
      if (
        last.errorType &&
        (last.errorType === "catch" || last.errorType === "throw")
      ) {
        setErrors((prevErrors) => {
          if (prevErrors.length > 0) {
            return prevErrors.slice(0, -1);
          }
          return prevErrors;
        });
      }

      setNextStepIndex((prev) => prev - 1);
      return prev.slice(0, -1);
    });
  };

  // 確定
  const handleComplete = () => {
    if (defensiveSequence.length > 0) {
      onComplete(defensiveSequence, errors);
    }
  };

  // 選択された位置を取得
  const selectedPositions = defensiveSequence
    .filter((step) => step.position)
    .map((step) => step.position!);

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">守備位置を選択</h3>

      {/* 現在の守備シーケンス表示 */}
      {defensiveSequence.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">守備シーケンス</div>
          <div className="flex flex-wrap gap-1">
            {defensiveSequence.map((step, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  step.errorType === "catch"
                    ? "bg-red-600"
                    : step.errorType === "throw"
                    ? "bg-orange-600"
                    : step.errorType === "FC"
                    ? "bg-yellow-600"
                    : "bg-purple-600"
                }`}
              >
                {step.errorType === "catch"
                  ? `捕球E${step.position}`
                  : step.errorType === "throw"
                  ? `送球E${step.position}`
                  : step.errorType === "FC"
                  ? `FC${step.position}`
                  : step.position}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 守備位置選択 */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">守備位置を選択</div>
        <div className="grid grid-cols-9 gap-1 mb-2">
          {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionSelect(pos as Position)}
              className="py-2 rounded font-bold text-xs bg-gray-700 hover:bg-gray-600"
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* エラー/FC選択（位置指定） */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">
          エラー/FCを追加（守備位置を選択してください）
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <div className="text-[10px] text-gray-500 mb-1 text-center">
              捕球E
            </div>
            <div className="grid grid-cols-3 gap-1">
              {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map(
                (pos) => (
                  <button
                    key={`catch-${pos}`}
                    onClick={() => handleErrorSelect("catch", pos as Position)}
                    className="py-1.5 bg-red-600 rounded text-[10px] font-bold hover:bg-red-700"
                  >
                    {pos}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1 text-center">
              送球E
            </div>
            <div className="grid grid-cols-3 gap-1">
              {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map(
                (pos) => (
                  <button
                    key={`throw-${pos}`}
                    onClick={() => handleErrorSelect("throw", pos as Position)}
                    className="py-1.5 bg-orange-600 rounded text-[10px] font-bold hover:bg-orange-700"
                  >
                    {pos}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1 text-center">FC</div>
            <div className="grid grid-cols-3 gap-1">
              {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map(
                (pos) => (
                  <button
                    key={`fc-${pos}`}
                    onClick={() => handleErrorSelect("FC", pos as Position)}
                    className="py-1.5 bg-yellow-600 rounded text-[10px] font-bold hover:bg-yellow-700"
                  >
                    {pos}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 削除ボタン */}
      {defensiveSequence.length > 0 && (
        <button
          onClick={handleRemoveLast}
          className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs mb-3"
        >
          最後を削除
        </button>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          次へ（走者画面）
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-sm"
          disabled={defensiveSequence.length === 0}
        >
          確定
        </button>
      </div>

      {/* 処理順選択ボタン */}
      <div className="mt-4 border-t border-gray-700 pt-3">
        <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={onNavigateToCutPlay}
            className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
          >
            カット
          </button>
          <button
            onClick={onNavigateToRundown}
            className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
          >
            挟殺
          </button>
          <button
            onClick={onNavigateToRunner}
            className="py-2 bg-green-600 rounded-lg font-bold text-xs"
          >
            走者
          </button>
          <button
            onClick={onNavigateToResult}
            className="py-2 bg-red-600 rounded-lg font-bold text-xs"
          >
            結果
          </button>
        </div>
      </div>

      {/* 戻るボタン */}
      {onBack && (
        <div className="mt-3">
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// CutPlayScreen コンポーネント（カットプレー画面）
// ============================================
interface CutPlayScreenProps {
  onComplete: (positions: Position[]) => void;
  onNavigateToResult: () => void;
  onBack?: () => void;
}

const CutPlayScreen: React.FC<CutPlayScreenProps> = ({
  onComplete,
  onNavigateToResult,
  onBack,
}) => {
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);

  const handlePositionSelect = (pos: Position) => {
    setSelectedPositions((prev) => {
      if (prev.includes(pos)) {
        return prev.filter((p) => p !== pos);
      }
      return [...prev, pos];
    });
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">カットプレー</h3>
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">ポジション番号を選択</div>
        <div className="grid grid-cols-9 gap-1 mb-4">
          {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionSelect(pos as Position)}
              className={`py-2 rounded font-bold text-xs ${
                selectedPositions.includes(pos as Position)
                  ? "bg-blue-600"
                  : "bg-gray-700"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onComplete(selectedPositions)}
          className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-sm"
          disabled={selectedPositions.length === 0}
        >
          確定
        </button>
        <button
          onClick={onNavigateToResult}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          結果へ
        </button>
      </div>

      {/* 戻るボタン */}
      {onBack && (
        <div className="mt-3">
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// RundownScreen コンポーネント（挟殺画面）
// ============================================
interface RundownScreenProps {
  runners: RunnerInfo[];
  onComplete: (positions: Position[], runnerId?: string) => void;
  onNavigateToResult: () => void;
  onBack?: () => void;
}

const RundownScreen: React.FC<RundownScreenProps> = ({
  runners,
  onComplete,
  onNavigateToResult,
  onBack,
}) => {
  const [defensiveSequence, setDefensiveSequence] = useState<Position[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<string>("");
  const [selectedBasePath, setSelectedBasePath] = useState<string>("");

  // 守備位置を順番に選択
  const handlePositionSelect = (pos: Position) => {
    setDefensiveSequence((prev) => {
      if (prev.includes(pos)) {
        // 既に選択されている場合は削除
        return prev.filter((p) => p !== pos);
      }
      // 選択順に追加
      return [...prev, pos];
    });
  };

  // 最後を削除
  const handleRemoveLast = () => {
    setDefensiveSequence((prev) => prev.slice(0, -1));
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">挟殺</h3>

      {/* 走者選択 */}
      {runners.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">走者を選択</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {runners.map((runner) => (
              <button
                key={runner.runnerId}
                onClick={() => setSelectedRunner(runner.runnerId)}
                className={`py-2 rounded font-bold text-xs ${
                  selectedRunner === runner.runnerId
                    ? "bg-orange-600"
                    : "bg-gray-700"
                }`}
              >
                {runner.base}塁: {runner.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 塁間選択 */}
      {selectedRunner && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">塁間を選択</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {["1-2", "2-3", "3-H"].map((path) => (
              <button
                key={path}
                onClick={() => setSelectedBasePath(path)}
                className={`py-2 rounded font-bold text-xs ${
                  selectedBasePath === path ? "bg-orange-600" : "bg-gray-700"
                }`}
              >
                {path}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 守備の処理順にポジションを選択 */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">
          守備の処理順にポジションを選択
        </div>
        <div className="grid grid-cols-9 gap-1 mb-2">
          {["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"].map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionSelect(pos as Position)}
              className={`py-2 rounded font-bold text-xs ${
                defensiveSequence.includes(pos as Position)
                  ? "bg-orange-600"
                  : "bg-gray-700"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* 選択された順番で表示 */}
      {defensiveSequence.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">選択された順番</div>
          <div className="flex flex-wrap gap-1">
            {defensiveSequence.map((pos, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded text-xs font-bold bg-orange-600"
              >
                {pos}
              </span>
            ))}
          </div>
          <button
            onClick={handleRemoveLast}
            className="mt-2 text-xs text-red-400 underline"
          >
            最後を削除
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onComplete(defensiveSequence, selectedRunner)}
          className="flex-1 py-3 bg-orange-600 rounded-lg font-bold text-sm"
          disabled={defensiveSequence.length === 0 || !selectedRunner}
        >
          確定
        </button>
        <button
          onClick={onNavigateToResult}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          結果へ
        </button>
      </div>

      {/* 戻るボタン */}
      {onBack && (
        <div className="mt-3">
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// RunnerScreen コンポーネント（走者画面）
// ============================================
interface RunnerScreenProps {
  runners: RunnerInfo[];
  currentBatterName?: string;
  onComplete: (advances: RunnerAdvance[]) => void;
  onNavigateToResult: () => void;
  onBack?: () => void;
}

const RunnerScreen: React.FC<RunnerScreenProps> = ({
  runners,
  currentBatterName,
  onComplete,
  onNavigateToResult,
  onBack,
}) => {
  const [selectedRunner, setSelectedRunner] = useState<string | "BR">("");
  const [selectedToBase, setSelectedToBase] = useState<Base | null>(null);
  const [selectedReason, setSelectedReason] =
    useState<RunnerAdvanceReason>("Other");
  const [runnerAdvances, setRunnerAdvances] = useState<RunnerAdvance[]>([]);

  // 進塁理由のオプション
  const advanceReasons: { value: RunnerAdvanceReason; label: string }[] = [
    { value: "Hit", label: "安打" },
    { value: "BB", label: "四球" },
    { value: "HBP", label: "死球" },
    { value: "SB", label: "盗塁" },
    { value: "CS", label: "盗塁死" },
    { value: "PO", label: "牽制死" },
    { value: "WP", label: "暴投" },
    { value: "PB", label: "捕逸" },
    { value: "BK", label: "ボーク" },
    { value: "DI", label: "無警戒進塁" },
    { value: "E", label: "エラー" },
    { value: "FC", label: "フィルダースチョイス" },
    { value: "SF", label: "犠飛" },
    { value: "SH", label: "犠打" },
    { value: "Interference", label: "妨害" },
    { value: "Return", label: "戻塁" },
    { value: "Other", label: "その他" },
  ];

  // 進塁を追加
  const handleAddAdvance = () => {
    if (!selectedRunner || selectedToBase === null) return;

    const fromBase: Base =
      selectedRunner === "BR"
        ? 0
        : (parseInt(selectedRunner.replace("R", "")) as Base);
    const runner =
      selectedRunner === "BR"
        ? {
            runnerId: "BR" as const,
            base: 0 as Base,
            name: currentBatterName || "",
          }
        : runners.find((r) => r.runnerId === selectedRunner);

    if (!runner) return;

    const advance: RunnerAdvance = {
      runnerId: runner.runnerId,
      fromBase,
      toBase: selectedToBase,
      reason: selectedReason,
      scored: selectedToBase === 4,
      out: false,
      runnerName: runner.name,
    };

    setRunnerAdvances((prev) => [...prev, advance]);
    setSelectedRunner("");
    setSelectedToBase(null);
    setSelectedReason("Other");
  };

  // 進塁を削除
  const handleRemoveAdvance = (index: number) => {
    setRunnerAdvances((prev) => prev.filter((_, i) => i !== index));
  };

  // 確定
  const handleComplete = () => {
    if (runnerAdvances.length > 0) {
      onComplete(runnerAdvances);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">走者進塁</h3>

      {/* 走者選択 */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">該当する走者を選択</div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {currentBatterName && (
            <button
              onClick={() => setSelectedRunner("BR")}
              className={`py-2 rounded font-bold text-xs ${
                selectedRunner === "BR" ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              打者: {currentBatterName}
            </button>
          )}
          {runners.map((runner) => (
            <button
              key={runner.runnerId}
              onClick={() => setSelectedRunner(runner.runnerId)}
              className={`py-2 rounded font-bold text-xs ${
                selectedRunner === runner.runnerId
                  ? "bg-green-600"
                  : "bg-gray-700"
              }`}
            >
              {runner.base}塁: {runner.name}
            </button>
          ))}
        </div>
      </div>

      {/* 進塁先の塁を選択 */}
      {selectedRunner && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">進塁先の塁を選択</div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[1, 2, 3, 4].map((base) => {
              const fromBase =
                selectedRunner === "BR"
                  ? 0
                  : parseInt(selectedRunner.replace("R", ""));
              if (base <= fromBase) return null;
              return (
                <button
                  key={base}
                  onClick={() => setSelectedToBase(base as Base)}
                  className={`py-2 rounded font-bold text-xs ${
                    selectedToBase === base ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  {base === 4 ? "本塁" : `${base}塁`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 進塁理由を選択（プルダウン） */}
      {selectedRunner && selectedToBase !== null && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">進塁理由を選択</div>
          <select
            value={selectedReason}
            onChange={(e) =>
              setSelectedReason(e.target.value as RunnerAdvanceReason)
            }
            className="w-full py-2 px-3 bg-gray-700 rounded-lg text-white text-sm mb-2"
          >
            {advanceReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddAdvance}
            className="w-full py-2 bg-green-600 rounded-lg font-bold text-xs"
          >
            進塁を追加
          </button>
        </div>
      )}

      {/* 選択された進塁一覧 */}
      {runnerAdvances.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">選択された進塁</div>
          {runnerAdvances.map((advance, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded"
            >
              <span className="text-xs">
                {advance.runnerName}: {advance.fromBase}塁 →{" "}
                {advance.toBase === 4 ? "本塁" : `${advance.toBase}塁`} (
                {advanceReasons.find((r) => r.value === advance.reason)?.label})
                {advance.scored && " [得点]"}
              </span>
              <button
                onClick={() => handleRemoveAdvance(idx)}
                className="text-xs text-red-400 underline"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleComplete}
          className="flex-1 py-3 bg-green-600 rounded-lg font-bold text-sm"
          disabled={runnerAdvances.length === 0}
        >
          確定
        </button>
        <button
          onClick={onNavigateToResult}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          結果へ
        </button>
      </div>

      {/* 戻るボタン */}
      {onBack && (
        <div className="mt-3">
          <button
            onClick={onBack}
            className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================
// ResultScreen コンポーネント（結果画面）
// ============================================
interface ResultScreenProps {
  onConfirm: (
    resultType: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay"
  ) => void;
  onFinishPlay?: () => void;
  onBack?: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({
  onConfirm,
  onFinishPlay,
  onBack,
}) => {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">結果を選択</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onConfirm("safe")}
          className="py-3 bg-green-600 rounded-lg font-bold text-sm"
        >
          セーフ
        </button>
        <button
          onClick={() => onConfirm("out")}
          className="py-3 bg-red-600 rounded-lg font-bold text-sm"
        >
          アウト
        </button>
        <button
          onClick={() => onConfirm("tagOut")}
          className="py-3 bg-red-700 rounded-lg font-bold text-sm"
        >
          タッチアウト
        </button>
        <button
          onClick={() => onConfirm("doublePlay")}
          className="py-3 bg-orange-600 rounded-lg font-bold text-sm"
        >
          併殺
        </button>
        <button
          onClick={() => onConfirm("triplePlay")}
          className="py-3 bg-purple-600 rounded-lg font-bold text-sm col-span-2"
        >
          三重殺
        </button>
      </div>

      {/* プレー終了ボタンと戻るボタン */}
      <div className="flex gap-2 mt-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            戻る
          </button>
        )}
        {onFinishPlay && (
          <button
            onClick={onFinishPlay}
            className="flex-1 py-2 bg-green-600 rounded-lg font-bold text-xs"
          >
            プレー終了
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// ResultModal コンポーネント（共通結果画面 - オプション処理用に残す）
// ============================================
interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    resultType: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay"
  ) => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-3">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
            <h2 className="text-lg font-bold">結果を選択</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-xl"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConfirm("safe")}
              className="py-3 bg-green-600 rounded-lg font-bold text-sm"
            >
              セーフ
            </button>
            <button
              onClick={() => onConfirm("out")}
              className="py-3 bg-red-600 rounded-lg font-bold text-sm"
            >
              アウト
            </button>
            <button
              onClick={() => onConfirm("tagOut")}
              className="py-3 bg-red-700 rounded-lg font-bold text-sm"
            >
              タッチアウト
            </button>
            <button
              onClick={() => onConfirm("doublePlay")}
              className="py-3 bg-orange-600 rounded-lg font-bold text-sm"
            >
              併殺
            </button>
            <button
              onClick={() => onConfirm("triplePlay")}
              className="py-3 bg-purple-600 rounded-lg font-bold text-sm col-span-2"
            >
              三重殺
            </button>
          </div>
        </div>
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
