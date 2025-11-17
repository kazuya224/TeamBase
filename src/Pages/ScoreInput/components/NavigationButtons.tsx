import React from "react";

type Screen =
  | "pitch"
  | "batting"
  | "runner"
  | "cutPlay"
  | "rundown"
  | "result"
  | "buntType";

interface NavigationButtonsProps {
  setCurrentScreen?: (screen: Screen) => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onNavigateToResult?: () => void;
}

const createNavigationHandler =
  (
    target: Screen,
    setCurrentScreen?: (screen: Screen) => void,
    fallback?: () => void
  ) =>
  () => {
    if (setCurrentScreen) {
      setCurrentScreen(target);
    } else if (fallback) {
      fallback();
    }
  };

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  setCurrentScreen,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onNavigateToResult,
}) => {
  return (
    <div className="mt-4 border-t border-gray-700 pt-3">
      <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={createNavigationHandler(
            "cutPlay",
            setCurrentScreen,
            onNavigateToCutPlay
          )}
          className="py-2 bg-blue-600 rounded-lg font-bold text-xs hover:bg-blue-500 transition-colors"
        >
          カット
        </button>
        <button
          type="button"
          onClick={createNavigationHandler(
            "rundown",
            setCurrentScreen,
            onNavigateToRundown
          )}
          className="py-2 bg-orange-600 rounded-lg font-bold text-xs hover:bg-orange-500 transition-colors"
        >
          挟殺
        </button>
        <button
          type="button"
          onClick={createNavigationHandler(
            "runner",
            setCurrentScreen,
            onNavigateToRunner
          )}
          className="py-2 bg-green-600 rounded-lg font-bold text-xs hover:bg-green-500 transition-colors"
        >
          走者
        </button>
        {/* 結果ボタンを再度有効化したくなったとき用にそのまま残しておく */}
        {/* 
        <button
          type="button"
          onClick={createNavigationHandler(
            "result",
            setCurrentScreen,
            onNavigateToResult
          )}
          className="py-2 bg-red-600 rounded-lg font-bold text-xs hover:bg-red-500 transition-colors"
        >
          結果
        </button>
        */}
      </div>
    </div>
  );
};
