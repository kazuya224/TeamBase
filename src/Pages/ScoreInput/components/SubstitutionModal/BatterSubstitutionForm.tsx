import React from "react";

interface LineupPlayer {
  id: string;
  name: string;
  number: string;
  battingOrder: number;
  position: string;
}

interface BatterSubstitutionFormProps {
  battingOrder: number;
  lineupPlayers: LineupPlayer[];
  onBattingOrderChange: (order: number, playerId: string) => void;
}

export const BatterSubstitutionForm: React.FC<
  BatterSubstitutionFormProps
> = ({ battingOrder, lineupPlayers, onBattingOrderChange }) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          打順
        </label>
        <select
          value={battingOrder}
          onChange={(e) => {
            const order = Number(e.target.value);
            const player = lineupPlayers.find(
              (p) => p.battingOrder === order
            );
            onBattingOrderChange(order, player?.id || "");
          }}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg"
        >
          {lineupPlayers.map((player) => (
            <option key={player.battingOrder} value={player.battingOrder}>
              {player.battingOrder}番: {player.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          交代前の選手
        </label>
        <div className="px-3 py-2 bg-gray-700 text-white rounded-lg">
          {lineupPlayers.find((p) => p.battingOrder === battingOrder)?.name}
        </div>
      </div>
    </>
  );
};

