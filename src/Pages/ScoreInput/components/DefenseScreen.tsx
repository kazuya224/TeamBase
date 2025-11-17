import React, { useState } from "react";
import type {
  Position,
  HitType,
  DefensiveStep,
  ErrorInfo,
} from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

interface DefenseScreenProps {
  onNext: () => void;
  onComplete: (defensiveSequence: DefensiveStep[], errors: ErrorInfo[]) => void;
  onNavigateToCutPlay: () => void;
  onNavigateToRundown: () => void;
  onNavigateToRunner: () => void;
  onNavigateToResult: () => void;
  hitType?: HitType;
}

const POSITIONS: Position[] = [
  "P",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "LF",
  "CF",
  "RF",
];

type ErrorType = "catch" | "throw" | "FC";

const getStepColorClass = (step: DefensiveStep) => {
  if (step.errorType === "catch") return "bg-red-600";
  if (step.errorType === "throw") return "bg-orange-600";
  if (step.errorType === "FC") return "bg-yellow-600";
  return "bg-purple-600";
};

const getStepLabel = (step: DefensiveStep) => {
  if (step.errorType === "catch") return `捕球E${step.position}`;
  if (step.errorType === "throw") return `送球E${step.position}`;
  if (step.errorType === "FC") return `FC${step.position}`;
  return step.position;
};

interface ErrorButtonGroupProps {
  label: string;
  errorType: ErrorType;
  buttonClassName: string;
  hoverClassName: string;
  onClick: (errorType: ErrorType, pos: Position) => void;
}

const ErrorButtonGroup: React.FC<ErrorButtonGroupProps> = ({
  label,
  errorType,
  buttonClassName,
  hoverClassName,
  onClick,
}) => (
  <div>
    <div className="text-[10px] text-gray-500 mb-1 text-center">{label}</div>
    <div className="grid grid-cols-3 gap-1">
      {POSITIONS.map((pos) => (
        <button
          key={`${errorType}-${pos}`}
          onClick={() => onClick(errorType, pos)}
          className={`py-1.5 rounded text-[10px] font-bold ${buttonClassName} ${hoverClassName}`}
        >
          {pos}
        </button>
      ))}
    </div>
  </div>
);

export const DefenseScreen: React.FC<DefenseScreenProps> = ({
  onNext,
  onComplete,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
}) => {
  const [defensiveSequence, setDefensiveSequence] = useState<DefensiveStep[]>(
    []
  );
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [nextStepIndex, setNextStepIndex] = useState(0);

  const hasSequence = defensiveSequence.length > 0;

  const handlePositionSelect = (pos: Position) => {
    const currentIndex = nextStepIndex;

    setDefensiveSequence((prev) => [
      ...prev,
      {
        position: pos,
        stepIndex: currentIndex,
      },
    ]);

    setNextStepIndex((prev) => prev + 1);
  };

  const handleErrorSelect = (errorType: ErrorType, pos: Position) => {
    const currentIndex = nextStepIndex;

    setDefensiveSequence((prev) => [
      ...prev,
      {
        position: pos,
        errorType,
        stepIndex: currentIndex,
      },
    ]);

    // FC は ErrorInfo には入れない仕様はそのまま維持
    if (errorType === "catch" || errorType === "throw") {
      setErrors((prevErrors) => [
        ...prevErrors,
        { position: pos, type: errorType },
      ]);
    }

    setNextStepIndex((prev) => prev + 1);
  };

  const handleRemoveLast = () => {
    if (!hasSequence) return;

    setDefensiveSequence((prev) => {
      const last = prev[prev.length - 1];

      // catch / throw のときだけ errors からも 1 件削除
      if (last.errorType === "catch" || last.errorType === "throw") {
        setErrors((prevErrors) =>
          prevErrors.length > 0 ? prevErrors.slice(0, -1) : prevErrors
        );
      }

      setNextStepIndex((prevIndex) => prevIndex - 1);
      return prev.slice(0, -1);
    });
  };

  const handleComplete = () => {
    if (!hasSequence) return;
    onComplete(defensiveSequence, errors);
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">守備位置を選択</h3>

      {hasSequence && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">守備シーケンス</div>
          <div className="flex flex-wrap gap-1">
            {defensiveSequence.map((step, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-xs font-bold ${getStepColorClass(
                  step
                )}`}
              >
                {getStepLabel(step)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">守備位置を選択</div>
        <div className="grid grid-cols-9 gap-1 mb-2">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionSelect(pos)}
              className="py-2 rounded font-bold text-xs bg-gray-700 hover:bg-gray-600"
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">
          エラー/FCを追加（守備位置を選択してください）
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <ErrorButtonGroup
            label="捕球E"
            errorType="catch"
            buttonClassName="bg-red-600"
            hoverClassName="hover:bg-red-700"
            onClick={handleErrorSelect}
          />
          <ErrorButtonGroup
            label="送球E"
            errorType="throw"
            buttonClassName="bg-orange-600"
            hoverClassName="hover:bg-orange-700"
            onClick={handleErrorSelect}
          />
          <ErrorButtonGroup
            label="FC"
            errorType="FC"
            buttonClassName="bg-yellow-600"
            hoverClassName="hover:bg-yellow-700"
            onClick={handleErrorSelect}
          />
        </div>
      </div>

      {hasSequence && (
        <button
          onClick={handleRemoveLast}
          className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs mb-3"
        >
          最後を削除
        </button>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={onNext}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          次へ（走者画面）
        </button>
        <button
          onClick={handleComplete}
          className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-sm disabled:opacity-60"
          disabled={!hasSequence}
        >
          確定
        </button>
      </div>

      <NavigationButtons
        onNavigateToCutPlay={onNavigateToCutPlay}
        onNavigateToRundown={onNavigateToRundown}
        onNavigateToRunner={onNavigateToRunner}
        onNavigateToResult={onNavigateToResult}
      />
    </div>
  );
};
