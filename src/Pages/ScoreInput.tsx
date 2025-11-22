import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import type { GameMeta } from "../types/gameMeta";
import { useScreenFlow } from "../hooks/useScreenFlow";
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
import { SubstitutionModal } from "./ScoreInput/components/SubstitutionModal";
import { DroppedThirdStrikeModal } from "./ScoreInput/components/DroppedThirdStrikeModal";
import { GameEndModal } from "./ScoreInput/components/GameEndModal";
import { GameMetaForm } from "../Components/GameMeta/GameMetaForm";
import { GameHeader } from "./ScoreInput/components/GameHeader";
import { Scoreboard } from "./ScoreInput/components/Scoreboard";
import { BatterInfoBar } from "./ScoreInput/components/BatterInfoBar";
import { BaseballField } from "./ScoreInput/components/BaseballField";

// =====================================================
// ★ 共通定数・ヘルパーをコンポーネント外に移動
// =====================================================

const DEFAULT_LINEUP = [
  "打者1",
  "打者2",
  "打者3",
  "打者4",
  "打者5",
  "打者6",
  "打者7",
  "打者8",
  "打者9",
];

// lineup生成を共通化
function buildLineupFromGameMeta(
  meta: GameMeta | null,
  currentTopBottom: "top" | "bottom"
): string[] {
  if (!meta) return [...DEFAULT_LINEUP];

  const currentTeam =
    currentTopBottom === "top" ? meta.awayTeam : meta.homeTeam;

  const sortedLineup = [...currentTeam.lineup].sort(
    (a, b) => a.battingOrder - b.battingOrder
  );

  const allPlayers = new Map<string, string>();
  currentTeam.benchPlayers.forEach((player) => {
    allPlayers.set(player.id, player.name || "");
  });

  return sortedLineup.map((entry) => {
    const playerName = allPlayers.get(entry.playerId);
    return playerName || `打者${entry.battingOrder}`;
  });
}

// 打撃結果 → アウト数
function getOutsFromBattingResult(result: BattingResult): number {
  if (result === "strikeout") return 1;
  if (result === "doublePlay") return 2;
  if (result === "triplePlay") return 3;
  if (result === "sacrificeBunt" || result === "sacrificeFly") return 1;
  return 0;
}

// ヒット時の進塁ロジックを共通化
function buildHitAdvances(
  result: BattingResult,
  batterName: string,
  runners: RunnerInfo[]
): RunnerAdvance[] {
  const advances: RunnerAdvance[] = [];

  const baseDeltaMap: Record<"single" | "double" | "triple", number> = {
    single: 1,
    double: 2,
    triple: 3,
  };

  if (result === "homerun") {
    // 打者
    advances.push({
      runnerId: "BR",
      fromBase: 0,
      toBase: 4,
      reason: "Hit",
      scored: true,
      out: false,
      runnerName: batterName,
    });
    // 走者
    runners.forEach((runner) => {
      advances.push({
        runnerId: runner.runnerId,
        fromBase: runner.base as Base,
        toBase: 4,
        reason: "Hit",
        scored: true,
        out: false,
        runnerName: runner.name,
      });
    });
    return advances;
  }

  if (result in baseDeltaMap) {
    const delta = baseDeltaMap[result as "single" | "double" | "triple"];

    advances.push({
      runnerId: "BR",
      fromBase: 0,
      toBase: delta as Base,
      reason: "Hit",
      scored: delta === 4,
      out: false,
      runnerName: batterName,
    });

    runners.forEach((runner) => {
      const newBase = Math.min(runner.base + delta, 4) as Base;
      advances.push({
        runnerId: runner.runnerId,
        fromBase: runner.base as Base,
        toBase: newBase,
        reason: "Hit",
        scored: newBase === 4,
        out: false,
        runnerName: runner.name,
      });
    });
  }

  return advances;
}

