import React from "react";
import type { RunnerInfo } from "../../../../types/baseball";

interface RunnerSelectionProps {
  runners: RunnerInfo[];
  currentBatterName?: string;
  selectedRunner: string | "BR" | "";
  onRunnerSelect: (runner: string | "BR") => void;
}

export const RunnerSelection: React.FC<RunnerSelectionProps> = ({
  runners,
  currentBatterName,
  selectedRunner,
  onRunnerSelect,
}) => {
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-400 mb-1">該当する走者を選択</div>
      <div className="space-y-2 mb-2">
        {currentBatterName && (
          <div className="flex gap-2">
            <button
              onClick={() => onRunnerSelect("BR")}
              className={`flex-1 py-2 rounded font-bold text-xs ${
                selectedRunner === "BR" ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              打者: {currentBatterName}
            </button>
          </div>
        )}
        {runners.map((runner) => (
          <div key={runner.runnerId} className="flex gap-2">
            <button
              onClick={() => onRunnerSelect(runner.runnerId)}
              className={`flex-1 py-2 rounded font-bold text-xs ${
                selectedRunner === runner.runnerId
                  ? "bg-green-600"
                  : "bg-gray-700"
              }`}
            >
              {runner.base}塁: {runner.name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
