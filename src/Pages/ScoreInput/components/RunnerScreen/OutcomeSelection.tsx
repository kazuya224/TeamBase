import React from "react";
import type { Base, RunnerAdvanceReason } from "../../../../types/baseball";

interface OutcomeSelectionProps {
  selectedRunner: string | "BR" | "";
  selectedToBase: Base | null;
  baseSegments: number[];
  segmentReasons: Record<number, RunnerAdvanceReason>;
  selectedOutcome: "safe" | "out" | "tagOut" | "appeal" | null;
  onOutcomeSelect: (outcome: "safe" | "out" | "tagOut" | "appeal") => void;
  onAddAdvance: () => void;
}

export const OutcomeSelection: React.FC<OutcomeSelectionProps> = ({
  selectedRunner,
  selectedToBase,
  baseSegments,
  segmentReasons,
  selectedOutcome,
  onOutcomeSelect,
  onAddAdvance,
}) => {
  if (!selectedRunner) return null;

  const allReasonsSelected =
    selectedOutcome === "appeal" ||
    (selectedToBase !== null &&
      baseSegments.length > 0 &&
      baseSegments.every((segment) => segmentReasons[segment] !== undefined));

  const showReasonWarning =
    selectedOutcome &&
    selectedOutcome !== "appeal" &&
    selectedToBase !== null &&
    baseSegments.length > 0 &&
    !baseSegments.every((segment) => segmentReasons[segment] !== undefined);

  const showAddButton =
    selectedOutcome === "appeal" ||
    (selectedOutcome !== null &&
      selectedToBase !== null &&
      baseSegments.length > 0 &&
      allReasonsSelected);

  return (
    <div className="mb-3">
      <div className="text-xs text-gray-400 mb-1">結果を選択</div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        <button
          onClick={() => onOutcomeSelect("safe")}
          className={`py-2 rounded-lg font-bold text-xs ${
            selectedOutcome === "safe" ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          セーフ
        </button>
        <button
          onClick={() => onOutcomeSelect("out")}
          className={`py-2 rounded-lg font-bold text-xs ${
            selectedOutcome === "out" ? "bg-red-600" : "bg-gray-700"
          }`}
        >
          アウト
        </button>
        <button
          onClick={() => onOutcomeSelect("tagOut")}
          className={`py-2 rounded-lg font-bold text-xs ${
            selectedOutcome === "tagOut" ? "bg-orange-600" : "bg-gray-700"
          }`}
        >
          タッチアウト
        </button>
        <button
          onClick={() => onOutcomeSelect("appeal")}
          className={`py-2 rounded-lg font-bold text-xs ${
            selectedOutcome === "appeal" ? "bg-orange-600" : "bg-gray-700"
          }`}
        >
          アピール
        </button>
      </div>
      {/* アピール以外の場合、進塁理由の入力が必要 */}
      {showReasonWarning && (
        <div className="text-xs text-gray-500 mb-2">
          各塁間の進塁理由を選択してください
        </div>
      )}
      {/* アピールの場合は進塁先選択不要で即座に「進塁を追加」ボタンを表示 */}
      {/* アピール以外で、進塁先が選択され、進塁理由がすべて選択されている場合、「進塁を追加」ボタンを表示 */}
      {showAddButton && (
        <button
          onClick={onAddAdvance}
          className="w-full py-2 bg-green-600 rounded-lg font-bold text-xs"
        >
          進塁を追加
        </button>
      )}
    </div>
  );
};
