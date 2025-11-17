import React, { useState, useEffect } from "react";

interface GameEndModalProps {
  isOpen: boolean;
  onConfirm: (endTime: string | null) => void;
  onCancel: () => void;
}

// 共通の現在時刻文字列 ("HH:MM") 生成ヘルパー
const getCurrentTimeString = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const GameEndModal: React.FC<GameEndModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [endTime, setEndTime] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたときに現在時刻をデフォルト表示
      setEndTime(getCurrentTimeString());
    }
  }, [isOpen]);

  const handleUseCurrentTime = () => {
    setEndTime(getCurrentTimeString());
  };

  const handleConfirm = () => {
    const value = endTime.trim();
    onConfirm(value === "" ? null : value);
  };

  if (!isOpen) return null;

  const titleId = "game-end-modal-title";
  const descriptionId = "game-end-modal-description";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 id={titleId} className="text-xl font-bold text-white mb-4">
          試合終了
        </h2>
        <p id={descriptionId} className="text-gray-300 mb-4">
          試合を終了します。終了時刻を入力してください（任意）。
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            終了時刻
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value);
              }}
              className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleUseCurrentTime}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              現在時刻
            </button>
          </div>
          <label className="flex items-center text-gray-300 text-sm">
            <input
              type="checkbox"
              checked={endTime === ""}
              onChange={(e) => {
                if (e.target.checked) {
                  setEndTime("");
                } else {
                  // チェックを外したときは何もセットしない（ユーザーが手入力する想定）
                }
              }}
              className="mr-2"
            />
            終了時刻を入力しない
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            試合を終了
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
