import React from "react";
import type { Position } from "../../../../types/baseball";
import { POSITION_OPTIONS } from "./constants";

interface DefensePlayer {
  id: string;
  name: string;
  number: string;
  position: Position;
}

interface DefenseSubstitutionFormProps {
  position: Position | undefined;
  defensePlayers: DefensePlayer[];
  onPositionChange: (position: Position | undefined, playerId: string) => void;
}

export const DefenseSubstitutionForm: React.FC<
  DefenseSubstitutionFormProps
> = ({ position, defensePlayers, onPositionChange }) => {
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
          交代前の守備位置
        </label>
        <select
          value={position || ""}
          onChange={(e) => {
            const selectedValue = e.target.value;
            if (!selectedValue) {
              onPositionChange(undefined, "");
              return;
            }
            const selectedPosition = selectedValue as Position;
            const player = defensePlayers.find(
              (p) => p.position === selectedPosition
            );
            onPositionChange(selectedPosition, player?.id || "");
          }}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
        >
          <option value="">選択してください</option>
          {renderPositionOptions()}
        </select>
      </div>
      {position && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            交代前の選手
          </label>
          <div className="px-3 py-2 bg-gray-700 text-white rounded-lg">
            {defensePlayers.find((p) => p.position === position)?.name}
          </div>
        </div>
      )}
    </>
  );
};

