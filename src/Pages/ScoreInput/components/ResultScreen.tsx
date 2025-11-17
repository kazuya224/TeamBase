import React, { useState, useMemo } from "react";
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

type SimpleResult = "safe" | "out" | "tagOut";

interface ResultScreenProps {
  runners: RunnerInfo[];
  currentBatterName?: string;
  onConfirm: (
    resultType: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay"
  ) => void;
  onFinishPlay?: () => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onNavigateToResult?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

interface TargetInfo {
  id: string;
  name: string;
  label: string;
}

const getResultLabel = (result: SimpleResult): string => {
  switch (result) {
    case "safe":
      return "セーフ";
    case "out":
      return "アウト";
    case "tagOut":
      return "タッチアウト";
  }
};

export const ResultScreen: React.FC<ResultScreenProps> = ({
  runners,
  currentBatterName,
  onConfirm,
  onFinishPlay,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
  onBack,
  canGoBack,
}) => {
  const [selectedRunnerIndex, setSelectedRunnerIndex] = useState<number>(0);
  const [runnerResults, setRunnerResults] = useState<
    Record<string, SimpleResult | null>
  >({});

  const allTargets: TargetInfo[] = useMemo(() => {
    const targets: TargetInfo[] = [];

    if (currentBatterName) {
      targets.push({
        id: "BR",
        name: currentBatterName,
        label: `打者: ${currentBatterName}`,
      });
    }

    runners.forEach((runner) => {
      targets.push({
        id: runner.runnerId,
        name: runner.name,
        label: `${runner.base}塁走者: ${runner.name}`,
      });
    });

    return targets;
  }, [currentBatterName, runners]);

  const currentTarget = allTargets[selectedRunnerIndex];

  const handleSelectResult = (result: SimpleResult) => {
    if (!currentTarget) return;

    setRunnerResults((prev) => ({
      ...prev,
      [currentTarget.id]: result,
    }));

    setSelectedRunnerIndex((prevIndex) =>
      prevIndex < allTargets.length - 1 ? prevIndex + 1 : prevIndex
    );
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
      return;
    }

    if (outCount === 1) {
      const outResult = Object.values(runnerResults).find(
        (r) => r === "out" || r === "tagOut"
      );
      onConfirm(outResult === "tagOut" ? "tagOut" : "out");
      return;
    }

    if (outCount === 2) {
      onConfirm("doublePlay");
    } else {
      onConfirm("triplePlay");
    }
  };

  // 走者・打者が一人もいないケース（単純な safe / out / tagOut 選択）
  if (allTargets.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-300">結果を選択</h3>
          {canGoBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1 bg-gray-700 rounded-lg font-bold text-xs hover:bg-gray-600"
            >
              ← 戻る
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            type="button"
            onClick={() => onConfirm("safe")}
            className="py-3 bg-green-600 rounded-lg font-bold text-sm"
          >
            セーフ
          </button>
          <button
            type="button"
            onClick={() => onConfirm("out")}
            className="py-3 bg-red-600 rounded-lg font-bold text-sm"
          >
            アウト
          </button>
          <button
            type="button"
            onClick={() => onConfirm("tagOut")}
            className="py-3 bg-orange-600 rounded-lg font-bold text-sm"
          >
            タッチアウト
          </button>
        </div>

        {onFinishPlay && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">結果を選択</h3>
        {canGoBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 rounded-lg font-bold text-xs hover:bg-gray-600"
          >
            ← 戻る
          </button>
        )}
      </div>

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
              type="button"
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
              type="button"
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
              type="button"
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
              const result = runnerResults[target.id] as SimpleResult;
              const targetIndex = allTargets.findIndex(
                (t) => t.id === target.id
              );

              return (
                <button
                  key={target.id}
                  type="button"
                  className="w-full text-left text-xs mb-1 cursor-pointer hover:bg-gray-700 p-1 rounded"
                  onClick={() => {
                    if (targetIndex >= 0) {
                      setSelectedRunnerIndex(targetIndex);
                    }
                  }}
                >
                  {target.label}: {getResultLabel(result)}
                </button>
              );
            })}
        </div>
      )}

      {allResultsSelected && (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 bg-green-600 rounded-lg font-bold text-sm"
          >
            確定
          </button>
        </div>
      )}

      <NavigationButtons
        onNavigateToCutPlay={onNavigateToCutPlay}
        onNavigateToRundown={onNavigateToRundown}
        onNavigateToRunner={onNavigateToRunner}
        onNavigateToResult={onNavigateToResult}
      />

      {onFinishPlay && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
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
