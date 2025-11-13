import React, { useState, useEffect } from "react";
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
}

export const RunnerAdvanceModal: React.FC<RunnerAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentRunners,
  currentBatterName = "",
  actionType = "",
  batterReason = "Hit",
}) => {
  const [runnerStates, setRunnerStates] = useState<
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

  const [batterState, setBatterState] = useState<{
    toBase: number;
    scored: boolean;
  }>({ toBase: 1, scored: false });

  useEffect(() => {
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
    setRunnerStates((prev) => {
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
    });
  };

  const handleRunnerOut = (fromBase: number) => {
    setRunnerStates((prev) => {
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
    });
  };

  const handleBatterMove = (toBase: number) => {
    setBatterState({ toBase, scored: toBase === 4 });
  };

  const handleSave = () => {
    const advances: RunnerAdvance[] = [];

    // 汎用モーダル（actionTypeが空文字）のときのみ打者(BR)を動かす
    if (!actionType && currentBatterName) {
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

  const getActionTitle = () => {
    if (actionType === "stolenBase") return "🏃 盗塁";
    if (actionType === "pickoff") return "👈 牽制";
    if (actionType === "wildPitch") return "🌀 暴投";
    if (actionType === "passedBall") return "🧤 捕逸";
    if (actionType === "balk") return "⚠️ ボーク";
    return "走者進塁";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-3">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
            <h2 className="text-lg font-bold">{getActionTitle()}</h2>
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
