import React from "react";
import type { BuntType } from "../../../types/baseball";

interface BuntTypeSelectionProps {
  onSelectBuntType: (type: BuntType) => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

export const BuntTypeSelection: React.FC<BuntTypeSelectionProps> = ({
  onSelectBuntType,
  onBack,
  canGoBack,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">バントの種類</h3>
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 rounded-lg font-bold text-xs hover:bg-gray-600"
          >
            ← 戻る
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => onSelectBuntType("normal")}
          className="py-3 bg-teal-600 rounded-lg font-bold text-sm"
        >
          通常
        </button>
        <button
          onClick={() => onSelectBuntType("safety")}
          className="py-3 bg-green-600 rounded-lg font-bold text-sm"
        >
          セーフティ
        </button>
        <button
          onClick={() => onSelectBuntType("squeeze")}
          className="py-3 bg-orange-600 rounded-lg font-bold text-sm"
        >
          スーサイド
        </button>
      </div>
    </div>
  );
};

