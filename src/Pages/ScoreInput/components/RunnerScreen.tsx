import React, { useState, useEffect } from "react";
import type {
  RunnerInfo,
  Base,
  RunnerAdvance,
  RunnerAdvanceReason,
} from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

interface RunnerScreenProps {
  runners: RunnerInfo[];
  currentBatterName?: string;
  onComplete: (advances: RunnerAdvance[]) => void;
  onNavigateToResult: () => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  showNavigationButtons?: boolean;
  onNavigateToCutPlayFromButtons?: () => void;
  onNavigateToRundownFromButtons?: () => void;
  onNavigateToRunnerFromButtons?: () => void;
  onNavigateToResultFromButtons?: () => void;
}

const ADVANCE_REASONS: { value: RunnerAdvanceReason; label: string }[] = [
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
  // 妨害系: 具体的な種別を使用（汎用的な"Interference"は非推奨）
  { value: "FielderInterference", label: "守備妨害" },
  { value: "BatterInterference", label: "打撃妨害" },
  { value: "RunnerInterference", label: "走塁妨害" },
  { value: "TagUp", label: "タッグアップ" },
  { value: "Overtake", label: "追い越し" },
  { value: "AbandonBase", label: "離塁放棄" },
  { value: "Other", label: "その他" },
];

