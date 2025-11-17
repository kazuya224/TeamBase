import React from "react";

interface GameHeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
}

const BASE_BUTTON_CLASS =
  "px-3 py-1 rounded text-xs font-semibold transition-colors";

export const GameHeader: React.FC<GameHeaderProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
}) => {
  return (
    <div className="bg-black px-3 py-2 flex items-center justify-between">
      <div className="flex gap-2">
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className={`${BASE_BUTTON_CLASS} bg-gray-700 hover:bg-gray-600`}
          >
            ← 元に戻す
          </button>
        )}
        {canRedo && (
          <button
            type="button"
            onClick={onRedo}
            className={`${BASE_BUTTON_CLASS} bg-gray-700 hover:bg-gray-600`}
          >
            やり直し →
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onSave}
        className={`${BASE_BUTTON_CLASS} bg-blue-700 hover:bg-blue-600`}
      >
        保存
      </button>
    </div>
  );
};
