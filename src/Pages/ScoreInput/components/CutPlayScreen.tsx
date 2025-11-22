import React, { useState } from "react";
import type { Position } from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

interface CutPlayScreenProps {
  onComplete: (positions: Position[]) => void;
  onNavigateToResult: () => void; // 受け取りは残しておくが、この画面では使わない
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
  onNavigateToResult, // ここも受け取るだけ（下では使わない）
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onBack,
  canGoBack,
}) => {
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);

  // ★ クリックするたびに末尾に追加（同じポジションを何回でも選べる）
  const handleSelectPosition = (pos: Position) => {
    setSelectedPositions((prev) => [...prev, pos]);
  };

  // ★ 最後の1つだけ取り消す
  const handleRemoveLast = () => {
    setSelectedPositions((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (selectedPositions.length === 0) return;

    // ★ 守備のカット経路だけ親に渡す（結果は RunnerScreen 側で入力）
    onComplete(selectedPositions);

    // ★ 確定後は「走者」画面へ戻す
    if (onNavigateToRunner) {
      onNavigateToRunner();
    }
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
          {POSITIONS.map((pos) => {
            const isSelected = selectedPositions.includes(pos);
            return (
              <button
                key={pos}
                onClick={() => handleSelectPosition(pos)}
                className={`py-2 rounded font-bold text-xs ${
                  isSelected ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>

      {/* ★ 選択された順番の表示 */}
      {selectedPositions.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">選択された順番</div>
          <div className="flex flex-wrap gap-1">
            {selectedPositions.map((pos, idx) => (
              <div key={`${pos}-${idx}`} className="flex items-center">
                {/* 2個目以降は → をつける */}
                {idx > 0 && <span className="mx-1 text-blue-300">→</span>}

                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-600">
                  {pos}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRemoveLast}
            className="mt-2 text-xs text-red-400 underline"
          >
            最後を削除
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleConfirm}
          className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-sm disabled:opacity-60"
          disabled={selectedPositions.length === 0}
        >
          確定
        </button>
        {/* 
        ★ ここから結果へは飛ばさない
        <button
          onClick={onNavigateToResult}
          className="flex-1 py-3 bg-gray-700 rounded-lg font-bold text-sm"
        >
          結果へ
        </button> 
        */}
      </div>

      {/* ★ NavigationButtons からも onNavigateToResult を渡さない */}
      <NavigationButtons
        onNavigateToCutPlay={onNavigateToCutPlay}
        onNavigateToRundown={onNavigateToRundown}
        onNavigateToRunner={onNavigateToRunner}
        // onNavigateToResult={onNavigateToResult}  // ← 渡さない
      />
    </div>
  );
};
