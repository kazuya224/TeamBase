import React, { useEffect } from "react";
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
    | "runner"
    | "cutPlay"
    | "rundown"
    | "result"
    | "buntType";
  setCurrentScreen: (
    screen:
      | "pitch"
      | "batting"
      | "runner"
      | "cutPlay"
      | "rundown"
      | "result"
      | "buntType"
  ) => void;
  onBack?: () => void;
  canGoBack?: boolean;
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
  onBack,
  canGoBack,
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
  const [showNavigationButtons, setShowNavigationButtons] =
    React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(
    null
  );

  // 画面が変わったときにナビゲーションボタンをリセット（ただし、特定の画面では保持）
  useEffect(() => {
    if (
      currentScreen === "cutPlay" ||
      currentScreen === "rundown" ||
      currentScreen === "runner" ||
      currentScreen === "result"
    ) {
      // これらの画面ではボタンを表示し続ける
      return;
    }
    // それ以外の画面に戻ったらリセット
    if (currentScreen === "pitch" || currentScreen === "batting") {
      setShowNavigationButtons(false);
      setSelectedOption(null);
    }
  }, [currentScreen]);

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
                onClick={() => {
                  setShowNavigationButtons(true);
                  setSelectedOption("WP");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "WP"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
              >
                WP
              </button>
              <button
                onClick={() => {
                  setShowNavigationButtons(true);
                  setSelectedOption("PB");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "PB"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
              >
                PB
              </button>
              <button
                onClick={() => {
                  setShowNavigationButtons(true);
                  setSelectedOption("ボーク");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "ボーク"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
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
                  setSelectedOption("申告敬遠");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "申告敬遠"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
              >
                申告敬遠
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
                    });
                  }
                  setCurrentScreen("runner");
                  setShowNavigationButtons(true);
                  setSelectedOption("打撃妨害");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "打撃妨害"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
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
                  setShowNavigationButtons(true);
                  setSelectedOption("守備妨害");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "守備妨害"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
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
                  setShowNavigationButtons(true);
                  setSelectedOption("走塁妨害");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "走塁妨害"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
              >
                走塁妨害
              </button>
              <button
                onClick={() => {
                  setShowNavigationButtons(true);
                  setSelectedOption("牽制");
                }}
                className={`py-2 rounded-lg font-bold text-xs ${
                  selectedOption === "牽制"
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : "bg-gray-700"
                }`}
              >
                牽制
              </button>
            </div>
            {showNavigationButtons && (
              <div className="mt-3 border-t border-gray-700 pt-3">
                <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setCurrentScreen("cutPlay")}
                    className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
                  >
                    カット
                  </button>
                  <button
                    onClick={() => setCurrentScreen("rundown")}
                    className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                  >
                    挟殺
                  </button>
                  <button
                    onClick={() => setCurrentScreen("runner")}
                    className="py-2 bg-green-600 rounded-lg font-bold text-xs"
                  >
                    走者
                  </button>
                  {/* <button
                    onClick={() => setCurrentScreen("result")}
                    className="py-2 bg-red-600 rounded-lg font-bold text-xs"
                  >
                    結果
                  </button> */}
                </div>
              </div>
            )}
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
          onNext={() => setCurrentScreen("runner")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onNavigateToResult={() => setCurrentScreen("result")}
          onBattingResultSelect={handleBattingResultSelect}
          onFinishPlay={handleFinishPlay}
          onBack={onBack}
          canGoBack={canGoBack}
        />
      )}

      {inputStep === "buntType" && (
        <BuntTypeSelection
          onSelectBuntType={(type) => {
            onSetBuntType(type);
            onSetInputStep("batted");
          }}
          onBack={onBack}
          canGoBack={canGoBack}
        />
      )}

      {currentScreen === "cutPlay" && (
        <>
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
            onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
            onNavigateToRundown={() => setCurrentScreen("rundown")}
            onNavigateToRunner={() => setCurrentScreen("runner")}
            onBack={onBack}
            canGoBack={canGoBack}
          />
          {showNavigationButtons && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setCurrentScreen("cutPlay")}
                  className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
                >
                  カット
                </button>
                <button
                  onClick={() => setCurrentScreen("rundown")}
                  className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                >
                  挟殺
                </button>
                <button
                  onClick={() => setCurrentScreen("runner")}
                  className="py-2 bg-green-600 rounded-lg font-bold text-xs"
                >
                  走者
                </button>
                {/* <button
                  onClick={() => setCurrentScreen("result")}
                  className="py-2 bg-red-600 rounded-lg font-bold text-xs"
                >
                  結果
                </button> */}
              </div>
            </div>
          )}
        </>
      )}

      {currentScreen === "rundown" && (
        <>
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
            onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
            onNavigateToRundown={() => setCurrentScreen("rundown")}
            onNavigateToRunner={() => setCurrentScreen("runner")}
            onBack={onBack}
            canGoBack={canGoBack}
          />
          {showNavigationButtons && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setCurrentScreen("cutPlay")}
                  className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
                >
                  カット
                </button>
                <button
                  onClick={() => setCurrentScreen("rundown")}
                  className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                >
                  挟殺
                </button>
                <button
                  onClick={() => setCurrentScreen("runner")}
                  className="py-2 bg-green-600 rounded-lg font-bold text-xs"
                >
                  走者
                </button>
                {/* <button
                  onClick={() => setCurrentScreen("result")}
                  className="py-2 bg-red-600 rounded-lg font-bold text-xs"
                >
                  結果
                </button> */}
              </div>
            </div>
          )}
        </>
      )}

      {currentScreen === "runner" && (
        <RunnerScreen
          runners={runners}
          currentBatterName={
            pendingAtBat?.batterName || lineup[currentBatterIndex]
          }
          onComplete={handleSaveRunnerAdvances}
          onNavigateToResult={() => setCurrentScreen("result")}
          onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
          onNavigateToRundown={() => setCurrentScreen("rundown")}
          onNavigateToRunner={() => setCurrentScreen("runner")}
          onBack={onBack}
          canGoBack={canGoBack}
          showNavigationButtons={showNavigationButtons}
          onNavigateToCutPlayFromButtons={() => setCurrentScreen("cutPlay")}
          onNavigateToRundownFromButtons={() => setCurrentScreen("rundown")}
          onNavigateToRunnerFromButtons={() => setCurrentScreen("runner")}
          onNavigateToResultFromButtons={() => setCurrentScreen("result")}
        />
      )}

      {currentScreen === "result" && (
        <>
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
            onNavigateToCutPlay={() => setCurrentScreen("cutPlay")}
            onNavigateToRundown={() => setCurrentScreen("rundown")}
            onNavigateToRunner={() => setCurrentScreen("runner")}
            onNavigateToResult={() => setCurrentScreen("result")}
            onBack={onBack}
            canGoBack={canGoBack}
          />
          {showNavigationButtons && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setCurrentScreen("cutPlay")}
                  className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
                >
                  カット
                </button>
                <button
                  onClick={() => setCurrentScreen("rundown")}
                  className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
                >
                  挟殺
                </button>
                <button
                  onClick={() => setCurrentScreen("runner")}
                  className="py-2 bg-green-600 rounded-lg font-bold text-xs"
                >
                  走者
                </button>
                {/* <button
                  onClick={() => setCurrentScreen("result")}
                  className="py-2 bg-red-600 rounded-lg font-bold text-xs"
                >
                  結果
                </button> */}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
