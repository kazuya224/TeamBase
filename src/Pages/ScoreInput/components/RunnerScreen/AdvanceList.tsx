import React from "react";
import type { RunnerAdvance, Base } from "../../../../types/baseball";
import { ADVANCE_REASONS } from "./advanceReasons";
import { getBaseLabel } from "./utils";

interface AdvanceListProps {
  runnerAdvances: RunnerAdvance[];
  onRemoveAdvance: (index: number) => void;
}

export const AdvanceList: React.FC<AdvanceListProps> = ({
  runnerAdvances,
  onRemoveAdvance,
}) => {
  if (runnerAdvances.length === 0) return null;

  return (
    <div className="mb-3 p-2 bg-gray-800 rounded">
      <div className="text-xs text-gray-400 mb-1">選択された進塁</div>
      {runnerAdvances.map((advance, index) => {
        const fromBaseLabel = getBaseLabel(advance.fromBase);
        const toBaseLabel = getBaseLabel(advance.toBase);
        const outcomeLabel =
          advance.outcome === "safe"
            ? "セーフ"
            : advance.outcome === "out"
            ? "アウト"
            : advance.outcome === "tagOut"
            ? "タッチアウト"
            : "";

        const reasonLabel =
          ADVANCE_REASONS.find((r) => r.value === advance.reason)?.label ||
          "不明";

        return (
          <div
            key={index}
            className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded"
          >
            <div className="flex-1">
              <div className="text-xs">
                {advance.runnerName}: {fromBaseLabel} → {toBaseLabel}
                {outcomeLabel && ` - ${outcomeLabel}`}
                {advance.scored && " [得点]"}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                理由: {reasonLabel}
              </div>
            </div>
            <button
              onClick={() => onRemoveAdvance(index)}
              className="text-xs text-red-400 underline ml-2 hover:text-red-300"
            >
              削除
            </button>
          </div>
        );
      })}
    </div>
  );
};
