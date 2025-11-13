import React from "react";
import type {
  Pitch,
  RunnerInfo,
  HitType,
  HitDirection,
  Position,
  BuntType,
  PitchResult,
  BattingResult,
  AtBat,
  Base,
  RunnerAdvance,
} from "../../../types/baseball";
import { BattedBallInput } from "./BattedBallInput";
import { BuntTypeSelection } from "./BuntTypeSelection";
import { DefenseScreen } from "./DefenseScreen";
import { CutPlayScreen } from "./CutPlayScreen";
import { RundownScreen } from "./RundownScreen";
import { RunnerScreen } from "./RunnerScreen";
import { ResultScreen } from "./ResultScreen";

interface InputPanelProps {
  inputStep: "pitch" | "batted" | "result" | "buntType";
  currentAtBat: { pitches: Pitch[]; strikes: number; balls: number };
  runners: RunnerInfo[];
  selectedHitType: HitType | "";
  selectedHitDirection: HitDirection | "";
  selectedPosition: Position | "";
  onPitchResult: (result: PitchResult) => void;
  onSetInputStep: (step: "pitch" | "batted" | "result" | "buntType") => void;
  onSetHitType: (type: HitType) => void;
  onSetHitDirection: (dir: HitDirection) => void;
  onSetPosition: (pos: Position) => void;
  onSetBuntType: (type: BuntType) => void;
  onCompleteAtBat: (result: BattingResult) => void;
  onOpenRunnerModal: (
    actionType: "stolenBase" | "pickoff" | "wildPitch" | "passedBall" | "balk"
  ) => void;
  currentScreen:
    | "pitch"
    | "batting"
    | "defense"
    | "runner"
    | "cutPlay"
    | "rundown"
    | "result"
    | "buntType";
  setCurrentScreen: (
    screen:
      | "pitch"
      | "batting"
      | "defense"
      | "runner"
      | "cutPlay"
      | "rundown"
      | "result"
      | "buntType"
  ) => void;
  pendingAtBat: AtBat | null;
  setPendingAtBat: React.Dispatch<React.SetStateAction<AtBat | null>>;
  saveAtBatWithPending: (atBat: AtBat, shouldAdvanceBatter?: boolean) => void;
  checkInfieldFlyCondition: () => boolean;
  lineup: string[];
  currentBatterIndex: number;
  handleSaveRunnerAdvances: (advances: RunnerAdvance[]) => void;
  resetAtBatInputs: () => void;
  handleBattingResultSelect: (result: BattingResult) => void;
  handleFinishPlay: () => void;
  currentOuts: number;
  calculateForcedAdvances: (batterToBase: Base) => RunnerAdvance[];
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputStep,
  currentAtBat,
  runners,
  selectedHitType,
  selectedHitDirection,
  selectedPosition,
  onPitchResult,
  onSetInputStep,
  onSetHitType,
  onSetHitDirection,
  onSetPosition,
  onSetBuntType,
  onCompleteAtBat,
  onOpenRunnerModal,
  currentScreen,
  setCurrentScreen,
  pendingAtBat,
  setPendingAtBat,
  saveAtBatWithPending,
  checkInfieldFlyCondition,
  lineup,
  currentBatterIndex,
  handleSaveRunnerAdvances,
  resetAtBatInputs,
  handleBattingResultSelect,
  handleFinishPlay,
  calculateForcedAdvances,
}) => {
  const showPitchScreen =
    inputStep === "pitch" &&
    currentScreen !== "cutPlay" &&
    currentScreen !== "rundown" &&
    currentScreen !== "runner" &&
    currentScreen !== "result";

  return (
    <div className="bg-gray-900 px-2 py-2 border-t border-gray-700 flex-1 overflow-y-auto">
      {showPitchScreen && (
        <div>
          <h3 className="text-sm font-bold mb-3 text-gray-300">
            投球結果を選択
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <button
              onClick={() => onPitchResult("calledStrike")}
              className="py-3 bg-red-800 rounded-lg font-bold text-sm active:scale-95"
            >
              見逃しストライク
            </button>
            <button
              onClick={() => onPitchResult("swingingMiss")}
              className="py-3 bg-red-700 rounded-lg font-bold text-sm active:scale-95"
            >
              空振り
            </button>
            <button
              onClick={() => onPitchResult("foul")}
              className="py-3 bg-yellow-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ファール
            </button>
            <button
              onClick={() => onPitchResult("ball")}
              className="py-3 bg-blue-600 rounded-lg font-bold text-sm active:scale-95"
            >
              ボール
            </button>
            <button
              onClick={() => onPitchResult("hitByPitch")}
              className="py-3 bg-orange-600 rounded-lg font-bold text-sm active:scale-95"
            >
              死球
            </button>
            <button
              onClick={() => onPitchResult("bunt")}
              className="py-3 bg-teal-600 rounded-lg font-bold text-sm active:scale-95"
            >
              バント
            </button>
            <button
              onClick={() => onPitchResult("hit")}
              className="py-3 bg-green-600 rounded-lg font-bold text-sm active:scale-95 "
            >
              打球
            </button>
          </div>

          <div className="mt-4 border-t border-gray-700 pt-3">
            <h4 className="text-xs text-gray-400 mb-2">オプション</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenRunnerModal("wildPitch")}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                WP
              </button>
              <button
                onClick={() => onOpenRunnerModal("passedBall")}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                PB
              </button>
              <button
                onClick={() => onOpenRunnerModal("balk")}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                ボーク
              </button>
              <button
                onClick={() => {
                  // 申告敬遠: 四球と同じロジックを使用（createWalkAtBat相当の処理）
                  const currentBatter = lineup[currentBatterIndex];
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
                }}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                申告敬遠
              </button>
              <button
                onClick={() => {
                  const currentBatter = lineup[currentBatterIndex];
                  const atBat: AtBat = {
                    batterName: currentBatter,
                    battingResult: "interference",
                    pitches: currentAtBat.pitches,
                    outs: 0,
                    rbis: 0,
                    runnerAdvances: [
                      {
                        runnerId: "BR",
                        fromBase: 0,
                        toBase: 1,
                        reason: "BatterInterference",
                        scored: false,
                        out: false,
                        runnerName: currentBatter,
                      },
                    ],
                    timestamp: new Date().toISOString(),
                  };
                  saveAtBatWithPending(atBat);
                  resetAtBatInputs();
                }}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                打撃妨害
              </button>
              <button
                onClick={() => {
                  const currentBatter = lineup[currentBatterIndex];
                  if (!pendingAtBat) {
                    setPendingAtBat({
                      batterName: currentBatter,
                      battingResult: "interference",
                      pitches: currentAtBat.pitches,
                      outs: 0,
                      rbis: 0,
                      timestamp: new Date().toISOString(),
                    });
                  }
                  setCurrentScreen("runner");
                }}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                守備妨害
              </button>
              <button
                onClick={() => {
                  const currentBatter = lineup[currentBatterIndex];
                  if (!pendingAtBat) {
                    setPendingAtBat({
                      batterName: currentBatter,
                      battingResult: "interference",
                      pitches: currentAtBat.pitches,
                      outs: 0,
                      rbis: 0,
                      timestamp: new Date().toISOString(),
                    });
                  }
                  setCurrentScreen("runner");
                }}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                走塁妨害
              </button>
              <button
                onClick={() => onOpenRunnerModal("pickoff")}
                className="py-2 bg-gray-700 rounded-lg font-bold text-xs"
              >
                牽制
              </button>
            </div>
          </div>
        </div>
      )}

      {inputStep === "batted" && currentScreen === "batting" && (
        <BattedBallInput
          selectedHitType={selectedHitType}
          selectedHitDirection={selectedHitDirection}
          selectedPosition={selectedPosition}
          onSetHitType={onSetHitType}
          onSetHitDirection={onSetHitDirection}
          onSetPosition={onSetPosition}
          onNext={() => setCurrentScreen("defense")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBattingResultSelect={handleBattingResultSelect}
          onFinishPlay={handleFinishPlay}
        />
      )}

      {inputStep === "buntType" && (
        <BuntTypeSelection
          onSelectBuntType={(type) => {
            onSetBuntType(type);
            onSetInputStep("batted");
          }}
        />
      )}

      {currentScreen === "defense" && (
        <DefenseScreen
          hitType={selectedHitType || undefined}
          onNext={() => setCurrentScreen("runner")}
          onComplete={(defensiveSequence, errors) => {
            const positions = defensiveSequence
              .filter((step) => step.position)
              .map((step) => step.position!);
            const defensePath = defensiveSequence
              .map((step) => {
                if (step.errorType === "catch") return "捕球E";
                if (step.errorType === "throw") return "送球E";
                if (step.errorType === "FC") return "FC";
                return step.position;
              })
              .filter((x) => x) as string[];

            if (pendingAtBat) {
              setPendingAtBat({
                ...pendingAtBat,
                defensivePositions: positions,
                defensePath,
                errors: errors.length > 0 ? errors : undefined,
              });
            } else {
              const atBat: AtBat = {
                batterName: "",
                battingResult: "single",
                pitches: currentAtBat.pitches,
                outs: 0,
                rbis: 0,
                hitDirection: selectedHitDirection || undefined,
                hitType: selectedHitType || undefined,
                position: selectedPosition || undefined,
                defensivePositions: positions,
                defensePath,
                errors: errors.length > 0 ? errors : undefined,
                infieldFly:
                  checkInfieldFlyCondition() && selectedHitType === "fly",
              };
              setPendingAtBat(atBat);
            }
            setCurrentScreen("runner");
          }}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onNavigateToResult={() => setCurrentScreen("result")}
        />
      )}

      {currentScreen === "cutPlay" && (
        <CutPlayScreen
          onComplete={(positions) => {
            if (pendingAtBat) {
              setPendingAtBat({
                ...pendingAtBat,
                defensivePositions: positions,
                playType: "cutoffPlay",
              });
            }
            setCurrentScreen("result");
          }}
          onNavigateToResult={() => setCurrentScreen("result")}
          onNavigateToDefense={() => setCurrentScreen("defense")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
        />
      )}

      {currentScreen === "rundown" && (
        <RundownScreen
          runners={runners}
          onComplete={(positions) => {
            if (pendingAtBat) {
              setPendingAtBat({
                ...pendingAtBat,
                defensivePositions: positions,
                playType: "rundown",
              });
            }
            setCurrentScreen("result");
          }}
          onNavigateToResult={() => setCurrentScreen("result")}
          onNavigateToDefense={() => setCurrentScreen("defense")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
        />
      )}

      {currentScreen === "runner" && (
        <RunnerScreen
          runners={runners}
          currentBatterName={
            pendingAtBat?.batterName || lineup[currentBatterIndex]
          }
          onComplete={handleSaveRunnerAdvances}
          onNavigateToResult={() => setCurrentScreen("result")}
          onNavigateToDefense={() => setCurrentScreen("defense")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
        />
      )}

      {currentScreen === "result" && (
        <ResultScreen
          runners={runners}
          currentBatterName={
            pendingAtBat?.batterName || lineup[currentBatterIndex]
          }
          onConfirm={(resultType) => {
            if (pendingAtBat) {
              const atBat = {
                ...pendingAtBat,
                resultType,
                outs:
                  resultType === "out" || resultType === "tagOut"
                    ? 1
                    : resultType === "doublePlay"
                    ? 2
                    : resultType === "triplePlay"
                    ? 3
                    : 0,
              };
              saveAtBatWithPending(atBat);
              setPendingAtBat(null);
              setCurrentScreen("pitch");
              resetAtBatInputs();
            }
          }}
          onFinishPlay={handleFinishPlay}
          onNavigateToDefense={() => setCurrentScreen("defense")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onNavigateToResult={() => setCurrentScreen("result")}
        />
      )}
    </div>
  );
};
