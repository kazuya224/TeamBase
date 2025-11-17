import React, { useState, useEffect, useMemo } from "react";
import type {
  RunnerInfo,
  RunnerAdvance,
  RunnerAdvanceReason,
  Base,
} from "../../../types/baseball";

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
  batterReason?: RunnerAdvanceReason;
  initialAdvances?: RunnerAdvance[];
}

type ActionType =
  | "stolenBase"
  | "pickoff"
  | "wildPitch"
  | "passedBall"
  | "balk"
  | "";

interface RunnerState {
  toBase: number;
  scored: boolean;
  out: boolean;
  reason: RunnerAdvanceReason;
}

interface BatterState {
  toBase: number;
  scored: boolean;
}

const createDefaultRunnerState = (
  fromBase: number,
  defaultReason: RunnerAdvanceReason = "Other"
): RunnerState => ({
  toBase: fromBase,
  scored: false,
  out: false,
  reason: defaultReason,
});

const getDefaultReasonByAction = (
  actionType: ActionType
): RunnerAdvanceReason => {
  switch (actionType) {
    case "stolenBase":
      return "SB";
    case "pickoff":
      return "PO";
    case "wildPitch":
      return "WP";
    case "passedBall":
      return "PB";
    case "balk":
      return "BK";
    default:
      return "Other";
  }
};