const ScoreInput: React.FC = () => {
  const navigate = useNavigate();

  const [gameMeta, setGameMeta] = useState<GameMeta | null>(null);

  const [lineup, setLineup] = useState<string[]>([...DEFAULT_LINEUP]);

  const [gameState, setGameState] = useState<{
    game: Game;
    history: GameAction[];
    historyIndex: number;
  }>({
    game: {
      id: "1",
      date: new Date().toISOString().split("T")[0],
      homeTeam: "",
      awayTeam: "",
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

  // ============================================
  // lineup & 基本情報同期用 useEffect を 1つに集約
  // ============================================
  useEffect(() => {
    if (!gameMeta) return;

    const newLineup = buildLineupFromGameMeta(
      gameMeta,
      gameState.game.currentTopBottom
    );

    setLineup(newLineup);
    setGameState((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        homeTeam: gameMeta.homeTeam.name || prev.game.homeTeam,
        awayTeam: gameMeta.awayTeam.name || prev.game.awayTeam,
        date: gameMeta.gameInfo.date || prev.game.date,
        lineup: newLineup,
      },
    }));
  }, [gameMeta, gameState.game.currentTopBottom]);

  // ============================================
  // ★ 攻撃側ごとに打順インデックスを分ける
  // ============================================
  const [topBatterIndex, setTopBatterIndex] = useState(0); // 表（away）の次打者
  const [bottomBatterIndex, setBottomBatterIndex] = useState(0); // 裏（home）の次打者

  // 現在の攻撃側を判定して、currentBatterIndex を派生値として定義
  const isTop = gameState.game.currentTopBottom === "top";
  const currentBatterIndex = isTop ? topBatterIndex : bottomBatterIndex;

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
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [isDroppedThirdStrikeModalOpen, setIsDroppedThirdStrikeModalOpen] =
    useState(false);
  const [pendingStrikeoutPitch, setPendingStrikeoutPitch] = useState<{
    result: PitchResult;
    count: { balls: number; strikes: number };
  } | null>(null);
  const [isGameEndModalOpen, setIsGameEndModalOpen] = useState(false);

  const {
    currentScreen,
    setCurrentScreen,
    screenHistory,
    setScreenHistory,
    navigateToScreen,
    goBack,
    inputStep,
    setInputStep,
    canGoBack,
  } = useScreenFlow();

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

  const getCurrentInning = useCallback((): Inning => {
    return getOrCreateInning(
      gameState.game,
      gameState.game.currentInning,
      gameState.game.currentTopBottom,
      currentOuts,
      setGameState
    );
  }, [gameState.game, currentOuts]);

  const getCurrentRunners = useCallback((): RunnerInfo[] => {
    const currentInning = getCurrentInning();
    return getCurrentRunnersUtil(currentInning);
  }, [getCurrentInning]);

  const getInningScoreUtil = (
    inningNumber: number,
    topBottom: "top" | "bottom"
  ): number | null => {
    return getInningScore(gameState.game.innings, inningNumber, topBottom);
  };

  const getTeamHitsUtil = (topBottom: "top" | "bottom"): number => {
    return getTeamHits(gameState.game.innings, topBottom);
  };

  const getTeamErrorsUtil = (topBottom: "top" | "bottom"): number => {
    return getTeamErrors(gameState.game.innings, topBottom);
  };

  const canDroppedThirdStrike = useCallback((): boolean => {
    const runners = getCurrentRunners();
    const hasRunnerOnFirst = runners.some((r) => r.base === 1);
    return !hasRunnerOnFirst || currentOuts >= 2;
  }, [getCurrentRunners, currentOuts]);

  const checkInfieldFlyCondition = useCallback((): boolean => {
    const runners = getCurrentRunners();
    const bases = runners.map((r) => r.base);
    const outs = currentOuts;

    // 2アウト以上ならインフィールドフライは成立しない
    if (outs >= 2) return false;

    const baseSet = new Set(bases);
    const has1 = baseSet.has(1);
    const has2 = baseSet.has(2);
    const has3 = baseSet.has(3);

    // 1・2塁 または 満塁のみ
    const isFirstAndSecond = has1 && has2 && !has3;
    const isBasesLoaded = has1 && has2 && has3;

    return isFirstAndSecond || isBasesLoaded;
  }, [getCurrentRunners, currentOuts]);

  const calculateForcedAdvancesUtil = useCallback(
    (batterToBase: Base): RunnerAdvance[] => {
      const runners = getCurrentRunners();
      return calculateForcedAdvances(batterToBase, runners);
    },
    [getCurrentRunners]
  );

  // 四球AtBat共通ヘルパー
  // 四球 / 死球 AtBat 共通ヘルパー
  const createWalkAtBat = useCallback(
    (
      pitches: Array<{
        result: PitchResult;
        count: { balls: number; strikes: number };
      }>,
      reason: RunnerAdvanceReason = "BB" // "BB" or "HBP"
    ): AtBat => {
      const currentBatter = lineup[currentBatterIndex];

      // RunnerScreenでユーザーが入力するため、空配列で初期化
      return {
        batterName: currentBatter,
        battingResult: reason === "HBP" ? "hitByPitch" : "walk",
        pitches,
        outs: 0,
        rbis: 0, // RBIs は handleSaveRunnerAdvances で再計算
        runnerAdvances: [], // 空配列で初期化、RunnerScreenでユーザーが入力
        timestamp: new Date().toISOString(),
      };
    },
    [lineup, currentBatterIndex]
  );

  const handlePitchResult = (result: PitchResult) => {
    // カウントの元値
    let newStrikes = currentAtBat.strikes;
    let newBalls = currentAtBat.balls;

    // ==============================
    // ストライク系
    // ==============================
    if (
      result === "strike" ||
      result === "swingingMiss" ||
      result === "calledStrike"
    ) {
      newStrikes++;

      if (newStrikes >= 3) {
        // 振り逃げ判定用に最後の投球を保持してモーダルへ
        setPendingStrikeoutPitch({
          result,
          count: { balls: newBalls, strikes: newStrikes },
        });
        setIsDroppedThirdStrikeModalOpen(true);
        return;
      }

      // ==============================
      // ボール（四球判定）
      // ==============================
    } else if (result === "ball") {
      newBalls++;

      // ★ 4ボールになったらフォアボール処理
      if (newBalls >= 4) {
        const atBat = createWalkAtBat(
          [
            ...currentAtBat.pitches,
            { result, count: { balls: newBalls, strikes: newStrikes } },
          ],
          "BB"
        );

        // 走者入力待ちの打席として pendingAtBat に保存
        setPendingAtBat(atBat);
        setLastAtBatBatterName(lineup[currentBatterIndex]);

        // このタイミングではアウト・打者進行は行わない（Runner画面で決定）
        resetAtBatInputs();
        navigateToScreen("runner");
        setRunnerActionType("");

        return;
      }

      // ==============================
      // ファウル
      // ==============================
    } else if (result === "foul") {
      if (newStrikes < 2) newStrikes++;

      // ==============================
      // ファウルチップ
      // ==============================
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

      // ==============================
      // 死球（HBP）
      // ==============================
    } else if (result === "hitByPitch") {
      const atBat = createWalkAtBat(
        [
          ...currentAtBat.pitches,
          { result, count: { balls: newBalls, strikes: newStrikes } },
        ],
        "HBP"
      );

      setPendingAtBat(atBat);
      setLastAtBatBatterName(lineup[currentBatterIndex]);
      resetAtBatInputs();
      navigateToScreen("runner");
      setRunnerActionType("");

      return;

      // ==============================
      // ヒット → 打球入力画面へ
      // ==============================
    } else if (result === "hit") {
      navigateToScreen("batting");
      return;

      // ==============================
      // バント
      // ==============================
    } else if (result === "bunt") {
      if (newStrikes >= 2) {
        completeAtBat("strikeout");
        return;
      }
      navigateToScreen("buntType");
      return;
    }

    // ==============================
    // ここまで来たらカウントと投球履歴を更新
    // ==============================
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

  const handleDroppedThirdStrikeSelect = (isDropped: boolean) => {
    if (!pendingStrikeoutPitch) return;

    setIsDroppedThirdStrikeModalOpen(false);

    if (isDropped) {
      navigateToScreen("runner");
      setPendingAtBat({
        batterName: lineup[currentBatterIndex],
        battingResult: "strikeout",
        pitches: [...currentAtBat.pitches, pendingStrikeoutPitch],
        outs: 0,
        rbis: 0,
        droppedThirdStrike: true,
        strikeoutType: "droppedThird",
      });
    } else {
      const atBat: AtBat = {
        batterName: lineup[currentBatterIndex],
        battingResult: "strikeout",
        pitches: [...currentAtBat.pitches, pendingStrikeoutPitch],
        outs: 1,
        rbis: 0,
        timestamp: new Date().toISOString(),
      };
      saveAtBatWithPending(atBat);
      resetAtBatInputs();
    }

    setPendingStrikeoutPitch(null);
  };

  const completeAtBat = (result: BattingResult) => {
    const currentBatter = lineup[currentBatterIndex];
    const outs = getOutsFromBattingResult(result); // ★ 共通関数で簡略化

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
      setPendingAtBat(atBat);
      setLastAtBatBatterName(currentBatter);
      navigateToScreen("runner");
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

    // ★ この打席で入った得点を集計
    const runsScoredThisAtBat = (atBat.runnerAdvances || []).filter(
      (a) => a.scored || a.toBase === 4 // 本塁到達も含める
    ).length;

    const updatedInning: Inning = {
      ...currentInning,
      atBats: [...currentInning.atBats, atBat],
      outs: (currentOuts + atBat.outs) % 3,
      // ★ ここでイニングスコアを加算
      score: (currentInning.score || 0) + runsScoredThisAtBat,
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
        // ★ ここでは inning.score を使うので OK（得点計算済み）
        return { ...game, innings: updatedInnings };
      },
      revert: (game: Game) => {
        // ここは今のままでも OK（あとで applyAction 側で合計点を再計算する）
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

    // ============================================
    // ★ 打順進行ロジックの統一: advanceBatter() を常に1回呼ぶ
    // ============================================
    if (shouldAdvanceBatter) {
      const newOuts = currentOuts + atBat.outs;

      // 攻撃側の「次打者」を常に1つ先に進める
      advanceBatter();

      if (newOuts >= 3) {
        // 3アウトなら攻守交代
        nextInning();
      }

      setCurrentOuts(newOuts % 3);
    }
  };

  const handleSaveRunnerAdvances = (advances: RunnerAdvance[]) => {
    const currentInning = getCurrentInning();
    const currentBatter = lastAtBatBatterName || pendingAtBat?.batterName;

    // ★ 修正: 得点した走者を runnerId ベースで重複排除
    const scoredRunners = new Set<string>();
    advances.forEach((a) => {
      if (a.scored && a.runnerId) {
        scoredRunners.add(a.runnerId);
      }
    });
    const scoredCount = scoredRunners.size;

    // ★ 修正: RBI（打点）の計算
    // 打点がつく条件:
    // 1. 得点した走者がいる
    // 2. その得点が以下のいずれかによるもの:
    //    - Hit（安打）
    //    - SF（犠飛）
    //    - SH（犠打）で得点した場合
    //    - BB（四球）で押し出し
    //    - HBP（死球）で押し出し
    // 3. エラー（E）のみでの得点は打点にカウントしない
    const calculateRBIs = (): number => {
      let rbis = 0;

      // 得点した走者ごとにチェック
      scoredRunners.forEach((runnerId) => {
        // その走者の最終的な進塁記録を取得（toBase === 4 のもの）
        const scoringAdvance = advances.find(
          (a) => a.runnerId === runnerId && a.scored
        );

        if (!scoringAdvance) return;

        // 打点がつく理由かどうかを判定
        const reason = scoringAdvance.reason;
        const rbiReasons: RunnerAdvanceReason[] = [
          "Hit",
          "SF",
          "BB",
          "HBP",
          "BatterInterference",
          "FielderInterference",
        ];

        // 犠打（SH）は走者が得点した場合のみ打点
        // エラー（E）やフィールダースチョイス（FC）は打点なし
        if (rbiReasons.includes(reason)) {
          rbis++;
        } else if (reason === "SH") {
          // 犠打は通常アウトだが、得点すれば打点になる
          rbis++;
        }
      });

      return rbis;
    };

    // ★ 修正: 走者のアウト数を runnerId ベースでカウント
    const outRunners = new Set<string>();
    advances.forEach((a) => {
      if (a.out && a.runnerId) {
        outRunners.add(a.runnerId);
      }
    });
    const runnerOuts = outRunners.size;

    // ★ pendingAtBat があるパターン（フォアボール・死球・ヒットなど）
    if (pendingAtBat) {
      const rbis = calculateRBIs();

      const updatedAtBat: AtBat = {
        ...pendingAtBat,
        batterName: pendingAtBat.batterName || currentBatter || "",
        runnerAdvances: advances,
        rbis,
        outs: (pendingAtBat.outs || 0) + runnerOuts,
      };

      // ★ 打者の進行・アウト数の更新は saveAtBatWithPending に任せる
      saveAtBatWithPending(updatedAtBat, true);

      // ★ ここでは余計な進行処理は行わず、状態リセットのみ行う
      setPendingAtBat(null);
      setLastAtBatBatterName("");
      setCurrentScreen("pitch");
      resetAtBatInputs();
      return;
    }

    // ★ ここから下は既存の「pendingAtBat がない」パターン
    if (!currentBatter) {
      setIsRunnerModalOpen(false);
      return;
    }

    const rbis = calculateRBIs();

    const updatedAtBats = [...currentInning.atBats];
    const lastIndex = updatedAtBats.length - 1;

    if (
      lastIndex >= 0 &&
      updatedAtBats[lastIndex].batterName === currentBatter
    ) {
      const lastAtBat = updatedAtBats[lastIndex];
      const lastOutsBefore = lastAtBat.outs || 0;

      // ★ 修正: 以前の得点数も runnerId ベースで計算
      const previousScoredRunners = new Set<string>();
      (lastAtBat.runnerAdvances || []).forEach((a) => {
        if (a.scored && a.runnerId) {
          previousScoredRunners.add(a.runnerId);
        }
      });
      const lastScoredBefore = previousScoredRunners.size;

      updatedAtBats[lastIndex] = {
        ...lastAtBat,
        runnerAdvances: advances,
        rbis, // ★ 修正: 計算された RBI を設定
      };

      const outsThisPlay = (lastAtBat.outs || 0) + runnerOuts;
      const newOuts = currentOuts + (outsThisPlay - lastOutsBefore);
      const newScore = currentInning.score + (scoredCount - lastScoredBefore);

      const updatedInning = {
        ...currentInning,
        atBats: updatedAtBats,
        score: newScore,
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
    resetAtBatInputs();
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

  // ============================================
  // ★ advanceBatter を攻撃側ごとに分岐
  // ============================================
  const advanceBatter = () => {
    if (gameState.game.currentTopBottom === "top") {
      setTopBatterIndex((prev) => (prev + 1) % lineup.length);
    } else {
      setBottomBatterIndex((prev) => (prev + 1) % lineup.length);
    }
  };

  // ============================================
  // ★ nextInning では打順をリセットしない
  // ============================================
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
  };

  // ★ ヒット系の進塁処理を共通関数で短縮
  const handleBattingResultSelect = (result: BattingResult) => {
    const currentBatter = lineup[currentBatterIndex];
    const outs = getOutsFromBattingResult(result);
    const runners = getCurrentRunners();

    const runnerAdvances =
      result === "single" ||
      result === "double" ||
      result === "triple" ||
      result === "homerun"
        ? buildHitAdvances(result, currentBatter, runners)
        : [];

    const atBat: AtBat = {
      batterName: currentBatter,
      battingResult: result,
      pitches: currentAtBat.pitches,
      outs,
      rbis: 0, // ★ RBIs は handleSaveRunnerAdvances で最終決定する前提
      hitDirection: selectedHitDirection || undefined,
      hitType: selectedHitType || undefined,
      position: selectedPosition || undefined,
      runnerAdvances: runnerAdvances.length > 0 ? runnerAdvances : undefined,
      timestamp: new Date().toISOString(),
    };

    setPendingAtBat(atBat);
  };

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

  // ============================================
  // ★ localStorage 保存: 表裏のインデックスを保存
  // ============================================
  const handleSave = () => {
    localStorage.setItem(
      "baseballGame",
      JSON.stringify(gameState.game, null, 2)
    );
    localStorage.setItem(
      "baseballGameState",
      JSON.stringify({
        game: gameState.game,
        history: gameState.history,
        historyIndex: gameState.historyIndex,
        currentTopBatterIndex: topBatterIndex,
        currentBottomBatterIndex: bottomBatterIndex,
        currentOuts,
        currentAtBat,
        currentScreen,
        screenHistory,
      })
    );
    alert("保存しました");
  };

  const handleGameEnd = () => {
    setIsGameEndModalOpen(true);
  };

  const handleGameEndConfirm = (endTime: string | null) => {
    setIsGameEndModalOpen(false);

    if (gameMeta) {
      const updatedGameMeta = {
        ...gameMeta,
        gameInfo: {
          ...gameMeta.gameInfo,
          endTime: endTime !== null ? endTime : "",
        },
      };
      setGameMeta(updatedGameMeta);
      localStorage.setItem("gameMeta", JSON.stringify(updatedGameMeta));
    }
    handleSave();
    alert("試合を終了しました。");
    navigate("/records");
  };

  const handleSubstitution = (substitution: {
    team: "home" | "away";
    type: "batter" | "runner" | "defense" | "defenseSwap";
    originalPlayerId: string;
    newPlayerId: string;
    battingOrder?: number;
    base?: Base;
    position?: Position;
    fromPosition?: Position;
    toPosition?: Position;
  }) => {
    if (!gameMeta) return;

    const teamKey = substitution.team === "home" ? "homeTeam" : "awayTeam";
    const team = gameMeta[teamKey];

    const updateLineupNames = (updatedMeta: GameMeta) => {
      const newLineupNames = buildLineupFromGameMeta(
        updatedMeta,
        gameState.game.currentTopBottom
      );
      setLineup(newLineupNames);
      setGameState((prev) => ({
        ...prev,
        game: {
          ...prev.game,
          lineup: newLineupNames,
        },
      }));
      localStorage.setItem("gameMeta", JSON.stringify(updatedMeta));
    };

    if (substitution.type === "batter") {
      if (substitution.newPlayerId) {
        const newLineup = team.lineup.map((entry) =>
          entry.battingOrder === substitution.battingOrder
            ? { ...entry, playerId: substitution.newPlayerId }
            : entry
        );
        const updatedGameMeta: GameMeta = {
          ...gameMeta,
          [teamKey]: {
            ...team,
            lineup: newLineup,
          },
        };
        setGameMeta(updatedGameMeta);
        updateLineupNames(updatedGameMeta);
      }
      alert("打者交代を記録しました。");
    } else if (substitution.type === "runner") {
      // 走者交代の実装
      const runnerIndex = team.lineup.findIndex(
        (entry) => entry.playerId === substitution.originalPlayerId
      );

      if (runnerIndex === -1) {
        alert("交代対象の走者がラインナップ内に見つかりません");
        setIsSubstitutionModalOpen(false);
        return;
      }

      const newLineup = team.lineup.map((entry, idx) =>
        idx === runnerIndex
          ? { ...entry, playerId: substitution.newPlayerId }
          : entry
      );

      const updatedGameMeta: GameMeta = {
        ...gameMeta,
        [teamKey]: {
          ...team,
          lineup: newLineup,
        },
      };

      setGameMeta(updatedGameMeta);
      updateLineupNames(updatedGameMeta);

      alert("走者交代を記録しました。");
      setIsSubstitutionModalOpen(false);
      return;
    } else if (substitution.type === "defense") {
      if (!substitution.position || !substitution.newPlayerId) {
        alert("守備位置と交代後の選手を選択してください");
        setIsSubstitutionModalOpen(false);
        return;
      }

      const originalIndex = team.lineup.findIndex(
        (entry) => entry.position === substitution.position
      );

      if (originalIndex === -1) {
        alert("指定した守備位置に選手が見つかりません");
        setIsSubstitutionModalOpen(false);
        return;
      }

      const newLineup = team.lineup.map((entry, idx) =>
        idx === originalIndex
          ? { ...entry, playerId: substitution.newPlayerId }
          : entry
      );

      const updatedGameMeta: GameMeta = {
        ...gameMeta,
        [teamKey]: {
          ...team,
          lineup: newLineup,
        },
      };

      setGameMeta(updatedGameMeta);
      updateLineupNames(updatedGameMeta);

      alert("守備交代を記録しました。");
      setIsSubstitutionModalOpen(false);
      return;
    } else if (substitution.type === "defenseSwap") {
      if (!substitution.fromPosition || !substitution.toPosition) {
        alert("入れ替える守備位置を2つ選択してください");
        setIsSubstitutionModalOpen(false);
        return;
      }

      const fromIndex = team.lineup.findIndex(
        (entry) => entry.position === substitution.fromPosition
      );
      const toIndex = team.lineup.findIndex(
        (entry) => entry.position === substitution.toPosition
      );

      if (fromIndex === -1 || toIndex === -1) {
        alert("指定した守備位置に選手が見つかりません");
        setIsSubstitutionModalOpen(false);
        return;
      }

      const newLineup = [...team.lineup];
      const fromEntry = newLineup[fromIndex];
      const toEntry = newLineup[toIndex];
      newLineup[fromIndex] = { ...fromEntry, playerId: toEntry.playerId };
      newLineup[toIndex] = { ...toEntry, playerId: fromEntry.playerId };

      const updatedGameMeta: GameMeta = {
        ...gameMeta,
        [teamKey]: {
          ...team,
          lineup: newLineup,
        },
      };

      setGameMeta(updatedGameMeta);
      updateLineupNames(updatedGameMeta);

      alert("守備位置を入れ替えました。");
      setIsSubstitutionModalOpen(false);
      return;
    }

    setIsSubstitutionModalOpen(false);
  };

  // gameMetaの復元
  useEffect(() => {
    const savedGameMeta = localStorage.getItem("gameMeta");
    if (savedGameMeta) {
      try {
        const loadedGameMeta = JSON.parse(savedGameMeta);
        if (
          loadedGameMeta.gameInfo?.endTime &&
          loadedGameMeta.gameInfo.endTime.trim() !== ""
        ) {
          setGameMeta(null);
          localStorage.removeItem("gameMeta");
          localStorage.removeItem("baseballGame");
          localStorage.removeItem("baseballGameState");
          return;
        }
        setGameMeta(loadedGameMeta);
      } catch (e) {
        console.error("Failed to load gameMeta", e);
      }
    }
  }, []);

  // ============================================
  // ★ 試合状態の復元: 表裏のインデックスを復元
  // ============================================
  useEffect(() => {
    const savedGameState = localStorage.getItem("baseballGameState");

    const loadLegacyGame = () => {
      const saved = localStorage.getItem("baseballGame");
      if (!saved) return;
      try {
        const loadedGame = JSON.parse(saved);
        setGameState((prev) => ({ ...prev, game: loadedGame }));
        const currentInning = loadedGame.innings.find(
          (i: Inning) =>
            i.inningNumber === loadedGame.currentInning &&
            i.topBottom === loadedGame.currentTopBottom
        );
        if (currentInning) {
          const recalculatedOuts = recalculateOuts(currentInning.atBats);
          setCurrentOuts(recalculatedOuts);
        }
      } catch (e2) {
        console.error("Failed to load game data", e2);
      }
    };

    if (savedGameState) {
      try {
        const loadedState = JSON.parse(savedGameState);
        setGameState({
          game: loadedState.game,
          history: loadedState.history || [],
          historyIndex: loadedState.historyIndex || -1,
        });

        // ★ 表裏のインデックスを復元（旧バージョン互換）
        setTopBatterIndex(
          loadedState.currentTopBatterIndex ??
            loadedState.currentBatterIndex ??
            0
        );
        setBottomBatterIndex(
          loadedState.currentBottomBatterIndex ??
            loadedState.currentBatterIndex ??
            0
        );

        setCurrentOuts(loadedState.currentOuts || 0);
        setCurrentAtBat(
          loadedState.currentAtBat || { pitches: [], strikes: 0, balls: 0 }
        );
        setCurrentScreen(loadedState.currentScreen || "pitch");
        setScreenHistory(loadedState.screenHistory || []);

        const currentInning = loadedState.game.innings.find(
          (i: Inning) =>
            i.inningNumber === loadedState.game.currentInning &&
            i.topBottom === loadedState.game.currentTopBottom
        );
        if (currentInning) {
          const recalculatedOuts = recalculateOuts(currentInning.atBats);
          setCurrentOuts(recalculatedOuts);
        }
      } catch (e) {
        console.error("Failed to load game state", e);
        loadLegacyGame();
      }
    } else {
      loadLegacyGame();
    }
  }, []);

  // ============================================
  // ★ 自動保存: 表裏のインデックスを保存
  // ============================================
  useEffect(() => {
    if (gameMeta && gameState.game.id) {
      if (
        !gameMeta.gameInfo?.endTime ||
        gameMeta.gameInfo.endTime.trim() === ""
      ) {
        localStorage.setItem(
          "baseballGameState",
          JSON.stringify({
            game: gameState.game,
            history: gameState.history,
            historyIndex: gameState.historyIndex,
            currentTopBatterIndex: topBatterIndex,
            currentBottomBatterIndex: bottomBatterIndex,
            currentOuts,
            currentAtBat,
            currentScreen,
            screenHistory,
          })
        );
        localStorage.setItem(
          "baseballGame",
          JSON.stringify(gameState.game, null, 2)
        );
      }
    }
  }, [
    gameState,
    topBatterIndex,
    bottomBatterIndex,
    currentOuts,
    currentAtBat,
    currentScreen,
    screenHistory,
    gameMeta,
  ]);

  if (!gameMeta) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6 px-4">試合情報を入力</h1>
          <GameMetaForm
            onSubmit={(meta) => {
              setGameMeta(meta);
              localStorage.setItem("gameMeta", JSON.stringify(meta));
            }}
            onChange={(meta) => {
              localStorage.setItem("gameMeta", JSON.stringify(meta));
            }}
          />
        </div>
      </div>
    );
  }

  const runners = getCurrentRunners();
  const canUndo = gameState.historyIndex >= 0;
  const canRedo = gameState.historyIndex < gameState.history.length - 1;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-16 lg:pt-20">
      <GameHeader
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
      />

      <Scoreboard
        awayTeam={gameState.game.awayTeam}
        homeTeam={gameState.game.homeTeam}
        currentInning={gameState.game.currentInning}
        currentTopBottom={gameState.game.currentTopBottom}
        awayScore={gameState.game.awayScore}
        homeScore={gameState.game.homeScore}
        getInningScore={getInningScoreUtil}
        getTeamHits={getTeamHitsUtil}
        getTeamErrors={getTeamErrorsUtil}
      />

      <BatterInfoBar
        batterIndex={currentBatterIndex}
        batterName={lineup[currentBatterIndex]}
        balls={currentAtBat.balls}
        strikes={currentAtBat.strikes}
        outs={currentOuts}
      />

      <BaseballField runners={runners} />

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
        canGoBack={canGoBack}
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
        onGameEnd={handleGameEnd}
        onOpenSubstitutionModal={() => setIsSubstitutionModalOpen(true)}
      />

      {/* RunnerAdvanceModalは盗塁・牽制・暴投など、走者1人だけを扱う特殊なケースでのみ使用 */}
      {/* HBP/BBの時はRunnerScreenを使用するため、ここでは表示しない */}
      {isRunnerModalOpen &&
        currentScreen === "pitch" &&
        runnerActionType !== "" &&
        pendingAtBat?.battingResult !== "hitByPitch" &&
        pendingAtBat?.battingResult !== "walk" && (
          <RunnerAdvanceModal
            isOpen={isRunnerModalOpen}
            onClose={() => {
              setIsRunnerModalOpen(false);
              setRunnerActionType("");
              setCurrentScreen("pitch");
            }}
            onSave={handleSaveRunnerAdvances}
            currentRunners={runners}
            currentBatterName={lastAtBatBatterName}
            actionType={runnerActionType}
            batterReason="Other"
            initialAdvances={undefined}
          />
        )}

      {isSubstitutionModalOpen && gameMeta && (
        <SubstitutionModal
          isOpen={isSubstitutionModalOpen}
          onClose={() => setIsSubstitutionModalOpen(false)}
          onConfirm={handleSubstitution}
          gameMeta={gameMeta}
          currentInning={gameState.game.currentInning}
          currentTopBottom={gameState.game.currentTopBottom}
          currentBatterIndex={currentBatterIndex}
          runners={runners}
        />
      )}

      <DroppedThirdStrikeModal
        isOpen={isDroppedThirdStrikeModalOpen}
        onSelect={handleDroppedThirdStrikeSelect}
        batterName={lineup[currentBatterIndex] || ""}
      />

      <GameEndModal
        isOpen={isGameEndModalOpen}
        onConfirm={handleGameEndConfirm}
        onCancel={() => setIsGameEndModalOpen(false)}
      />
    </div>
  );
};

export default ScoreInput;
