import React from "react";
import type { BuntType } from "../../../types/baseball";

interface BuntTypeSelectionProps {
  onSelectBuntType: (type: BuntType) => void;
}

export const BuntTypeSelection: React.FC<BuntTypeSelectionProps> = ({
  onSelectBuntType,
}) => {
  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">バントの種類</h3>
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

