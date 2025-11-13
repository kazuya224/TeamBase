import React, { useState } from "react";
import type {
  HitType,
  HitDirection,
  Position,
  BattingResult,
  DefensiveStep,
} from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

interface BattedBallInputProps {
  selectedHitType: HitType | "";
  selectedHitDirection: HitDirection | "";
  selectedPosition: Position | "";
  onSetHitType: (type: HitType) => void;
  onSetHitDirection: (dir: HitDirection) => void;
  onSetPosition: (pos: Position) => void;
  onNext: () => void;
  onNavigateToCutPlay: () => void;
  onNavigateToRundown: () => void;
  onNavigateToRunner: () => void;
  onNavigateToResult: () => void;
  onBattingResultSelect?: (result: BattingResult) => void;
  onFinishPlay?: () => void;
}

const POSITION_LABELS: Record<Position, string> = {
  P: "投手",
  C: "捕手",
  "1B": "一塁",
  "2B": "二塁",
  "3B": "三塁",
  SS: "遊撃",
  LF: "左翼",
  CF: "中堅",
  RF: "右翼",
};

const HIT_TYPES = [
  { value: "grounder", label: "ゴロ" },
  { value: "liner", label: "ライナー" },
  { value: "fly", label: "フライ" },
  { value: "popup", label: "ポップ" },
] as const;

const HIT_DIRECTIONS = [
  { value: "left", label: "レフト" },
  { value: "leftCenter", label: "左中間" },
  { value: "center", label: "センター" },
  { value: "rightCenter", label: "右中間" },
  { value: "right", label: "ライト" },
] as const;

const BATTING_RESULTS = [
  { value: "single", label: "単打", color: "bg-green-600" },
  { value: "double", label: "二塁打", color: "bg-blue-600" },
  { value: "triple", label: "三塁打", color: "bg-purple-600" },
  { value: "homerun", label: "本塁打", color: "bg-red-600" },
  { value: "strikeout", label: "凡打", color: "bg-gray-600" },
  { value: "doublePlay", label: "併殺", color: "bg-gray-700" },
  { value: "sacrificeBunt", label: "犠打", color: "bg-teal-600" },
  { value: "sacrificeFly", label: "犠飛", color: "bg-cyan-600" },
  { value: "error", label: "失策", color: "bg-pink-600" },
  { value: "fieldersChoice", label: "野選", color: "bg-indigo-600" },
] as const;

