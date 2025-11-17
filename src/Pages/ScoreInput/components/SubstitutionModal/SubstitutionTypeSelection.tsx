import React from "react";
import type { SubstitutionType } from "../../../../types/baseball";

interface SubstitutionTypeSelectionProps {
  type: SubstitutionType;
  onTypeChange: (type: SubstitutionType) => void;
}

export const SubstitutionTypeSelection: React.FC<
  SubstitutionTypeSelectionProps
> = ({ type, onTypeChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        交代種類
      </label>
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => onTypeChange("batter")}
          className={`py-2 rounded-lg font-bold text-xs ${
            type === "batter" ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          打者交代
        </button>
        <button
          onClick={() => onTypeChange("runner")}
          className={`py-2 rounded-lg font-bold text-xs ${
            type === "runner" ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          走者交代
        </button>
        <button
          onClick={() => onTypeChange("defense")}
          className={`py-2 rounded-lg font-bold text-xs ${
            type === "defense" ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          守備交代
        </button>
        <button
          onClick={() => onTypeChange("defenseSwap")}
          className={`py-2 rounded-lg font-bold text-xs ${
            type === "defenseSwap" ? "bg-green-600" : "bg-gray-700"
          }`}
        >
          守備入れ替え
        </button>
      </div>
    </div>
  );
};

