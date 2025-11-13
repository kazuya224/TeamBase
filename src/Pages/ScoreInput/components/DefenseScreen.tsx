import React, { useState } from "react";
import type { Position, HitType, DefensiveStep, ErrorInfo } from "../../../types/baseball";
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

const POSITIONS: Position[] = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];

export const DefenseScreen: React.FC<DefenseScreenProps> = ({
  onNext,
  onComplete,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
}) => {
  const [defensiveSequence, setDefensiveSequence] = useState<DefensiveStep[]>([]);
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
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
      return newSequence;
    });
    setNextStepIndex((prev) => prev + 1);
  };

  const handleErrorSelect = (errorType: "catch" | "throw" | "FC", pos: Position) => {
    const currentIndex = nextStepIndex;
    setDefensiveSequence((prev) => {
      const newSequence = [...prev];
      const errorStep: DefensiveStep = {
        position: pos,
        errorType: errorType,
        stepIndex: currentIndex,
      };
      newSequence.push(errorStep);
      if (errorType === "catch" || errorType === "throw") {
        setErrors((prevErrors) => [
          ...prevErrors,
          { position: pos, type: errorType },
        ]);
      }
      return newSequence;
    });
    setNextStepIndex((prev) => prev + 1);
  };

  const handleRemoveLast = () => {
    if (defensiveSequence.length === 0) return;
    
    const last = defensiveSequence[defensiveSequence.length - 1];
    const shouldRemoveError =
      last.errorType && (last.errorType === "catch" || last.errorType === "throw");
    
    // 副作用を分離: setDefensiveSequenceの外でsetErrorsとsetNextStepIndexを呼ぶ
    if (shouldRemoveError) {
      setErrors((prevErrors) => {
        if (prevErrors.length > 0) {
          return prevErrors.slice(0, -1);
        }
        return prevErrors;
      });
    }
    setNextStepIndex((prev) => prev - 1);
    setDefensiveSequence((prev) => prev.slice(0, -1));
  };

  const handleComplete = () => {
    if (defensiveSequence.length > 0) {
      onComplete(defensiveSequence, errors);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">守備位置を選択</h3>

      {defensiveSequence.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">守備シーケンス</div>
          <div className="flex flex-wrap gap-1">
            {defensiveSequence.map((step, idx) => (
              <span
                key={idx}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  step.errorType === "catch"
                    ? "bg-red-600"
                    : step.errorType === "throw"
                    ? "bg-orange-600"
                    : step.errorType === "FC"
                    ? "bg-yellow-600"
                    : "bg-purple-600"
                }`}
              >
                {step.errorType === "catch"
                  ? `捕球E${step.position}`
                  : step.errorType === "throw"
                  ? `送球E${step.position}`
                  : step.errorType === "FC"
                  ? `FC${step.position}`
                  : step.position}
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
          <div>
            <div className="text-[10px] text-gray-500 mb-1 text-center">捕球E</div>
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((pos) => (
                <button
                  key={`catch-${pos}`}
                  onClick={() => handleErrorSelect("catch", pos)}
                  className="py-1.5 bg-red-600 rounded text-[10px] font-bold hover:bg-red-700"
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1 text-center">送球E</div>
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((pos) => (
                <button
                  key={`throw-${pos}`}
                  onClick={() => handleErrorSelect("throw", pos)}
                  className="py-1.5 bg-orange-600 rounded text-[10px] font-bold hover:bg-orange-700"
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-1 text-center">FC</div>
            <div className="grid grid-cols-3 gap-1">
              {POSITIONS.map((pos) => (
                <button
                  key={`fc-${pos}`}
                  onClick={() => handleErrorSelect("FC", pos)}
                  className="py-1.5 bg-yellow-600 rounded text-[10px] font-bold hover:bg-yellow-700"
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {defensiveSequence.length > 0 && (
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
          className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-sm"
          disabled={defensiveSequence.length === 0}
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

