import React from "react";
import type { BuntType } from "../../../types/baseball";

interface BuntTypeSelectionProps {
  onSelectBuntType: (type: BuntType) => void;
  onBack?: () => void;
  canGoBack?: boolean;
}

const BUNT_TYPES: { value: BuntType; label: string; className: string }[] = [
  { value: "normal", label: "通常", className: "bg-teal-600" },
  { value: "safety", label: "セーフティ", className: "bg-green-600" },
  { value: "squeeze", label: "スーサイド", className: "bg-orange-600" },
];

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
        {BUNT_TYPES.map((bunt) => (
          <button
            key={bunt.value}
            onClick={() => onSelectBuntType(bunt.value)}
            className={`py-3 rounded-lg font-bold text-sm ${bunt.className}`}
          >
            {bunt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
