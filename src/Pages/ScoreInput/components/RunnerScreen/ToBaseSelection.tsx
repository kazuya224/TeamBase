import React from "react";
import type { Base } from "../../../../types/baseball";

interface ToBaseSelectionProps {
  selectedRunner: string | "BR" | "";
  selectedToBase: Base | null;
  onToBaseSelect: (base: Base) => void;
}

export const ToBaseSelection: React.FC<ToBaseSelectionProps> = ({
  selectedRunner,
  selectedToBase,
  onToBaseSelect,
}) => {
  if (!selectedRunner) return null;

  return (
    <div className="mb-3">
      <div className="text-xs text-gray-400 mb-1">進塁先の塁を選択</div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {[1, 2, 3, 4].map((base) => {
          const fromBase =
            selectedRunner === "BR"
              ? 0
              : parseInt(selectedRunner.replace("R", ""));
          if (base <= fromBase) return null;
          return (
            <button
              key={base}
              onClick={() => onToBaseSelect(base as Base)}
              className={`py-2 rounded font-bold text-xs ${
                selectedToBase === base ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              {base === 4 ? "本塁" : `${base}塁`}
            </button>
          );
        })}
      </div>
    </div>
  );
};
