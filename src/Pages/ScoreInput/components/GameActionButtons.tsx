import React from "react";

interface GameActionButtonsProps {
  onGameEnd?: () => void;
  onOpenSubstitutionModal?: () => void;
}

export const GameActionButtons: React.FC<GameActionButtonsProps> = ({
  onGameEnd,
  onOpenSubstitutionModal,
}) => {
  return (
    <div className="mt-4 border-t border-gray-700 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            // 試合終了処理は親コンポーネントで実装
            if (onGameEnd) {
              onGameEnd();
            }
          }}
          className="py-2 bg-red-700 rounded-lg font-bold text-xs hover:bg-red-800"
        >
          試合終了
        </button>
        <button
          onClick={() => {
            if (onOpenSubstitutionModal) {
              onOpenSubstitutionModal();
            }
          }}
          className="py-2 bg-purple-600 rounded-lg font-bold text-xs hover:bg-purple-700"
        >
          選手交代
        </button>
      </div>
    </div>
  );
};

