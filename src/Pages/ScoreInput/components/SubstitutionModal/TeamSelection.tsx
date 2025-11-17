import React from "react";
import type { GameMeta } from "../../../../types/gameMeta";

interface TeamSelectionProps {
  team: "home" | "away";
  onTeamChange: (team: "home" | "away") => void;
  gameMeta: GameMeta;
}

export const TeamSelection: React.FC<TeamSelectionProps> = ({
  team,
  onTeamChange,
  gameMeta,
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        チーム
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onTeamChange("away")}
          className={`py-2 rounded-lg font-bold text-sm ${
            team === "away" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          {gameMeta.awayTeam.name || "先攻"}
        </button>
        <button
          onClick={() => onTeamChange("home")}
          className={`py-2 rounded-lg font-bold text-sm ${
            team === "home" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          {gameMeta.homeTeam.name || "後攻"}
        </button>
      </div>
    </div>
  );
};

