import React, { useState } from "react";
import type { RunnerInfo } from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

/**
 * ResultScreen: 走者/打者の結果（safe/out/tagOut）を確認・選択する画面
 *
 * 設計メモ:
 * - RunnerScreenで詳細なRunnerAdvance（塁間ごとの理由・結果・得点）を登録
 * - 走者/打者のアウトが絡む場合はpendingAtBatに詰めてResultScreenに遷移
 * - ResultScreenでは「誰がsafe/out/tagOutになったか」を再確認し、resultTypeを集約
 * - 今後「どの走者がアウトだったか」を細かく表示する場合は、
 *   AtBat.outsOrder?: Array<"batter" | "R1" | "R2" | "R3"> を保存する余地あり
 * - RunnerScreenのRunnerAdvance.outフラグと、ResultScreenでの選択結果が矛盾しないよう注意
 */

interface ResultScreenProps {
  runners: RunnerInfo[];
  currentBatterName?: string;
  onConfirm: (
    resultType: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay"
  ) => void;
  onFinishPlay?: () => void;
  onNavigateToDefense?: () => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onNavigateToResult?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  runners,
  currentBatterName,
  onConfirm,
  onFinishPlay,
  onNavigateToDefense,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
}) => {
  const [selectedRunnerIndex, setSelectedRunnerIndex] = useState<number>(0);
  const [runnerResults, setRunnerResults] = useState<
    Record<string, "safe" | "out" | "tagOut" | null>
  >({});

  const allTargets: Array<{ id: string; name: string; label: string }> = [];
  if (currentBatterName) {
    allTargets.push({
      id: "BR",
      name: currentBatterName,
      label: `打者: ${currentBatterName}`,
    });
  }
  runners.forEach((runner) => {
    allTargets.push({
      id: runner.runnerId,
      name: runner.name,
      label: `${runner.base}塁走者: ${runner.name}`,
    });
  });

  const currentTarget = allTargets[selectedRunnerIndex];

  const handleSelectResult = (result: "safe" | "out" | "tagOut") => {
    if (!currentTarget) return;

    setRunnerResults({
      ...runnerResults,
      [currentTarget.id]: result,
    });

    if (selectedRunnerIndex < allTargets.length - 1) {
      setSelectedRunnerIndex(selectedRunnerIndex + 1);
    }
  };

  const allResultsSelected =
    allTargets.length > 0 &&
    allTargets.every((target) => {
      const r = runnerResults[target.id];
      return r === "safe" || r === "out" || r === "tagOut";
    });

  const handleConfirm = () => {
    if (!allResultsSelected) return;

    const outCount = Object.values(runnerResults).filter(
      (r) => r === "out" || r === "tagOut"
    ).length;

    if (outCount === 0) {
      onConfirm("safe");
    } else if (outCount === 1) {
      const outResult = Object.values(runnerResults).find(
        (r) => r === "out" || r === "tagOut"
      );
      onConfirm(outResult === "tagOut" ? "tagOut" : "out");
    } else if (outCount === 2) {
      onConfirm("doublePlay");
    } else {
      onConfirm("triplePlay");
    }
  };

  if (allTargets.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-bold mb-3 text-gray-300">結果を選択</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
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
            className="py-3 bg-orange-600 rounded-lg font-bold text-sm"
          >
            タッチアウト
          </button>
        </div>

        {onFinishPlay && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onFinishPlay}
              className="flex-1 py-2 bg-green-600 rounded-lg font-bold text-xs"
            >
              プレー終了
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">結果を選択</h3>

      <div className="mb-3 text-xs text-gray-400">
        {selectedRunnerIndex + 1} / {allTargets.length}
      </div>

      {currentTarget && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2">
            {currentTarget.label}の結果を選択
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => handleSelectResult("safe")}
              className={`py-3 rounded-lg font-bold text-sm ${
                runnerResults[currentTarget.id] === "safe"
                  ? "bg-green-600"
                  : "bg-gray-700"
              }`}
            >
              セーフ
            </button>
            <button
              onClick={() => handleSelectResult("out")}
              className={`py-3 rounded-lg font-bold text-sm ${
                runnerResults[currentTarget.id] === "out"
                  ? "bg-red-600"
                  : "bg-gray-700"
              }`}
            >
              アウト
            </button>
            <button
              onClick={() => handleSelectResult("tagOut")}
              className={`py-3 rounded-lg font-bold text-sm ${
                runnerResults[currentTarget.id] === "tagOut"
                  ? "bg-orange-600"
                  : "bg-gray-700"
              }`}
            >
              タッチアウト
            </button>
          </div>
        </div>
      )}

      {Object.keys(runnerResults).length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">
            選択済みの結果（タップで戻る）
          </div>
          {allTargets
            .filter((target) => {
              const r = runnerResults[target.id];
              return r === "safe" || r === "out" || r === "tagOut";
            })
            .map((target) => {
              const result = runnerResults[target.id];
              const resultLabel =
                result === "safe"
                  ? "セーフ"
                  : result === "out"
                  ? "アウト"
                  : "タッチアウト";
              const targetIndex = allTargets.findIndex(
                (t) => t.id === target.id
              );
              return (
                <div
                  key={target.id}
                  className="text-xs mb-1 cursor-pointer hover:bg-gray-700 p-1 rounded"
                  onClick={() => {
                    if (targetIndex >= 0) {
                      setSelectedRunnerIndex(targetIndex);
                    }
                  }}
                >
                  {target.label}: {resultLabel}
                </div>
              );
            })}
        </div>
      )}

      {allResultsSelected && (
        <div className="mb-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-green-600 rounded-lg font-bold text-sm"
          >
            確定
          </button>
        </div>
      )}

      <NavigationButtons
        onNavigateToDefense={onNavigateToDefense}
        onNavigateToCutPlay={onNavigateToCutPlay}
        onNavigateToRundown={onNavigateToRundown}
        onNavigateToRunner={onNavigateToRunner}
        onNavigateToResult={onNavigateToResult}
      />

      {onFinishPlay && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onFinishPlay}
            className="flex-1 py-2 bg-green-600 rounded-lg font-bold text-xs"
          >
            プレー終了
          </button>
        </div>
      )}
    </div>
  );
};
