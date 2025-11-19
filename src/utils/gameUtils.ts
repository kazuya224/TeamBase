// ============================================
// ゲーム関連のユーティリティ関数
// ============================================

import type {
  Inning,
  Game,
  RunnerInfo,
  RunnerAdvance,
  Base,
  AtBat,
  GameAction,
} from "../types/baseball";

/**
 * 現在のイニングを取得（存在しない場合は作成）
 */
export const getOrCreateInning = (
  game: Game,
  currentInning: number,
  currentTopBottom: "top" | "bottom",
  currentOuts: number,
  setGameState: (updater: (prev: any) => any) => void
): Inning => {
  let inning = game.innings.find(
    (i) => i.inningNumber === currentInning && i.topBottom === currentTopBottom
  );
  if (!inning) {
    inning = {
      inningNumber: currentInning,
      topBottom: currentTopBottom,
      atBats: [],
      score: 0,
      outs: currentOuts,
    };
    setGameState((prev: any) => ({
      ...prev,
      game: {
        ...prev.game,
        innings: [...prev.game.innings, inning] as Inning[],
      },
    }));
  }
  return inning;
};

/**
 * 現在の走者を取得
 * - 各打席の runnerAdvances を順番に適用して、最終的な塁上の状態を復元する
 * - ベースごとの占有状態だけを見る。runnerId は「R1/R2/R3」のスロットIDとして振り直す
 */
export const getCurrentRunners = (currentInning: Inning): RunnerInfo[] => {
  // ベースごとの占有状態
  const baseOccupied: Record<1 | 2 | 3, { name: string } | null> = {
    1: null,
    2: null,
    3: null,
  };

  for (const atBat of currentInning.atBats) {
    const { battingResult, runnerAdvances } = atBat;

    if (runnerAdvances && runnerAdvances.length > 0) {
      // ★ 同じ打席内では「後ろのランナーから先」に処理したいので fromBase 降順
      const sorted = [...runnerAdvances].sort((a, b) => b.fromBase - a.fromBase);

      for (const advance of sorted) {
        const name = advance.runnerName || atBat.batterName;

        // 元いた塁から削除（1〜3塁のみ）
        if (advance.fromBase >= 1 && advance.fromBase <= 3) {
          baseOccupied[advance.fromBase as 1 | 2 | 3] = null;
        }

        // 得点 or アウト or 本塁到達 → ベース上には残らない
        if (advance.out || advance.scored || advance.toBase === 4) {
          continue;
        }

        // 新しい塁へ移動（1〜3塁のみ）
        if (advance.toBase >= 1 && advance.toBase <= 3) {
          baseOccupied[advance.toBase as 1 | 2 | 3] = {
            name,
          };
        }
      }
    } else {
      // ★ runnerAdvances がない古い打席向けフォールバック
      if (battingResult === "single") {
        if (!baseOccupied[1]) {
          baseOccupied[1] = { name: atBat.batterName };
        }
      } else if (battingResult === "double") {
        if (!baseOccupied[2]) {
          baseOccupied[2] = { name: atBat.batterName };
        }
      } else if (battingResult === "triple") {
        if (!baseOccupied[3]) {
          baseOccupied[3] = { name: atBat.batterName };
        }
      } else if (
        battingResult === "walk" ||
        battingResult === "hitByPitch"
      ) {
        if (!baseOccupied[1]) {
          baseOccupied[1] = { name: atBat.batterName };
        }
      }
    }
  }

  // ベース状態から RunnerInfo[] を作る
  const runners: RunnerInfo[] = [];
  (Object.entries(baseOccupied) as [string, { name: string } | null][]).forEach(
    ([base, info]) => {
      if (!info) return;
      const b = Number(base) as 1 | 2 | 3;
      runners.push({
        base: b,
        name: info.name,
        runnerId: `R${b}` as "R1" | "R2" | "R3",
      });
    }
  );

  return runners;
};


/**
 * イニングスコアを取得
 */
export const getInningScore = (
  innings: Inning[],
  inningNumber: number,
  topBottom: "top" | "bottom"
): number | null => {
  const inning = innings.find(
    (i) => i.inningNumber === inningNumber && i.topBottom === topBottom
  );
  return inning ? inning.score : null;
};

/**
 * チームの安打数を取得
 */
export const getTeamHits = (
  innings: Inning[],
  topBottom: "top" | "bottom"
): number => {
  return innings
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

/**
 * チームの失策数を取得
 */
export const getTeamErrors = (
  innings: Inning[],
  topBottom: "top" | "bottom"
): number => {
  return innings
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

/**
 * 強制進塁連鎖を計算（四球/死球/申告敬遠時）
 */
export const calculateForcedAdvances = (
  batterToBase: Base,
  runners: RunnerInfo[]
): RunnerAdvance[] => {
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
};

/**
 * イニングとゲームを更新
 */
export const updateInningAndGame = (
  updatedInning: Inning,
  setGameState: (updater: (prev: any) => any) => void
) => {
  setGameState((prev: any) => {
    const updatedInnings = prev.game.innings.map((i: Inning) =>
      i.inningNumber === updatedInning.inningNumber &&
      i.topBottom === updatedInning.topBottom
        ? updatedInning
        : i
    );

    let homeScore = 0;
    let awayScore = 0;
    updatedInnings.forEach((inning: Inning) => {
      if (inning.topBottom === "top") awayScore += inning.score;
      else homeScore += inning.score;
    });

    return {
      ...prev,
      game: { ...prev.game, innings: updatedInnings, homeScore, awayScore },
    };
  });
};

/**
 * GameActionを適用
 */
export const applyAction = (
  action: GameAction,
  setGameState: (updater: (prev: any) => any) => void
) => {
  setGameState((prev: any) => {
    // まず action を適用して innings を更新
    const gameAfterAction = action.apply(prev.game);

    // ★ 全イニングから home/away の合計点を再計算
    let homeScore = 0;
    let awayScore = 0;
    gameAfterAction.innings.forEach((inning: Inning) => {
      if (inning.topBottom === "top") {
        awayScore += inning.score || 0;
      } else {
        homeScore += inning.score || 0;
      }
    });

    const newGame = {
      ...gameAfterAction,
      homeScore,
      awayScore,
    };

    const newHistory = prev.history.slice(0, prev.historyIndex + 1);
    newHistory.push(action);

    return {
      game: newGame,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    };
  });
};

/**
 * アウト数を再計算（Undo/Redo用）
 */
export const recalculateOuts = (atBats: AtBat[]): number => {
  return atBats.reduce((sum, ab) => sum + (ab.outs || 0), 0) % 3;
};

