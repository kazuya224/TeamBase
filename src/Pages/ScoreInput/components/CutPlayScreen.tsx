import React, { useState } from "react";
import type { Position } from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

interface CutPlayScreenProps {
  onComplete: (positions: Position[]) => void;
  onNavigateToResult: () => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
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

export const CutPlayScreen: React.FC<CutPlayScreenProps> = ({
  onComplete,
  onNavigateToResult,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onBack,
  canGoBack,
}) => {
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);

  const handlePositionSelect = (pos: Position) => {
    setSelectedPositions((prev) => {
      if (prev.includes(pos)) {
        return prev.filter((p) => p !== pos);
      }
      return [...prev, pos];
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">カットプレー</h3>
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
        <div className="text-xs text-gray-400 mb-1">ポジション番号を選択</div>
        <div className="grid grid-cols-9 gap-1 mb-4">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => handlePositionSelect(pos)}
              className={`py-2 rounded font-bold text-xs ${
                selectedPositions.includes(pos) ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => onComplete(selectedPositions)}
          className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-sm"
          disabled={selectedPositions.length === 0}
        >
          確定
        </button>
        {/* <button
          onClick={onNavigateToResult}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          結果へ
        </button> */}
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
