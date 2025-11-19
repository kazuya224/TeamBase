// src/components/ScoreInput/components/RunnerScreen/ToBaseSelection.tsx

import React from "react";
import type { Base } from "../../../../types/baseball";

type RunnerKey = "BR" | "R1" | "R2" | "R3";

interface ToBaseSelectionProps {
  selectedRunner: RunnerKey | "";
  fromBase: Base | 0; // ★ 追加: 現在の塁
  selectedToBase: Base | 4 | null;
  onToBaseSelect: (toBase: Base | 4) => void;
}

export const ToBaseSelection: React.FC<ToBaseSelectionProps> = ({
  selectedRunner,
  fromBase,
  selectedToBase,
  onToBaseSelect,
}) => {
  if (!selectedRunner) return null;

  // 打者(BR)は最低でも1塁へ、走者は現在の塁から選択
  const startBase: Base | 1 = fromBase === 0 ? 1 : (fromBase as Base);

  const baseOptions: (Base | 4)[] = [];
  for (let b = startBase; b <= 4; b++) {
    baseOptions.push(b as Base | 4);
  }

  // 「選択中の塁」: まだ何も選んでいなければ現在の塁をハイライト
  const effectiveSelected = selectedToBase ?? (fromBase === 0 ? 1 : fromBase);

  const labelMap: Record<number, string> = {
    1: "一塁",
    2: "二塁",
    3: "三塁",
    4: "本塁",
  };

  return (
    <div className="mb-3">
      <div className="text-xs text-gray-400 mb-1">進塁先を選択</div>
      <div className="grid grid-cols-4 gap-2">
        {baseOptions.map((base) => (
          <button
            key={base}
            onClick={() => onToBaseSelect(base)}
            className={`py-2 rounded font-bold text-xs ${
              effectiveSelected === base ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {labelMap[base]}
          </button>
        ))}
      </div>
    </div>
  );
};
