import React from "react";
import type { Position } from "../../../../types/baseball";
import { POSITION_OPTIONS } from "./constants";

interface DefensePlayer {
  id: string;
  name: string;
  number: string;
  position: Position;
}

interface DefenseSwapFormProps {
  swapFromPosition: Position | undefined;
  swapToPosition: Position | undefined;
  defensePlayers: DefensePlayer[];
  onSwapFromPositionChange: (position: Position | undefined) => void;
  onSwapToPositionChange: (position: Position | undefined) => void;
}

export const DefenseSwapForm: React.FC<DefenseSwapFormProps> = ({
  swapFromPosition,
  swapToPosition,
  defensePlayers,
  onSwapFromPositionChange,
  onSwapToPositionChange,
}) => {
  const renderPositionOptions = () =>
    POSITION_OPTIONS.map((opt) => {
      const playerAtPosition = defensePlayers.find(
        (p) => p.position === opt.value
      );
      const playerLabel = playerAtPosition ? `(${playerAtPosition.name})` : "";
      return (
        <option key={opt.value} value={opt.value}>
          {opt.label} {playerLabel}
        </option>
      );
    });

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          位置1
        </label>
        <select
          value={swapFromPosition || ""}
          onChange={(e) =>
            onSwapFromPositionChange(
              e.target.value ? (e.target.value as Position) : undefined
            )
          }
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
        >
          <option value="">選択してください</option>
          {renderPositionOptions()}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          位置2
        </label>
        <select
          value={swapToPosition || ""}
          onChange={(e) =>
            onSwapToPositionChange(
              e.target.value ? (e.target.value as Position) : undefined
            )
          }
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
        >
          <option value="">選択してください</option>
          {renderPositionOptions()}
        </select>
      </div>
    </>
  );
};

