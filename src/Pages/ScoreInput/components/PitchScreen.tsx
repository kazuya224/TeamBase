import React from "react";
import type {
  Pitch,
  PitchResult,
  AtBat,
  Base,
  RunnerAdvance,
} from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";
import { GameActionButtons } from "./GameActionButtons";

type Screen =
  | "pitch"
  | "batting"
  | "runner"
  | "cutPlay"
  | "rundown"
  | "result"
  | "buntType";

interface PitchScreenProps {
  currentAtBat: { pitches: Pitch[]; strikes: number; balls: number };
  lineup: string[];
  currentBatterIndex: number;
  pendingAtBat: AtBat | null;
  setPendingAtBat: React.Dispatch<React.SetStateAction<AtBat | null>>;
  onPitchResult: (result: PitchResult) => void;
  setCurrentScreen: (screen: Screen) => void;
  saveAtBatWithPending: (atBat: AtBat, shouldAdvanceBatter?: boolean) => void;
  resetAtBatInputs: () => void;
  calculateForcedAdvances: (batterToBase: Base) => RunnerAdvance[];
  showNavigationButtons: boolean;
  setShowNavigationButtons: (show: boolean) => void;
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  onGameEnd?: () => void;
  onOpenSubstitutionModal?: () => void;
}

const getOptionButtonClass = (selected: boolean) =>
  `py-2 rounded-lg font-bold text-xs ${
    selected ? "bg-blue-600 ring-2 ring-blue-400" : "bg-gray-700"
  }`;

