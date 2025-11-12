import React, { useState, useEffect } from "react";
import { GameAction } from "../types";

interface UndoToastProps {
  lastAction: GameAction | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const UndoToast: React.FC<UndoToastProps> = ({
  lastAction,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (lastAction && lastAction.undoable) {
      setVisible(true);
      setCountdown(5);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setVisible(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [lastAction]);

  const handleUndo = () => {
    onUndo();
    setVisible(false);
  };

  if (!visible) {
    // コンパクトなUndo/Redoボタン（常時表示）
    return (
      <div className="fixed bottom-20 right-4 flex gap-2 z-40">
        {canUndo && (
          <button
            onClick={onUndo}
            className="w-12 h-12 bg-gray-700 bg-opacity-90 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all"
            aria-label="Undo"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
        )}
        {canRedo && (
          <button
            onClick={onRedo}
            className="w-12 h-12 bg-gray-700 bg-opacity-90 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all"
            aria-label="Redo"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-gray-900 bg-opacity-95 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 min-w-[320px]">
        {/* アイコン */}
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* メッセージ */}
        <div className="flex-1">
          <div className="font-bold text-sm">
            {getActionMessage(lastAction?.type || "EVENT_ADD")}
          </div>
          <div className="text-xs text-gray-300 mt-0.5">
            {countdown}秒後に自動確定
          </div>
        </div>

        {/* Undoボタン */}
        <button
          onClick={handleUndo}
          className="flex-shrink-0 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-bold text-sm active:scale-95 transition-all"
        >
          元に戻す
        </button>

        {/* 閉じるボタン */}
        <button
          onClick={() => setVisible(false)}
          className="flex-shrink-0 w-8 h-8 hover:bg-white hover:bg-opacity-10 rounded-full flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* プログレスバー */}
      <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(countdown / 5) * 100}%` }}
        />
      </div>
    </div>
  );
};

const getActionMessage = (type: string): string => {
  const messages: Record<string, string> = {
    EVENT_ADD: "記録を追加しました",
    EVENT_REMOVE: "記録を削除しました",
    EVENT_MODIFY: "記録を変更しました",
    INNING_CHANGE: "イニングを変更しました",
  };
  return messages[type] || "操作を実行しました";
};

// アニメーション用CSS（グローバルに追加）
const style = document.createElement("style");
style.textContent = `
  @keyframes slide-up {
    from {
      transform: translate(-50%, 20px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  .scrollbar-thin::-webkit-scrollbar {
    height: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 2px;
  }
`;
document.head.appendChild(style);

export default UndoToast;