export const RunnerAdvanceModal: React.FC<RunnerAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentRunners,
  currentBatterName = "",
  actionType = "",
  batterReason = "Hit",
  initialAdvances,
}) => {
  const [runnerStates, setRunnerStates] = useState<Map<number, RunnerState>>(
    () => new Map()
  );
  const [batterState, setBatterState] = useState<BatterState>({
    toBase: 1,
    scored: false,
  });
  const [confirmedRunners, setConfirmedRunners] = useState<Set<number>>(
    () => new Set()
  );
  const [batterConfirmed, setBatterConfirmed] = useState(false);

  // initialAdvances に含まれる runnerId を追跡
  const initialRunnerIds = useMemo(() => {
    const ids = new Set<string | "BR">();
    if (initialAdvances && initialAdvances.length > 0) {
      initialAdvances.forEach((adv) => {
        ids.add(adv.runnerId);
      });
    }
    return ids;
  }, [initialAdvances]);

  // BR が initialAdvances に含まれている場合、その toBase を取得
  const brInitialToBase = useMemo(() => {
    if (initialAdvances && initialAdvances.length > 0) {
      const brAdvance = initialAdvances.find((adv) => adv.runnerId === "BR");
      return brAdvance ? brAdvance.toBase : null;
    }
    return null;
  }, [initialAdvances]);

  // currentRunners から、initialAdvances に既に含まれている runnerId を除外
  // BR が 1塁に進んだ場合、currentRunners の R1 は除外する必要がある
  const filteredRunners = useMemo(() => {
    if (!initialAdvances || initialAdvances.length === 0) {
      return currentRunners;
    }

    // BR が進んだ先のベースを追跡
    const brDestinationBases = new Set<number>();
    initialAdvances.forEach((adv) => {
      if (adv.runnerId === "BR") {
        brDestinationBases.add(adv.toBase);
      }
    });

    return currentRunners.filter((runner) => {
      // initialAdvances に既に含まれている runnerId は除外
      if (initialRunnerIds.has(runner.runnerId)) {
        return false;
      }

      // BR が進んだ先のベースにいる走者は除外（重複を防ぐ）
      // 例: BR が 1塁に進んだ場合、currentRunners の 1塁走者は除外
      if (brDestinationBases.has(runner.base)) {
        // ただし、名前が一致する場合のみ除外（同じ人物の可能性が高い）
        // initialAdvances の BR の runnerName と一致するかチェック
        const brAdvance = initialAdvances.find((adv) => adv.runnerId === "BR");
        if (brAdvance && brAdvance.runnerName === runner.name) {
          return false;
        }
      }

      return true;
    });
  }, [currentRunners, initialAdvances, initialRunnerIds]);

  useEffect(() => {
    if (!isOpen) {
      // モーダルが閉じられたら確定状態をリセット
      setConfirmedRunners(new Set());
      setBatterConfirmed(false);
      return;
    }

    const initialStates = new Map<number, RunnerState>();
    let nextBatterState: BatterState = { toBase: 1, scored: false };

    if (initialAdvances && initialAdvances.length > 0) {
      // initialAdvances がある場合（四球・死球など）
      initialAdvances.forEach((advance) => {
        if (advance.runnerId === "BR") {
          nextBatterState = {
            toBase: advance.toBase,
            scored: advance.scored ?? false,
          };
          // BR が initialAdvances に含まれている場合は確定済みとして扱う
          setBatterConfirmed(true);
        } else if (advance.fromBase > 0) {
          initialStates.set(advance.fromBase, {
            toBase: advance.toBase,
            scored: advance.scored ?? false,
            out: advance.out ?? false,
            reason: advance.reason,
          });
        }
      });
    } else {
      // initialAdvances がない場合は、アクション別のデフォルト reason を適用
      const defaultReason = getDefaultReasonByAction(actionType);
      filteredRunners.forEach((runner) => {
        initialStates.set(
          runner.base,
          createDefaultRunnerState(runner.base, defaultReason)
        );
      });
    }

    // filteredRunners に対して初期状態を設定
    const defaultReason = getDefaultReasonByAction(actionType);
    filteredRunners.forEach((runner) => {
      if (!initialStates.has(runner.base)) {
        initialStates.set(
          runner.base,
          createDefaultRunnerState(runner.base, defaultReason)
        );
      }
    });

    setRunnerStates(initialStates);
    setBatterState(nextBatterState);
  }, [isOpen, filteredRunners, actionType, initialAdvances]);

  const handleRunnerMove = (fromBase: number, toBase: number) => {
    setRunnerStates((prev) => {
      const newStates = new Map(prev);
      const current =
        newStates.get(fromBase) ?? createDefaultRunnerState(fromBase);

      let nextReason = current.reason;

      // 盗塁で 1 個だけ進んだときは SB に補正
      if (actionType === "stolenBase" && toBase === fromBase + 1) {
        nextReason = "SB";
      }

      newStates.set(fromBase, {
        ...current,
        toBase,
        scored: toBase === 4,
        out: false,
        reason: nextReason,
      });

      return newStates;
    });
  };

  const handleRunnerOut = (fromBase: number) => {
    setRunnerStates((prev) => {
      const newStates = new Map(prev);
      const current =
        newStates.get(fromBase) ?? createDefaultRunnerState(fromBase);

      let nextReason = current.reason;
      if (actionType === "stolenBase") {
        nextReason = "CS";
      } else if (actionType === "pickoff") {
        nextReason = "PO";
      }

      newStates.set(fromBase, {
        ...current,
        out: true,
        scored: false,
        reason: nextReason,
      });

      return newStates;
    });
  };

  const handleBatterMove = (toBase: number) => {
    setBatterState({
      toBase,
      scored: toBase === 4,
    });
  };

  const handleConfirmRunner = (fromBase: number) => {
    const runner = filteredRunners.find((r) => r.base === fromBase);
    if (!runner) return;

    const state = runnerStates.get(fromBase);
    if (!state) return;

    const advances: RunnerAdvance[] = [
      {
        runnerId: runner.runnerId,
        fromBase: runner.base as Base,
        toBase: state.toBase as Base,
        scored: state.scored,
        out: state.out,
        runnerName: runner.name,
        reason: state.reason,
        playType: "normal",
      },
    ];

    onSave(advances);
    setConfirmedRunners((prev) => new Set(prev).add(fromBase));
  };

  const handleConfirmBatter = () => {
    if (!currentBatterName || actionType) return;

    const advances: RunnerAdvance[] = [
      {
        runnerId: "BR",
        fromBase: 0 as Base,
        toBase: batterState.toBase as Base,
        scored: batterState.scored,
        out: false,
        runnerName: currentBatterName,
        reason: batterReason,
      },
    ];

    onSave(advances);
    setBatterConfirmed(true);
  };

  const handleSave = () => {
    const advances: RunnerAdvance[] = [];

    // 汎用モーダル（actionType が空）のときのみ打者(BR)を動かす
    if (!actionType && currentBatterName && !batterConfirmed) {
      advances.push({
        runnerId: "BR",
        fromBase: 0 as Base,
        toBase: batterState.toBase as Base,
        scored: batterState.scored,
        out: false,
        runnerName: currentBatterName,
        reason: batterReason,
      });
    }

    filteredRunners.forEach((runner) => {
      if (confirmedRunners.has(runner.base)) return;
      const state = runnerStates.get(runner.base);
      if (!state) return;

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
    });

    if (advances.length > 0) {
      onSave(advances);
    }
    onClose();
  };

  if (!isOpen) return null;

  const title = useMemo(() => {
    switch (actionType) {
      case "stolenBase":
        return "🏃 盗塁";
      case "pickoff":
        return "👈 牽制";
      case "wildPitch":
        return "🌀 暴投";
      case "passedBall":
        return "🧤 捕逸";
      case "balk":
        return "⚠️ ボーク";
      default:
        return "走者進塁";
    }
  }, [actionType]);

  const isSaveDisabled =
    filteredRunners.length === 0 &&
    (!currentBatterName || initialRunnerIds.has("BR"));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-3">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          {currentBatterName && !actionType && (
            <div className="mb-4 bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-blue-400">
                  ⚾ 打者: {currentBatterName}
                </h3>
                {(batterConfirmed || initialRunnerIds.has("BR")) && (
                  <span className="text-xs text-green-400">✓ 確定済み</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[1, 2, 3, 4].map((base) => (
                  <button
                    key={base}
                    type="button"
                    onClick={() => handleBatterMove(base)}
                    disabled={batterConfirmed || initialRunnerIds.has("BR")}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      batterState.toBase === base
                        ? "bg-blue-600 text-white scale-105"
                        : "bg-gray-700 hover:bg-gray-600"
                    } ${
                      batterConfirmed || initialRunnerIds.has("BR")
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {base === 4 ? "本塁" : `${base}塁`}
                  </button>
                ))}
              </div>
              {!batterConfirmed && !initialRunnerIds.has("BR") && (
                <button
                  type="button"
                  onClick={handleConfirmBatter}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xs"
                >
                  打者を確定
                </button>
              )}
            </div>
          )}

          {filteredRunners.map((runner) => {
            const isConfirmed = confirmedRunners.has(runner.base);
            const state =
              runnerStates.get(runner.base) ??
              createDefaultRunnerState(runner.base);

            const candidateBases = [
              runner.base,
              runner.base + 1,
              runner.base + 2,
              4,
            ].filter((b) => b <= 4);

            return (
              <div
                key={runner.base}
                className="mb-3 bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-yellow-400">
                    🏃 {runner.base}塁走者: {runner.name}
                  </h3>
                  {isConfirmed && (
                    <span className="text-xs text-green-400">✓ 確定済み</span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {candidateBases.map((base) => (
                    <button
                      key={base}
                      type="button"
                      onClick={() => handleRunnerMove(runner.base, base)}
                      disabled={isConfirmed}
                      className={`py-2 rounded-lg font-bold text-xs transition-all ${
                        state.toBase === base && !state.out
                          ? "bg-green-600 text-white scale-105"
                          : "bg-gray-700 hover:bg-gray-600"
                      } ${isConfirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {base === 4 ? "本塁" : `${base}塁`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleRunnerOut(runner.base)}
                    disabled={isConfirmed}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      state.out
                        ? "bg-red-600 text-white scale-105"
                        : "bg-gray-700 hover:bg-gray-600"
                    } ${isConfirmed ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    OUT
                  </button>
                </div>
                {!isConfirmed && (
                  <button
                    type="button"
                    onClick={() => handleConfirmRunner(runner.base)}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-xs"
                  >
                    この走者を確定
                  </button>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-sm"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