export const RunnerScreen: React.FC<RunnerScreenProps> = ({
  runners,
  currentBatterName,
  onComplete,
  onNavigateToResult,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onBack,
  canGoBack,
  showNavigationButtons,
  onNavigateToCutPlayFromButtons,
  onNavigateToRundownFromButtons,
  onNavigateToRunnerFromButtons,
  onNavigateToResultFromButtons,
}) => {
  const [selectedRunner, setSelectedRunner] = useState<string | "BR">("");
  const [selectedToBase, setSelectedToBase] = useState<Base | null>(null);
  const [segmentReasons, setSegmentReasons] = useState<
    Record<number, RunnerAdvanceReason>
  >({});
  const [selectedOutcome, setSelectedOutcome] = useState<
    "safe" | "out" | "tagOut" | null
  >(null);
  const [runnerAdvances, setRunnerAdvances] = useState<RunnerAdvance[]>([]);

  useEffect(() => {
    setSelectedOutcome(null);
    setSegmentReasons({});
  }, [selectedRunner, selectedToBase]);

  const getBaseSegments = (): number[] => {
    if (!selectedRunner || selectedToBase === null) return [];
    const fromBase =
      selectedRunner === "BR" ? 0 : parseInt(selectedRunner.replace("R", ""));
    const segments: number[] = [];
    for (let i = fromBase; i < selectedToBase; i++) {
      segments.push(i);
    }
    return segments;
  };

  const baseSegments = getBaseSegments();

  const handleAddAdvance = () => {
    if (!selectedRunner || selectedToBase === null || !selectedOutcome) return;

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

    const allReasonsSelected = baseSegments.every(
      (segment) => segmentReasons[segment] !== undefined
    );
    if (!allReasonsSelected) return;

    const isOut = selectedOutcome === "out" || selectedOutcome === "tagOut";
    const advances: RunnerAdvance[] = [];
    let currentBase = fromBase;
    for (const segment of baseSegments) {
      const nextBase = (segment + 1) as Base;
      advances.push({
        runnerId: runner.runnerId,
        fromBase: currentBase as Base,
        toBase: nextBase,
        reason: segmentReasons[segment],
        scored: nextBase === 4 && selectedOutcome === "safe",
        out: isOut && nextBase === selectedToBase,
        outcome: nextBase === selectedToBase ? selectedOutcome : undefined,
        runnerName: runner.name,
      });
      currentBase = nextBase;
    }

    setRunnerAdvances((prev) => [...prev, ...advances]);
    setSelectedRunner("");
    setSelectedToBase(null);
    setSegmentReasons({});
    setSelectedOutcome(null);
  };

  const handleRemoveAdvance = (index: number) => {
    setRunnerAdvances((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (runnerAdvances.length > 0) {
      onComplete(runnerAdvances);
    }
  };

  const getBaseLabel = (base: number): string => {
    if (base === 0 || base === 4) return "本塁";
    return `${base}塁`;
  };

  const handleOptionClick = (reason: RunnerAdvanceReason) => {
    if (selectedRunner && selectedToBase !== null) {
      const baseSegments = getBaseSegments();
      const newSegmentReasons: Record<number, RunnerAdvanceReason> = {
        ...segmentReasons,
      };
      baseSegments.forEach((segment) => {
        if (!newSegmentReasons[segment]) {
          newSegmentReasons[segment] = reason;
        }
      });
      setSegmentReasons(newSegmentReasons);
    }
  };

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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">走者進塁</h3>
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 rounded-lg font-bold text-xs hover:bg-gray-600"
          >
            ← 戻る
          </button>
        )}
      </div>

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

      {selectedRunner && selectedToBase !== null && baseSegments.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2">
            各塁間の進塁理由を選択
          </div>
          {baseSegments.map((segment) => (
            <div key={segment} className="mb-2">
              <div className="text-xs text-gray-500 mb-1">
                {getBaseLabel(segment)} → {getBaseLabel(segment + 1)}間
              </div>
              <select
                value={segmentReasons[segment] || ""}
                onChange={(e) =>
                  setSegmentReasons({
                    ...segmentReasons,
                    [segment]: e.target.value as RunnerAdvanceReason,
                  })
                }
                className="w-full py-2 px-3 bg-gray-700 rounded-lg text-white text-sm"
              >
                <option value="">選択してください</option>
                {ADVANCE_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {selectedRunner &&
        selectedToBase !== null &&
        baseSegments.length > 0 &&
        baseSegments.every(
          (segment) => segmentReasons[segment] !== undefined
        ) && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">結果を選択</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => setSelectedOutcome("safe")}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOutcome === "safe" ? "bg-green-600" : "bg-gray-700"
                }`}
              >
                セーフ
              </button>
              <button
                onClick={() => setSelectedOutcome("out")}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOutcome === "out" ? "bg-red-600" : "bg-gray-700"
                }`}
              >
                アウト
              </button>
              <button
                onClick={() => setSelectedOutcome("tagOut")}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOutcome === "tagOut" ? "bg-orange-600" : "bg-gray-700"
                }`}
              >
                タッチアウト
              </button>
            </div>
            {selectedOutcome && (
              <button
                onClick={handleAddAdvance}
                className="w-full py-2 bg-green-600 rounded-lg font-bold text-xs"
              >
                進塁を追加
              </button>
            )}
          </div>
        )}

      {runnerAdvances.length > 0 && (
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
                          `${getBaseLabel(a.fromBase)}→${getBaseLabel(
                            a.toBase
                          )}(${
                            ADVANCE_REASONS.find((r) => r.value === a.reason)
                              ?.label
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
                      handleRemoveAdvance(idx);
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
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleComplete}
          className="flex-1 py-3 bg-green-600 rounded-lg font-bold text-sm"
          disabled={runnerAdvances.length === 0}
        >
          確定
        </button>
        {/* <button
          onClick={() => {
            if (runnerAdvances.length === 0) {
              if (
                window.confirm(
                  "走者の進塁が入力されていません。このまま結果画面に進みますか？"
                )
              ) {
                onNavigateToResult();
              }
            } else {
              onNavigateToResult();
            }
          }}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          結果へ
        </button> */}
      </div>

      <div className="mt-4 border-t border-gray-700 pt-3">
        <h4 className="text-xs text-gray-400 mb-2">オプション</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleOptionClick("FielderInterference")}
            className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            守備妨害
          </button>
          <button
            onClick={() => handleOptionClick("BatterInterference")}
            className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            打撃妨害
          </button>
          <button
            onClick={() => handleOptionClick("RunnerInterference")}
            className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            走塁妨害
          </button>
          <button
            onClick={() => handleOptionClick("TagUp")}
            className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            タッグアップ
          </button>
          <button
            onClick={() => handleOptionClick("Overtake")}
            className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            追い越し
          </button>
          <button
            onClick={() => handleOptionClick("AbandonBase")}
            className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
          >
            離塁放棄
          </button>
        </div>
      </div>

      {!showNavigationButtons && (
        <NavigationButtons
          onNavigateToCutPlay={onNavigateToCutPlay}
          onNavigateToRundown={onNavigateToRundown}
          onNavigateToRunner={onNavigateToRunner}
          onNavigateToResult={onNavigateToResult}
        />
      )}
      {showNavigationButtons && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={onNavigateToCutPlayFromButtons}
              className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
            >
              カット
            </button>
            <button
              onClick={onNavigateToRundownFromButtons}
              className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
            >
              挟殺
            </button>
            <button
              onClick={onNavigateToRunnerFromButtons}
              className="py-2 bg-green-600 rounded-lg font-bold text-xs"
            >
              走者
            </button>
            {/* <button
              onClick={onNavigateToResultFromButtons}
              className="py-2 bg-red-600 rounded-lg font-bold text-xs"
            >
              結果
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
};