export const PitchScreen: React.FC<PitchScreenProps> = ({
  currentAtBat,
  lineup,
  currentBatterIndex,
  pendingAtBat,
  setPendingAtBat,
  onPitchResult,
  setCurrentScreen,
  saveAtBatWithPending,
  resetAtBatInputs,
  calculateForcedAdvances,
  showNavigationButtons,
  setShowNavigationButtons,
  selectedOption,
  setSelectedOption,
  showOptions,
  setShowOptions,
  onGameEnd,
  onOpenSubstitutionModal,
}) => {
  const currentBatter = lineup[currentBatterIndex];

  const enableNavigationForOption = (optionKey: string) => {
    setShowNavigationButtons(true);
    setSelectedOption(optionKey);
  };

  const handleIntentionalWalk = () => {
    const forcedAdvances = calculateForcedAdvances(1);

    const batterAdvance: RunnerAdvance = {
      runnerId: "BR",
      fromBase: 0,
      toBase: 1,
      reason: "BB",
      scored: false,
      out: false,
      runnerName: currentBatter,
    };

    const allAdvances = [batterAdvance, ...forcedAdvances];
    const scoredCount = allAdvances.filter(
      (a) => a.scored || a.toBase === 4
    ).length;

    const atBat: AtBat = {
      batterName: currentBatter,
      battingResult: "walk",
      pitches: currentAtBat.pitches,
      outs: 0,
      rbis: scoredCount,
      runnerAdvances: allAdvances,
      timestamp: new Date().toISOString(),
    };

    saveAtBatWithPending(atBat);
    resetAtBatInputs();
    setSelectedOption("申告敬遠");
  };

  const ensurePendingInterferenceAtBat = (
    withRunnerAdvance: RunnerAdvance | null,
    optionKey: string
  ) => {
    if (!pendingAtBat) {
      const baseAtBat: AtBat = {
        batterName: currentBatter,
        battingResult: "interference",
        pitches: currentAtBat.pitches,
        outs: 0,
        rbis: 0,
        timestamp: new Date().toISOString(),
      };

      setPendingAtBat(
        withRunnerAdvance
          ? {
              ...baseAtBat,
              runnerAdvances: [withRunnerAdvance],
            }
          : baseAtBat
      );
    }

    setCurrentScreen("runner");
    setShowNavigationButtons(true);
    setSelectedOption(optionKey);
  };

  return (
    <div>
      <h3 className="text-sm font-bold mb-3 text-gray-300">投球結果を選択</h3>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <button
          type="button"
          onClick={() => onPitchResult("calledStrike")}
          className="py-3 bg-red-800 rounded-lg font-bold text-sm active:scale-95"
        >
          見逃しストライク
        </button>
        <button
          type="button"
          onClick={() => onPitchResult("swingingMiss")}
          className="py-3 bg-red-700 rounded-lg font-bold text-sm active:scale-95"
        >
          空振り
        </button>
        <button
          type="button"
          onClick={() => onPitchResult("foul")}
          className="py-3 bg-yellow-600 rounded-lg font-bold text-sm active:scale-95"
        >
          ファール
        </button>
        <button
          type="button"
          onClick={() => onPitchResult("ball")}
          className="py-3 bg-blue-600 rounded-lg font-bold text-sm active:scale-95"
        >
          ボール
        </button>
        <button
          type="button"
          onClick={() => onPitchResult("hitByPitch")}
          className="py-3 bg-orange-600 rounded-lg font-bold text-sm active:scale-95"
        >
          死球
        </button>
        <button
          type="button"
          onClick={() => onPitchResult("bunt")}
          className="py-3 bg-teal-600 rounded-lg font-bold text-sm active:scale-95"
        >
          バント
        </button>
        <button
          type="button"
          onClick={() => onPitchResult("hit")}
          className="py-3 bg-green-600 rounded-lg font-bold text-sm active:scale-95 "
        >
          打球
        </button>
      </div>

      <div className="mt-4 border-t border-gray-700 pt-3">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="w-full py-2 bg-gray-700 rounded-lg font-bold text-xs hover:bg-gray-600 mb-2"
        >
          {showOptions ? "オプション ▲" : "オプション ▼"}
        </button>

        {showOptions && (
          <>
            <h4 className="text-xs text-gray-400 mb-2">オプション</h4>
            <div className="grid grid-cols-2 gap-2">
              {/* WP */}
              <button
                type="button"
                onClick={() => {
                  enableNavigationForOption("WP");
                }}
                className={getOptionButtonClass(selectedOption === "WP")}
              >
                WP
              </button>

              {/* PB */}
              <button
                type="button"
                onClick={() => {
                  enableNavigationForOption("PB");
                }}
                className={getOptionButtonClass(selectedOption === "PB")}
              >
                PB
              </button>

              {/* ボーク */}
              <button
                type="button"
                onClick={() => {
                  enableNavigationForOption("ボーク");
                }}
                className={getOptionButtonClass(selectedOption === "ボーク")}
              >
                ボーク
              </button>

              {/* 申告敬遠 */}
              <button
                type="button"
                onClick={handleIntentionalWalk}
                className={getOptionButtonClass(selectedOption === "申告敬遠")}
              >
                申告敬遠
              </button>

              {/* 打撃妨害 */}
              <button
                type="button"
                onClick={() =>
                  ensurePendingInterferenceAtBat(
                    {
                      runnerId: "BR",
                      fromBase: 0,
                      toBase: 1,
                      reason: "BatterInterference",
                      scored: false,
                      out: false,
                      runnerName: currentBatter,
                    },
                    "打撃妨害"
                  )
                }
                className={getOptionButtonClass(selectedOption === "打撃妨害")}
              >
                打撃妨害
              </button>

              {/* 守備妨害 */}
              <button
                type="button"
                onClick={() => ensurePendingInterferenceAtBat(null, "守備妨害")}
                className={getOptionButtonClass(selectedOption === "守備妨害")}
              >
                守備妨害
              </button>

              {/* 走塁妨害 */}
              <button
                type="button"
                onClick={() => ensurePendingInterferenceAtBat(null, "走塁妨害")}
                className={getOptionButtonClass(selectedOption === "走塁妨害")}
              >
                走塁妨害
              </button>

              {/* 牽制 */}
              <button
                type="button"
                onClick={() => {
                  enableNavigationForOption("牽制");
                }}
                className={getOptionButtonClass(selectedOption === "牽制")}
              >
                牽制
              </button>
            </div>
          </>
        )}

        {showNavigationButtons && (
          <NavigationButtons setCurrentScreen={setCurrentScreen} />
        )}

        <GameActionButtons
          onGameEnd={onGameEnd}
          onOpenSubstitutionModal={onOpenSubstitutionModal}
        />
      </div>
    </div>
  );
};
