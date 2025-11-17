import React, { useEffect, useState } from "react";
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
import { PitchScreen } from "./PitchScreen";
import { NavigationButtons } from "./NavigationButtons";

type Screen =
  | "pitch"
  | "batting"
  | "runner"
  | "cutPlay"
  | "rundown"
  | "result"
  | "buntType";

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
  onCompleteAtBat: (result: BattingResult) => void; // 今は使っていないが、API互換のため残す
  onOpenRunnerModal: (
    actionType: "stolenBase" | "pickoff" | "wildPitch" | "passedBall" | "balk"
  ) => void; // 同上
  currentScreen: Screen;
  setCurrentScreen: (screen: Screen) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  pendingAtBat: AtBat | null;
  setPendingAtBat: React.Dispatch<React.SetStateAction<AtBat | null>>;
  saveAtBatWithPending: (atBat: AtBat, shouldAdvanceBatter?: boolean) => void;
  checkInfieldFlyCondition: () => boolean; // 同上
  lineup: string[];
  currentBatterIndex: number;
  handleSaveRunnerAdvances: (advances: RunnerAdvance[]) => void;
  resetAtBatInputs: () => void;
  handleBattingResultSelect: (result: BattingResult) => void;
  handleFinishPlay: () => void;
  currentOuts: number; // 同上
  calculateForcedAdvances: (batterToBase: Base) => RunnerAdvance[];
  onGameEnd?: () => void;
  onOpenSubstitutionModal?: () => void;
}

const isNavigationScreen = (screen: Screen) =>
  screen === "cutPlay" ||
  screen === "rundown" ||
  screen === "runner" ||
  screen === "result";

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
  onCompleteAtBat, // 使っていないが props として受け取っておく
  onOpenRunnerModal, // 同上
  currentScreen,
  setCurrentScreen,
  onBack,
  canGoBack,
  pendingAtBat,
  setPendingAtBat,
  saveAtBatWithPending,
  checkInfieldFlyCondition, // 同上
  lineup,
  currentBatterIndex,
  handleSaveRunnerAdvances,
  resetAtBatInputs,
  handleBattingResultSelect,
  handleFinishPlay,
  calculateForcedAdvances,
  onGameEnd,
  onOpenSubstitutionModal,
}) => {
  const [showNavigationButtons, setShowNavigationButtons] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const currentBatterName =
    pendingAtBat?.batterName || lineup[currentBatterIndex];

  // 画面が変わったときにナビゲーションボタンをリセット
  useEffect(() => {
    if (isNavigationScreen(currentScreen)) {
      // カット/挟殺/走者/結果ではボタンを維持
      return;
    }

    // 投球・打球入力画面に戻ったらリセット
    if (currentScreen === "pitch" || currentScreen === "batting") {
      setShowNavigationButtons(false);
      setSelectedOption(null);
      setShowOptions(false);
    }
  }, [currentScreen]);

  const showPitchScreen =
    inputStep === "pitch" && !isNavigationScreen(currentScreen);

  return (
    <div className="bg-gray-900 px-2 py-2 border-t border-gray-700 flex-1 overflow-y-auto">
      {showPitchScreen && (
        <PitchScreen
          currentAtBat={currentAtBat}
          lineup={lineup}
          currentBatterIndex={currentBatterIndex}
          pendingAtBat={pendingAtBat}
          setPendingAtBat={setPendingAtBat}
          onPitchResult={onPitchResult}
          setCurrentScreen={setCurrentScreen}
          saveAtBatWithPending={saveAtBatWithPending}
          resetAtBatInputs={resetAtBatInputs}
          calculateForcedAdvances={calculateForcedAdvances}
          showNavigationButtons={showNavigationButtons}
          setShowNavigationButtons={setShowNavigationButtons}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          onGameEnd={onGameEnd}
          onOpenSubstitutionModal={onOpenSubstitutionModal}
        />
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
            <NavigationButtons setCurrentScreen={setCurrentScreen} />
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
            <NavigationButtons setCurrentScreen={setCurrentScreen} />
          )}
        </>
      )}

      {currentScreen === "runner" && (
        <RunnerScreen
          runners={runners}
          currentBatterName={currentBatterName}
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
          pendingAtBat={
            pendingAtBat
              ? {
                  runnerAdvances: pendingAtBat.runnerAdvances,
                  battingResult: pendingAtBat.battingResult,
                }
              : null
          }
          selectedOption={selectedOption}
        />
      )}

      {currentScreen === "result" && (
        <>
          <ResultScreen
            runners={runners}
            currentBatterName={currentBatterName}
            onConfirm={(resultType) => {
              if (pendingAtBat) {
                const outs =
                  resultType === "out" || resultType === "tagOut"
                    ? 1
                    : resultType === "doublePlay"
                    ? 2
                    : resultType === "triplePlay"
                    ? 3
                    : 0;

                const atBat: AtBat = {
                  ...pendingAtBat,
                  resultType,
                  outs,
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
            <NavigationButtons setCurrentScreen={setCurrentScreen} />
          )}
        </>
      )}
    </div>
  );
};
