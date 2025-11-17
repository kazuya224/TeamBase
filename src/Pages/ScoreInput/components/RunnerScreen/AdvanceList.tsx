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

  // 同じ走者の連続した進塁をグループ化
  const groupedAdvances = (() => {
    const groups: RunnerAdvance[][] = [];
    let currentGroup: RunnerAdvance[] = [];
    let lastRunnerId: string | null = null;
    let lastToBase: Base | null = null;

    runnerAdvances.forEach((advance) => {
      if (
        advance.runnerId !== lastRunnerId ||
        advance.fromBase !== lastToBase
      ) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [advance];
      } else {
        currentGroup.push(advance);
      }
      lastRunnerId = advance.runnerId;
      lastToBase = advance.toBase;
    });
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    return groups;
  })();

  return (
    <div className="mb-3 p-2 bg-gray-800 rounded">
      <div className="text-xs text-gray-400 mb-1">選択された進塁</div>
      {groupedAdvances.map((advances, groupIdx) => {
        const firstAdvance = advances[0];
        const lastAdvance = advances[advances.length - 1];
        const fromBaseLabel = getBaseLabel(firstAdvance.fromBase);
        const toBaseLabel = getBaseLabel(lastAdvance.toBase);
        const outcomeLabel =
          lastAdvance.outcome === "safe"
            ? "セーフ"
            : lastAdvance.outcome === "out"
            ? "アウト"
            : lastAdvance.outcome === "tagOut"
            ? "タッチアウト"
            : "";

        const firstIndex = runnerAdvances.findIndex(
          (a) =>
            a.runnerId === firstAdvance.runnerId &&
            a.fromBase === firstAdvance.fromBase &&
            a.toBase === firstAdvance.toBase
        );

        return (
          <div
            key={groupIdx}
            className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded"
          >
            <div className="flex-1">
              <div className="text-xs">
                {firstAdvance.runnerName}: {fromBaseLabel} → {toBaseLabel}
                {outcomeLabel && ` - ${outcomeLabel}`}
                {lastAdvance.scored && " [得点]"}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {advances
                  .map(
                    (a) =>
                      `${getBaseLabel(a.fromBase)}→${getBaseLabel(a.toBase)}(${
                        ADVANCE_REASONS.find((r) => r.value === a.reason)?.label
                      })`
                  )
                  .join(", ")}
              </div>
            </div>
            <button
              onClick={() => {
                const indices: number[] = [];
                runnerAdvances.forEach((advance, idx) => {
                  if (
                    advance.runnerId === firstAdvance.runnerId &&
                    idx >= firstIndex &&
                    idx < firstIndex + advances.length
                  ) {
                    indices.push(idx);
                  }
                });
                indices.reverse().forEach((idx) => {
                  onRemoveAdvance(idx);
                });
              }}
              className="text-xs text-red-400 underline ml-2"
            >
              削除
            </button>
          </div>
        );
      })}
    </div>
  );
};
