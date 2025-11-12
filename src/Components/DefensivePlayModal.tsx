import React, { useState, useEffect } from "react";

// 型定義
type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF";
type AdvancedPlayType = "normal" | "tagUp" | "rundown" | "cutoffPlay" | "relay";

interface DefensivePlay {
  positions: Position[];
  playType: AdvancedPlayType;
  description?: string;
}

interface DefensivePlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (defensivePlay: DefensivePlay) => void;
  playType?: AdvancedPlayType;
  initialPositions?: Position[];
}

const DefensivePlayModal: React.FC<DefensivePlayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playType = "normal",
  initialPositions = [],
}) => {
  const [selectedPositions, setSelectedPositions] =
    useState<Position[]>(initialPositions);
  const [selectedPlayType, setSelectedPlayType] =
    useState<AdvancedPlayType>(playType);
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setSelectedPositions(initialPositions);
      setSelectedPlayType(playType);
      setDescription("");
    }
  }, [isOpen, initialPositions, playType]);

  const handleAddPosition = (pos: Position) => {
    setSelectedPositions((prev) => [...prev, pos]);
  };

  const handleRemoveLastPosition = () => {
    setSelectedPositions((prev) => prev.slice(0, -1));
  };

  const handleClearPositions = () => {
    setSelectedPositions([]);
  };

  const handleSave = () => {
    if (selectedPositions.length === 0) {
      alert("守備位置を選択してください");
      return;
    }

    const defensivePlay: DefensivePlay = {
      positions: selectedPositions,
      playType: selectedPlayType,
      description: description || undefined,
    };

    onSave(defensivePlay);
    onClose();
  };

  if (!isOpen) return null;

  // 守備位置の数字表記を取得
  const getPositionNumber = (pos: Position): string => {
    const positionMap: Record<Position, string> = {
      P: "1",
      C: "2",
      "1B": "3",
      "2B": "4",
      "3B": "5",
      SS: "6",
      LF: "7",
      CF: "8",
      RF: "9",
    };
    return positionMap[pos] || pos;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-3">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-4">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
            <h2 className="text-lg font-bold">守備プレー記録</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-xl"
            >
              ✕
            </button>
          </div>

          {/* プレータイプ選択 */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">プレータイプ</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedPlayType("normal")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedPlayType === "normal"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                通常
              </button>
              <button
                onClick={() => setSelectedPlayType("rundown")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedPlayType === "rundown"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                挟殺
              </button>
              <button
                onClick={() => setSelectedPlayType("relay")}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedPlayType === "relay"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                中継
              </button>
            </div>
          </div>

          {/* 選択された守備位置の表示 */}
          <div className="mb-4 bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">守備位置の流れ</div>
            <div className="flex items-center gap-2 min-h-[40px]">
              {selectedPositions.length === 0 ? (
                <span className="text-gray-500 text-sm">
                  位置を選択してください
                </span>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedPositions.map((pos, index) => (
                    <React.Fragment key={index}>
                      <span className="px-2 py-1 bg-blue-600 rounded text-sm font-bold">
                        {getPositionNumber(pos)}
                      </span>
                      {index < selectedPositions.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              例: 6-4-3 = ショート→セカンド→ファースト
            </div>
          </div>

          {/* 守備位置選択ボタン */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">
              守備位置を順番に選択
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  "P",
                  "C",
                  "1B",
                  "2B",
                  "3B",
                  "SS",
                  "LF",
                  "CF",
                  "RF",
                ] as Position[]
              ).map((pos) => (
                <button
                  key={pos}
                  onClick={() => handleAddPosition(pos)}
                  className="py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-sm transition-all active:scale-95"
                >
                  <div>{pos}</div>
                  <div className="text-xs text-gray-400">
                    {getPositionNumber(pos)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleRemoveLastPosition}
              disabled={selectedPositions.length === 0}
              className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all"
            >
              1つ戻る
            </button>
            <button
              onClick={handleClearPositions}
              disabled={selectedPositions.length === 0}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-all"
            >
              クリア
            </button>
          </div>

          {/* 説明欄（オプション） */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">メモ（任意）</div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 併殺、タッチアウト等"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* 保存・キャンセルボタン */}
          <div className="flex gap-2 pt-3 border-t border-gray-700">
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

export default DefensivePlayModal;
