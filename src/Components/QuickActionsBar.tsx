import React, { useMemo } from "react";
import { BattingResult } from "../types";

interface QuickActionsBarProps {
  currentOuts: number;
  currentRunners: { base: 1 | 2 | 3; name: string }[];
  onBattingResult: (result: BattingResult) => void;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  currentOuts,
  currentRunners,
  onBattingResult,
}) => {
  const actions = useMemo(() => {
    const acts = [
      {
        id: "strikeout",
        label: "三振",
        icon: "K",
        result: "strikeout" as BattingResult,
        show: true,
      },
      {
        id: "walk",
        label: "四球",
        icon: "BB",
        result: "walk" as BattingResult,
        show: true,
      },
      {
        id: "single",
        label: "単打",
        icon: "1B",
        result: "single" as BattingResult,
        show: true,
      },
      {
        id: "doublePlay",
        label: "併殺",
        icon: "DP",
        result: "doublePlay" as BattingResult,
        show: currentRunners.some((r) => r.base === 1) && currentOuts < 2,
      },
      {
        id: "sacrificeFly",
        label: "犠飛",
        icon: "SF",
        result: "sacrificeFly" as BattingResult,
        show: currentRunners.some((r) => r.base === 3) && currentOuts < 2,
      },
    ];

    return acts.filter((a) => a.show);
  }, [currentOuts, currentRunners]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-700">⚡ クイック操作</h4>
        <span className="text-xs text-gray-500">{actions.length}個</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onBattingResult(action.result)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold text-xs active:scale-95 transition-all shadow-md"
          >
            <div className="text-2xl mb-1">{action.icon}</div>
            <div className="leading-tight text-center px-1">{action.label}</div>
          </button>
        ))}
      </div>

      {actions.length > 3 && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          ← 横スクロールで他の操作を表示
        </div>
      )}
    </div>
  );
};

export default QuickActionsBar;
