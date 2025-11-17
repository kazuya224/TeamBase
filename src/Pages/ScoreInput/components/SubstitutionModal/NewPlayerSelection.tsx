import React from "react";
import type { Player } from "../../../../types/gameMeta";

interface NewPlayerSelectionProps {
  newPlayerId: string;
  benchPlayers: Player[];
  onNewPlayerChange: (playerId: string) => void;
}

export const NewPlayerSelection: React.FC<NewPlayerSelectionProps> = ({
  newPlayerId,
  benchPlayers,
  onNewPlayerChange,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        交代後の選手
      </label>
      <select
        value={newPlayerId}
        onChange={(e) => onNewPlayerChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
      >
        <option value="">選択してください</option>
        {benchPlayers.map((player) => (
          <option key={player.id} value={player.id}>
            {player.number ? `#${player.number} ` : ""}
            {player.name || "無名"}
          </option>
        ))}
      </select>
    </div>
  );
};

