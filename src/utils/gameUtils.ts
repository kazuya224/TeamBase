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
 */
export const getCurrentRunners = (
  currentInning: Inning
): RunnerInfo[] => {
  const runners: RunnerInfo[] = [];
  // ベースごとのランナー情報を保持（名前とrunnerId）
  const baseOccupied: Record<1 | 2 | 3, { name: string; runnerId: "R1" | "R2" | "R3" } | null> = {
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
        // 進塁を fromBase の降順（3→2→1→0）で処理して、同時進塁を正しく処理
        // これにより、後ろのランナーから先に処理され、前のランナーが進んだ後のベース状態が正しく反映される
        const sortedAdvances = [...atBat.runnerAdvances].sort((a, b) => {
          // 打者（fromBase === 0）は最後に処理
          if (a.fromBase === 0) return 1;
          if (b.fromBase === 0) return -1;
          return b.fromBase - a.fromBase;
        });

        sortedAdvances.forEach((advance) => {
          // 打者の進塁処理
          if (advance.runnerId === "BR" || advance.fromBase === 0) {
            if (!advance.out && !advance.scored && advance.toBase !== 4) {
              const toBase = advance.toBase;
              if (toBase >= 1 && toBase <= 3) {
                const runnerName = advance.runnerName || atBat.batterName;
                // 打者は新しいランナーなので、toBaseに応じたrunnerIdを割り当て
                // ただし、既にそのベースにランナーがいる場合は上書きしない（エラーケース）
                if (!baseOccupied[toBase as 1 | 2 | 3]) {
                  baseOccupied[toBase as 1 | 2 | 3] = {
                    name: runnerName,
                    runnerId: `R${toBase}` as "R1" | "R2" | "R3",
                  };
                }
              }
            }
          } else {
            // 既存ランナーの進塁処理
            const fromBase = advance.fromBase as 1 | 2 | 3;
            const runnerId = advance.runnerId;
            const runnerName = advance.runnerName;
            
            // runnerIdでランナーを特定
            const currentRunnerOnBase = baseOccupied[fromBase];
            if (currentRunnerOnBase && currentRunnerOnBase.runnerId === runnerId) {
              // アウトの場合はベースから削除
              if (advance.out) {
                baseOccupied[fromBase] = null;
              } else if (advance.scored || advance.toBase === 4) {
                // 得点した場合はベースから削除
                baseOccupied[fromBase] = null;
              } else {
                // 進塁した場合
                const toBase = advance.toBase;
                if (toBase >= 1 && toBase <= 3) {
                  // 元のベースを空にする
                  baseOccupied[fromBase] = null;
                  // 新しいベースに移動（名前とrunnerIdを保持）
                  // ただし、既に誰かいる場合は上書きしない（エラーケース）
                  if (!baseOccupied[toBase as 1 | 2 | 3]) {
                    baseOccupied[toBase as 1 | 2 | 3] = {
                      name: runnerName || currentRunnerOnBase.name,
                      runnerId: currentRunnerOnBase.runnerId, // runnerIdは変更しない
                    };
                  }
                } else {
                  // toBase が 4（本塁）の場合はベースから削除
                  baseOccupied[fromBase] = null;
                }
              }
            }
          }
        });
      } else {
        // runnerAdvances がない場合のフォールバック処理
        if (atBat.battingResult === "single" && !baseOccupied[1])
          baseOccupied[1] = { name: atBat.batterName, runnerId: "R1" };
        else if (atBat.battingResult === "double" && !baseOccupied[2])
          baseOccupied[2] = { name: atBat.batterName, runnerId: "R2" };
        else if (atBat.battingResult === "triple" && !baseOccupied[3])
          baseOccupied[3] = { name: atBat.batterName, runnerId: "R3" };
        else if (
          (atBat.battingResult === "walk" ||
            atBat.battingResult === "hitByPitch") &&
          !baseOccupied[1]
        ) {
          baseOccupied[1] = { name: atBat.batterName, runnerId: "R1" };
        }
      }
    }
  });

  Object.entries(baseOccupied).forEach(([base, runnerInfo]) => {
    if (runnerInfo) {
      const b = Number(base) as 1 | 2 | 3;
      runners.push({
        base: b,
        name: runnerInfo.name,
        runnerId: runnerInfo.runnerId,
      });
    }
  });
  return runners;
};

/**
 * イニングスコアを取得
 */
export const getInningScore = (
  innings: Inning[],
  inningNumber: number,
  topBottom: "top" | "bottom"
): number => {
  const inning = innings.find(
    (i) => i.inningNumber === inningNumber && i.topBottom === topBottom
  );
  return inning?.score || 0;
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

/**
 * アウト数を再計算（Undo/Redo用）
 */
export const recalculateOuts = (atBats: AtBat[]): number => {
  return atBats.reduce((sum, ab) => sum + (ab.outs || 0), 0) % 3;
};

