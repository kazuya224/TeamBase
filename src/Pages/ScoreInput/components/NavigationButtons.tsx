// ============================================
// 処理順選択ナビゲーションボタン（共通コンポーネント）
// ============================================

import React from "react";

interface NavigationButtonsProps {
  onNavigateToDefense?: () => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onNavigateToResult?: () => void;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onNavigateToDefense,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
}) => {
  return (
    <div className="mt-4 border-t border-gray-700 pt-3">
      <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
      <div className="grid grid-cols-5 gap-2">
        {onNavigateToDefense && (
          <button
            onClick={onNavigateToDefense}
            className="py-2 bg-gray-600 rounded-lg font-bold text-xs"
          >
            守備
          </button>
        )}
        {onNavigateToCutPlay && (
          <button
            onClick={onNavigateToCutPlay}
            className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
          >
            カット
          </button>
        )}
        {onNavigateToRundown && (
          <button
            onClick={onNavigateToRundown}
            className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
          >
            挟殺
          </button>
        )}
        {onNavigateToRunner && (
          <button
            onClick={onNavigateToRunner}
            className="py-2 bg-green-600 rounded-lg font-bold text-xs"
          >
            走者
          </button>
        )}
        {onNavigateToResult && (
          <button
            onClick={onNavigateToResult}
            className="py-2 bg-red-600 rounded-lg font-bold text-xs"
          >
            結果
          </button>
        )}
      </div>
    </div>
  );
};

