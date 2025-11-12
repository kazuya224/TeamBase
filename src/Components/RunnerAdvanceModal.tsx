import React, { useState, useEffect } from "react";

// 型定義（types.tsから）
type Base = 0 | 1 | 2 | 3;
type AdvancedPlayType = "normal" | "tagUp" | "rundown" | "cutoffPlay" | "relay";
type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF";

interface DefensivePlay {
  positions: Position[];
  playType: AdvancedPlayType;
  description?: string;
}

interface RunnerAdvance {
  fromBase: Base;
  toBase: Base;
  scored: boolean;
  out: boolean;
  runnerName: string;
  playType?: AdvancedPlayType;
  defensivePlay?: DefensivePlay;
  notes?: string;
}

interface RunnerAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advances: RunnerAdvance[]) => void;
  currentRunners: { base: 1 | 2 | 3; name: string }[];
  lineup: string[];
  currentBatterName?: string;
}

const RunnerAdvanceModal: React.FC<RunnerAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentRunners,
  lineup,
  currentBatterName = "",
}) => {
  const [runnerStates, setRunnerStates] = useState<
    Map<number, { toBase: number; scored: boolean; out: boolean }>
  >(new Map());
  const [batterState, setBatterState] = useState<{
    toBase: number;
    scored: boolean;
  }>({ toBase: 1, scored: false });

  // 🆕 各走者のプレータイプを管理
  const [playTypes, setPlayTypes] = useState<Map<number, AdvancedPlayType>>(
    new Map()
  );

  useEffect(() => {
    if (isOpen) {
      const initialStates = new Map<
        number,
        { toBase: number; scored: boolean; out: boolean }
      >();
      currentRunners.forEach((runner) => {
        initialStates.set(runner.base, {
          toBase: runner.base,
          scored: false,
          out: false,
        });
      });
      setRunnerStates(initialStates);
      setBatterState({ toBase: 1, scored: false });
      setPlayTypes(new Map()); // リセット
    }
  }, [isOpen, currentRunners]);

  const handleRunnerMove = (fromBase: number, toBase: number) => {
    setRunnerStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(fromBase) || {
        toBase: fromBase,
        scored: false,
        out: false,
      };
      newStates.set(fromBase, {
        ...current,
        toBase,
        scored: toBase === 4,
        out: false,
      });
      return newStates;
    });
  };

  const handleRunnerOut = (fromBase: number) => {
    setRunnerStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(fromBase) || {
        toBase: fromBase,
        scored: false,
        out: false,
      };
      newStates.set(fromBase, { ...current, out: true, scored: false });
      return newStates;
    });
  };

  const handleBatterMove = (toBase: number) => {
    setBatterState({ toBase, scored: toBase === 4 });
  };

  // 🆕 プレータイプの切り替え
  const togglePlayType = (base: number, type: AdvancedPlayType) => {
    setPlayTypes((prev) => {
      const newTypes = new Map(prev);
      if (newTypes.get(base) === type) {
        newTypes.delete(base); // 同じものをクリックしたらオフ
      } else {
        newTypes.set(base, type);
      }
      return newTypes;
    });
  };

  const handleSave = () => {
    const advances: RunnerAdvance[] = [];

    // 打者の進塁
    advances.push({
      fromBase: 0 as Base,
      toBase: batterState.toBase as Base,
      scored: batterState.scored,
      out: false,
      runnerName: currentBatterName,
    });

    // 既存走者の進塁（🆕 playTypeを含める）
    currentRunners.forEach((runner) => {
      const state = runnerStates.get(runner.base);
      const playType = playTypes.get(runner.base); // 🆕
      if (state) {
        advances.push({
          fromBase: runner.base as Base,
          toBase: state.toBase as Base,
          scored: state.scored,
          out: state.out,
          runnerName: runner.name,
          playType: playType || "normal", // 🆕
        });
      }
    });

    onSave(advances);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-3">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
            <h2 className="text-lg font-bold">走者進塁</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          {/* 野球場ビジュアル */}
          <div className="mb-4 bg-black rounded-lg p-3">
            <svg viewBox="0 0 300 200" className="w-full h-auto">
              <path
                d="M 150 170 L 80 100 L 150 30 L 220 100 Z"
                fill="none"
                stroke="#4b5563"
                strokeWidth="2"
              />
              <path
                d="M 150 170 L 143 166 L 143 158 L 150 154 L 157 158 L 157 166 Z"
                fill="white"
              />
              <rect
                x="214"
                y="94"
                width="12"
                height="12"
                fill={
                  runnerStates.get(1)?.toBase === 1 || batterState.toBase === 1
                    ? "#fbbf24"
                    : "white"
                }
                stroke="#333"
                strokeWidth="1"
              />
              <rect
                x="144"
                y="24"
                width="12"
                height="12"
                fill={
                  runnerStates.get(2)?.toBase === 2 || batterState.toBase === 2
                    ? "#fbbf24"
                    : "white"
                }
                stroke="#333"
                strokeWidth="1"
                transform="rotate(45 150 30)"
              />
              <rect
                x="74"
                y="94"
                width="12"
                height="12"
                fill={
                  runnerStates.get(3)?.toBase === 3 || batterState.toBase === 3
                    ? "#fbbf24"
                    : "white"
                }
                stroke="#333"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* 打者の進塁 */}
          <div className="mb-4 bg-gray-800 rounded-lg p-3">
            <h3 className="text-sm font-bold mb-2 text-blue-400">
              ⚾ 打者: {currentBatterName}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((base) => (
                <button
                  key={base}
                  onClick={() => handleBatterMove(base)}
                  className={`py-2 rounded-lg font-bold text-xs transition-all ${
                    batterState.toBase === base
                      ? "bg-blue-600 text-white scale-105"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {base === 4 ? "本塁" : `${base}塁`}
                </button>
              ))}
            </div>
          </div>

          {/* 既存走者の進塁 */}
          {currentRunners.map((runner) => {
            const state = runnerStates.get(runner.base) || {
              toBase: runner.base,
              scored: false,
              out: false,
            };
            const currentPlayType = playTypes.get(runner.base);

            return (
              <div
                key={runner.base}
                className="mb-3 bg-gray-800 rounded-lg p-3"
              >
                <h3 className="text-sm font-bold mb-2 text-yellow-400">
                  🏃 {runner.base}塁走者: {runner.name}
                </h3>

                {/* 進塁先ボタン */}
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[runner.base, runner.base + 1, runner.base + 2, 4]
                    .filter((b) => b <= 4)
                    .map((base) => (
                      <button
                        key={base}
                        onClick={() => handleRunnerMove(runner.base, base)}
                        className={`py-2 rounded-lg font-bold text-xs transition-all ${
                          state.toBase === base && !state.out
                            ? "bg-green-600 text-white scale-105"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        {base === 4 ? "本塁" : `${base}塁`}
                      </button>
                    ))}
                  <button
                    onClick={() => handleRunnerOut(runner.base)}
                    className={`py-2 rounded-lg font-bold text-xs transition-all ${
                      state.out
                        ? "bg-red-600 text-white scale-105"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    OUT
                  </button>
                </div>

                {/* 🆕 プレータイプ選択 */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => togglePlayType(runner.base, "tagUp")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                      currentPlayType === "tagUp"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    タッチアップ
                  </button>
                  <button
                    onClick={() => togglePlayType(runner.base, "rundown")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                      currentPlayType === "rundown"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    挟殺
                  </button>
                  <button
                    onClick={() => togglePlayType(runner.base, "cutoffPlay")}
                    className={`flex-1 py-1.5 rounded text-xs font-semibold transition-all ${
                      currentPlayType === "cutoffPlay"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    カット
                  </button>
                </div>
              </div>
            );
          })}

          {/* 保存ボタン */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-sm"
            >
              確定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerAdvanceModal;
