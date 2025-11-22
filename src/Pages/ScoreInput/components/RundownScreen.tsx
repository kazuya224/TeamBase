import React, { useState, useMemo } from "react";
import type { Position, RunnerInfo } from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";

interface RundownScreenProps {
  runners: RunnerInfo[];
  onComplete: (positions: Position[], runnerId?: string) => void;
  onNavigateToResult: () => void; // ★ 受け取りはそのまま
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

type RunnerId = RunnerInfo["runnerId"];
type BasePath = "1-2" | "2-3" | "3-H";

export const RundownScreen: React.FC<RundownScreenProps> = ({
  runners,
  onComplete,
  onNavigateToResult, // ★ ここも残す（ただし下では使わない）
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onBack,
  canGoBack,
}) => {
  const [defensiveSequence, setDefensiveSequence] = useState<Position[]>([]);
  const [selectedRunner, setSelectedRunner] = useState<RunnerId | "">("");
  const [selectedBasePath, setSelectedBasePath] = useState<BasePath | "">("");

  const basePaths: BasePath[] = useMemo(() => ["1-2", "2-3", "3-H"], []);

  const handlePositionSelect = (pos: Position) => {
    setDefensiveSequence((prev) => [...prev, pos]);
  };

  const handleRemoveLast = () => {
    setDefensiveSequence((prev) => prev.slice(0, -1));
  };

  const hasRunners = runners.length > 0;

  // ★ 必須条件は現状どおり：守備シーケンス ＋ 走者
  const canConfirm = defensiveSequence.length > 0 && !!selectedRunner;
  // 「塁間も必須にしたい」なら ↑ に && !!selectedBasePath を足す

  const handleConfirm = () => {
    if (!canConfirm) return;

    // ★ 守備シーケンスだけ親に渡す（結果は RunnerScreen 側で入力）
    onComplete(defensiveSequence, selectedRunner);

    // ★ 確定後は「走者」画面へ戻す（＝結果入力は必ず RunnerScreen で）
    if (onNavigateToRunner) {
      onNavigateToRunner();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">挟殺</h3>
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

      {hasRunners && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">走者を選択</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {runners.map((runner) => (
              <button
                key={runner.runnerId}
                type="button"
                onClick={() => setSelectedRunner(runner.runnerId)}
                className={`py-2 rounded font-bold text-xs ${
                  selectedRunner === runner.runnerId
                    ? "bg-orange-600"
                    : "bg-gray-700"
                }`}
              >
                {runner.base}塁: {runner.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRunner && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">塁間を選択</div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {basePaths.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => setSelectedBasePath(path)}
                className={`py-2 rounded font-bold text-xs ${
                  selectedBasePath === path ? "bg-orange-600" : "bg-gray-700"
                }`}
              >
                {path}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="text-xs text-gray-400 mb-1">
          守備の処理順にポジションを選択
        </div>
        <div className="grid grid-cols-9 gap-1 mb-2">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => handlePositionSelect(pos)}
              className={`py-2 rounded font-bold text-xs ${
                defensiveSequence.includes(pos)
                  ? "bg-orange-600"
                  : "bg-gray-700"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {defensiveSequence.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">選択された順番</div>
          <div className="flex flex-wrap gap-1">
            {defensiveSequence.map((pos, idx) => (
              <div key={`${pos}-${idx}`} className="flex items-center">
                {/* 2個目以降に矢印 → を表示 */}
                {idx > 0 && <span className="mx-1 text-orange-300">→</span>}
                <span className="px-2 py-1 rounded text-xs font-bold bg-orange-600">
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
        {/* <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-3 bg-orange-600 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canConfirm}
        >
          確定（走者画面へ）
        </button> */}
      </div>

      {/* ★ NavigationButtons からは「結果へ」ボタンを出さない */}
      <NavigationButtons
        onNavigateToCutPlay={onNavigateToCutPlay}
        onNavigateToRundown={onNavigateToRundown}
        onNavigateToRunner={onNavigateToRunner}
        // onNavigateToResult={onNavigateToResult}  // ← 渡さない
      />
    </div>
  );
};