export const BattedBallInput: React.FC<BattedBallInputProps> = ({
  selectedHitType,
  selectedHitDirection,
  selectedPosition,
  onSetHitType,
  onSetHitDirection,
  onSetPosition,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
  onBattingResultSelect,
}) => {
  const [selectedBattingResult, setSelectedBattingResult] = useState<
    BattingResult | ""
  >("");
  const [defensiveSequence, setDefensiveSequence] = useState<DefensiveStep[]>(
    []
  );
  const [nextStepIndex, setNextStepIndex] = useState(0);

  const handlePositionSelect = (pos: Position) => {
    const currentIndex = nextStepIndex;
    setDefensiveSequence((prev) => {
      const newSequence = [...prev];
      const positionStep: DefensiveStep = {
        position: pos,
        stepIndex: currentIndex,
      };
      newSequence.push(positionStep);
      if (newSequence.length === 1) {
        onSetPosition(pos);
      }
      return newSequence;
    });
    setNextStepIndex((prev) => prev + 1);
  };

  const handleErrorSelect = (errorType: "catch" | "throw" | "FC") => {
    setDefensiveSequence((prev) => {
      if (prev.length === 0) return prev;
      const sortedSequence = [...prev].sort(
        (a, b) => a.stepIndex - b.stepIndex
      );
      let lastPositionIndex = -1;
      for (let i = sortedSequence.length - 1; i >= 0; i--) {
        if (sortedSequence[i].position) {
          lastPositionIndex = i;
          break;
        }
      }
      if (lastPositionIndex === -1) return prev;
      const newSequence = [...prev];
      const targetStep = newSequence.find(
        (step) => step.stepIndex === sortedSequence[lastPositionIndex].stepIndex
      );
      if (targetStep) {
        targetStep.errorType = errorType;
      }
      return newSequence;
    });
  };

  const handleRemoveLast = () => {
    setDefensiveSequence((prev) => {
      if (prev.length === 0) return prev;
      const sortedSequence = [...prev].sort(
        (a, b) => a.stepIndex - b.stepIndex
      );
      const lastStep = sortedSequence[sortedSequence.length - 1];
      if (lastStep.errorType && lastStep.position) {
        const newSequence = prev.map((step) => {
          if (step.stepIndex === lastStep.stepIndex) {
            const { errorType, ...rest } = step;
            return rest;
          }
          return step;
        });
        return newSequence;
      }
      setNextStepIndex((prev) => prev - 1);
      return prev.filter((step) => step.stepIndex !== lastStep.stepIndex);
    });
  };

  const getStepLabel = (step: DefensiveStep): string => {
    if (step.position) {
      return POSITION_LABELS[step.position];
    }
    if (step.errorType === "catch") return "捕球E";
    if (step.errorType === "throw") return "送球E";
    if (step.errorType === "FC") return "FC";
    return "";
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">打球の種類を選択</h3>
      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">種類</div>
        <div className="grid grid-cols-4 gap-2">
          {HIT_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => onSetHitType(type.value as HitType)}
              className={`py-2 rounded font-semibold text-xs ${
                selectedHitType === type.value ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {selectedHitType && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">打球方向</div>
          <div className="grid grid-cols-5 gap-2">
            {HIT_DIRECTIONS.map((dir) => (
              <button
                key={dir.value}
                onClick={() => onSetHitDirection(dir.value as HitDirection)}
                className={`py-2 rounded font-semibold text-xs ${
                  selectedHitDirection === dir.value
                    ? "bg-blue-600"
                    : "bg-gray-700"
                }`}
              >
                {dir.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedHitType && (
        <>
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">
              守備の処理順にポジションを選択
            </div>
            <div className="grid grid-cols-9 gap-1 mb-2">
              {Object.entries(POSITION_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => handlePositionSelect(value as Position)}
                  className="py-2 rounded font-bold text-xs bg-gray-700"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">エラー/FCを選択</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => handleErrorSelect("catch")}
                className="py-2 rounded font-bold text-xs bg-red-600"
              >
                捕球E
              </button>
              <button
                onClick={() => handleErrorSelect("throw")}
                className="py-2 rounded font-bold text-xs bg-red-700"
              >
                送球E
              </button>
              <button
                onClick={() => handleErrorSelect("FC")}
                className="py-2 rounded font-bold text-xs bg-orange-600"
              >
                FC
              </button>
            </div>
          </div>

          {defensiveSequence.length > 0 && (
            <div className="mb-3 p-2 bg-gray-800 rounded">
              <div className="text-xs text-gray-400 mb-1">選択された順番</div>
              <div className="flex flex-wrap items-center gap-1">
                {[...defensiveSequence]
                  .sort((a, b) => a.stepIndex - b.stepIndex)
                  .map((step, idx, array) => {
                    const hasError = step.errorType && step.position;
                    const nextStep = array[idx + 1];
                    const showArrow =
                      idx < array.length - 1 &&
                      (!hasError || nextStep?.position);

                    return (
                      <React.Fragment key={idx}>
                        {step.position && (
                          <>
                            <span className="px-2 py-1 rounded text-xs font-bold bg-purple-600">
                              {getStepLabel(step)}
                            </span>
                            {hasError && (
                              <>
                                <span className="text-white text-xs font-bold">
                                  →
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-bold ${
                                    step.errorType === "FC"
                                      ? "bg-orange-600"
                                      : "bg-red-600"
                                  }`}
                                >
                                  {step.errorType === "catch"
                                    ? "捕球E"
                                    : step.errorType === "throw"
                                    ? "送球E"
                                    : "FC"}
                                </span>
                              </>
                            )}
                            {showArrow && (
                              <span className="text-white text-xs font-bold">
                                →
                              </span>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
              </div>
              <button
                onClick={handleRemoveLast}
                className="mt-2 text-xs text-red-400 underline"
              >
                最後を削除
              </button>
            </div>
          )}

          {defensiveSequence.length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">打撃結果を選択</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {BATTING_RESULTS.map((result) => (
                  <button
                    key={result.value}
                    onClick={() => {
                      setSelectedBattingResult(result.value as BattingResult);
                      if (onBattingResultSelect)
                        onBattingResultSelect(result.value as BattingResult);
                    }}
                    className={`py-2 rounded-lg font-bold text-xs ${
                      selectedBattingResult === result.value
                        ? result.color
                        : "bg-gray-700"
                    }`}
                  >
                    {result.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {defensiveSequence.length > 0 && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={onNavigateToCutPlay}
                  className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
                >
                  カット
                </button>
                <button
                  onClick={onNavigateToRundown}
                  className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                >
                  挟殺
                </button>
                <button
                  onClick={onNavigateToRunner}
                  className="py-2 bg-green-600 rounded-lg font-bold text-xs"
                >
                  走者
                </button>
                <button
                  onClick={onNavigateToResult}
                  className="py-2 bg-red-600 rounded-lg font-bold text-xs"
                >
                  結果
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

