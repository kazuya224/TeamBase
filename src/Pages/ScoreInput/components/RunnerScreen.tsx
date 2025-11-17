import React, { useState, useEffect, useMemo } from "react";
import type {
  RunnerInfo,
  Base,
  RunnerAdvance,
  RunnerAdvanceReason,
} from "../../../types/baseball";
import { NavigationButtons } from "./NavigationButtons";
import { RunnerSelection } from "./RunnerScreen/RunnerSelection";
import { ToBaseSelection } from "./RunnerScreen/ToBaseSelection";
import { AdvanceReasonSelection } from "./RunnerScreen/AdvanceReasonSelection";
import { OutcomeSelection } from "./RunnerScreen/OutcomeSelection";
import { AdvanceList } from "./RunnerScreen/AdvanceList";

type RunnerKey = "BR" | "R1" | "R2" | "R3";

type RunnerDecision = {
  fromBase: Base;
  toBase: Base | 4;
  result: "safe" | "out" | "tagOut" | "appeal";
  segmentReasons: Record<number, RunnerAdvanceReason>;
};

interface RunnerScreenProps {
  runners: RunnerInfo[];
  currentBatterName?: string;
  onComplete: (advances: RunnerAdvance[]) => void;
  onNavigateToResult: () => void;
  onNavigateToCutPlay?: () => void;
  onNavigateToRundown?: () => void;
  onNavigateToRunner?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  showNavigationButtons?: boolean;
  onNavigateToCutPlayFromButtons?: () => void;
  onNavigateToRundownFromButtons?: () => void;
  onNavigateToRunnerFromButtons?: () => void;
  onNavigateToResultFromButtons?: () => void;
  pendingAtBat?: {
    runnerAdvances?: RunnerAdvance[];
    battingResult?: string;
  } | null;
  selectedOption?: string | null;
}

export const RunnerScreen: React.FC<RunnerScreenProps> = ({
  runners,
  currentBatterName,
  onComplete,
  onNavigateToResult,
  onNavigateToCutPlay,
  onNavigateToRundown,
  onNavigateToRunner,
  onBack,
  canGoBack,
  showNavigationButtons,
  onNavigateToCutPlayFromButtons,
  onNavigateToRundownFromButtons,
  onNavigateToRunnerFromButtons,
  onNavigateToResultFromButtons,
  pendingAtBat,
  selectedOption,
}) => {
  const [selectedRunnerId, setSelectedRunnerId] = useState<RunnerKey | "">("");
  const [runnerDecisions, setRunnerDecisions] = useState<
    Record<RunnerKey, RunnerDecision | undefined>
  >({} as Record<RunnerKey, RunnerDecision | undefined>);

  // 全ランナーリスト（打者 + 既存走者）
  const allRunners = useMemo(() => {
    const list: Array<{ runnerId: RunnerKey; name: string; fromBase: Base }> =
      [];
    if (currentBatterName) {
      list.push({ runnerId: "BR", name: currentBatterName, fromBase: 0 });
    }
    runners.forEach((runner) => {
      list.push({
        runnerId: runner.runnerId as RunnerKey,
        name: runner.name,
        fromBase: runner.base as Base,
      });
    });
    return list;
  }, [runners, currentBatterName]);

  // 初期進塁理由を取得
  const getInitialReason = (): RunnerAdvanceReason | null => {
    if (pendingAtBat?.battingResult) {
      const result = pendingAtBat.battingResult;
      if (
        result === "single" ||
        result === "double" ||
        result === "triple" ||
        result === "homerun"
      ) {
        return "Hit";
      }
      if (result === "walk") {
        return "BB";
      }
      if (result === "hitByPitch") {
        return "HBP";
      }
      if (result === "sacrificeFly") {
        return "SF";
      }
      if (result === "sacrificeBunt") {
        return "SH";
      }
      if (result === "error") {
        return "E";
      }
      if (result === "fieldersChoice") {
        return "FC";
      }
    }

    if (selectedOption) {
      const optionMap: Record<string, RunnerAdvanceReason> = {
        WP: "WP",
        PB: "PB",
        ボーク: "BK",
        打撃妨害: "BatterInterference",
        守備妨害: "FielderInterference",
        走塁妨害: "RunnerInterference",
      };
      return optionMap[selectedOption] || null;
    }

    return null;
  };

  const initialReason = getInitialReason();

  // 選択中のランナーの情報
  const selectedRunner = useMemo(() => {
    if (!selectedRunnerId) return null;
    return allRunners.find((r) => r.runnerId === selectedRunnerId);
  }, [selectedRunnerId, allRunners]);

  // 選択中のランナーの決定情報
  const currentDecision = useMemo(() => {
    if (!selectedRunnerId) return null;
    return runnerDecisions[selectedRunnerId];
  }, [selectedRunnerId, runnerDecisions]);

  // 選択中のランナーの進塁先（UI表示用）
  const selectedToBase = useMemo(() => {
    return currentDecision?.toBase ?? null;
  }, [currentDecision]);

  // 選択中のランナーの結果（UI表示用）
  const selectedOutcome = useMemo(() => {
    return currentDecision?.result ?? null;
  }, [currentDecision]);

  // 選択中のランナーのセグメント理由（UI表示用）
  const segmentReasons = useMemo(() => {
    return currentDecision?.segmentReasons ?? {};
  }, [currentDecision]);

  // 選択中のランナーのベースセグメント
  const baseSegments = useMemo(() => {
    if (!selectedRunner || selectedToBase === null) return [];
    const fromBase = selectedRunner.fromBase;
    const segments: number[] = [];
    for (let i = fromBase; i < selectedToBase; i++) {
      segments.push(i);
    }
    return segments;
  }, [selectedRunner, selectedToBase]);

  // ランナー選択時に、既存の決定情報を読み込む
  useEffect(() => {
    if (selectedRunnerId && runnerDecisions[selectedRunnerId]) {
      // 既存の決定情報がある場合は何もしない（既に反映されている）
      return;
    }
  }, [selectedRunnerId, runnerDecisions]);

  // 進塁先を選択
  const handleToBaseSelect = (toBase: Base) => {
    if (!selectedRunnerId || !selectedRunner) return;

    const fromBase = selectedRunner.fromBase;
    const segments: number[] = [];
    for (let i = fromBase; i < toBase; i++) {
      segments.push(i);
    }

    // 初期理由がある場合は全セグメントに適用
    const newSegmentReasons: Record<number, RunnerAdvanceReason> = {};
    if (initialReason) {
      segments.forEach((segment) => {
        newSegmentReasons[segment] = initialReason;
      });
    }

    setRunnerDecisions((prev) => ({
      ...prev,
      [selectedRunnerId]: {
        fromBase: selectedRunner.fromBase,
        toBase,
        result: prev[selectedRunnerId]?.result ?? ("safe" as const),
        segmentReasons: prev[selectedRunnerId]?.segmentReasons
          ? { ...prev[selectedRunnerId].segmentReasons, ...newSegmentReasons }
          : newSegmentReasons,
      },
    }));
  };

  // 結果を選択
  const handleOutcomeSelect = (
    outcome: "safe" | "out" | "tagOut" | "appeal"
  ) => {
    if (!selectedRunnerId || !selectedRunner) return;

    setRunnerDecisions((prev) => ({
      ...prev,
      [selectedRunnerId]: {
        fromBase: selectedRunner.fromBase,
        toBase:
          prev[selectedRunnerId]?.toBase ??
          ((selectedRunner.fromBase + 1) as Base),
        result: outcome,
        segmentReasons: prev[selectedRunnerId]?.segmentReasons ?? {},
      },
    }));
  };

  // セグメント理由を変更
  const handleSegmentReasonChange = (
    segment: number,
    reason: RunnerAdvanceReason
  ) => {
    if (!selectedRunnerId) return;

    setRunnerDecisions((prev) => {
      const current = prev[selectedRunnerId];
      if (!current) return prev;

      return {
        ...prev,
        [selectedRunnerId]: {
          ...current,
          segmentReasons: {
            ...current.segmentReasons,
            [segment]: reason,
          },
        },
      };
    });
  };

  // 全員分の入力が完了しているかチェック
  const allCompleted = useMemo(() => {
    return allRunners.every((runner) => {
      const decision = runnerDecisions[runner.runnerId];
      if (!decision) return false;
      if (decision.toBase === undefined) return false;
      if (decision.result === undefined) return false;

      // アピール以外の場合、セグメント理由がすべて設定されている必要がある
      if (decision.result !== "appeal") {
        const fromBase = runner.fromBase;
        const toBase = decision.toBase;
        const segments: number[] = [];
        for (let i = fromBase; i < toBase; i++) {
          segments.push(i);
        }
        return segments.every(
          (segment) => decision.segmentReasons[segment] !== undefined
        );
      }

      return true;
    });
  }, [allRunners, runnerDecisions]);

  // 「進塁を追加」ボタンを押したとき
  const handleComplete = () => {
    if (!allCompleted) return;

    const advances: RunnerAdvance[] = [];

    allRunners.forEach((runner) => {
      const decision = runnerDecisions[runner.runnerId];
      if (!decision) return;

      const fromBase = runner.fromBase;
      const toBase = decision.toBase;

      // アピールアウトの場合
      if (decision.result === "appeal") {
        advances.push({
          runnerId: runner.runnerId,
          fromBase,
          toBase: fromBase,
          reason: "Appeal",
          scored: false,
          out: true,
          outcome: "out",
          runnerName: runner.name,
        });
        return;
      }

      // 通常の進塁の場合
      const segments: number[] = [];
      for (let i = fromBase; i < toBase; i++) {
        segments.push(i);
      }

      const isOut = decision.result === "out" || decision.result === "tagOut";
      let currentBase = fromBase;

      segments.forEach((segment) => {
        const nextBase = (segment + 1) as Base;
        advances.push({
          runnerId: runner.runnerId,
          fromBase: currentBase as Base,
          toBase: nextBase,
          reason: decision.segmentReasons[segment],
          scored: nextBase === 4 && decision.result === "safe",
          out: isOut && nextBase === toBase,
          outcome:
            nextBase === toBase
              ? decision.result === "appeal"
                ? "out"
                : (decision.result as "safe" | "out" | "tagOut")
              : undefined,
          runnerName: runner.name,
        });
        currentBase = nextBase;
      });
    });

    onComplete(advances);
  };

  // 表示用の進塁リスト（全ランナーの決定を表示）
  const displayAdvances = useMemo(() => {
    const advances: RunnerAdvance[] = [];

    allRunners.forEach((runner) => {
      const decision = runnerDecisions[runner.runnerId];
      if (!decision) return;

      const fromBase = runner.fromBase;
      const toBase = decision.toBase;

      if (decision.result === "appeal") {
        advances.push({
          runnerId: runner.runnerId,
          fromBase,
          toBase: fromBase,
          reason: "Appeal",
          scored: false,
          out: true,
          outcome: "out",
          runnerName: runner.name,
        });
        return;
      }

      const segments: number[] = [];
      for (let i = fromBase; i < toBase; i++) {
        segments.push(i);
      }

      const isOut = decision.result === "out" || decision.result === "tagOut";
      let currentBase = fromBase;

      segments.forEach((segment) => {
        const nextBase = (segment + 1) as Base;
        advances.push({
          runnerId: runner.runnerId,
          fromBase: currentBase as Base,
          toBase: nextBase,
          reason: decision.segmentReasons[segment],
          scored: nextBase === 4 && decision.result === "safe",
          out: isOut && nextBase === toBase,
          outcome:
            nextBase === toBase
              ? decision.result === "appeal"
                ? "out"
                : (decision.result as "safe" | "out" | "tagOut")
              : undefined,
          runnerName: runner.name,
        });
        currentBase = nextBase;
      });
    });

    return advances;
  }, [allRunners, runnerDecisions]);

  // 進塁を削除（ランナーごとの決定を削除）
  const handleRemoveAdvance = (runnerId: RunnerKey) => {
    setRunnerDecisions((prev) => {
      const newDecisions = { ...prev };
      delete newDecisions[runnerId];
      return newDecisions;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-300">走者進塁</h3>
        {canGoBack && onBack && (
          <button
            onClick={onBack}
            className="px-3 py-1 bg-gray-700 rounded-lg font-bold text-xs hover:bg-gray-600"
          >
            ← 戻る
          </button>
        )}
      </div>

      <RunnerSelection
        runners={runners}
        currentBatterName={currentBatterName}
        selectedRunner={selectedRunnerId}
        onRunnerSelect={(id) => setSelectedRunnerId(id as RunnerKey)}
      />

      {selectedRunner && (
        <>
          <ToBaseSelection
            selectedRunner={selectedRunnerId}
            selectedToBase={selectedToBase}
            onToBaseSelect={handleToBaseSelect}
          />

          <AdvanceReasonSelection
            selectedRunner={selectedRunnerId}
            selectedToBase={selectedToBase}
            baseSegments={baseSegments}
            segmentReasons={segmentReasons}
            onSegmentReasonChange={handleSegmentReasonChange}
          />

          <OutcomeSelection
            selectedRunner={selectedRunnerId}
            selectedToBase={selectedToBase}
            baseSegments={baseSegments}
            segmentReasons={segmentReasons}
            selectedOutcome={selectedOutcome}
            onOutcomeSelect={handleOutcomeSelect}
            onAddAdvance={() => {
              // このボタンは使わない（全員分の入力が終わったら「進塁を追加」ボタンを表示）
            }}
          />
        </>
      )}

      {/* 全ランナーの決定を表示 */}
      {displayAdvances.length > 0 && (
        <div className="mb-3 p-2 bg-gray-800 rounded">
          <div className="text-xs text-gray-400 mb-1">選択された進塁</div>
          {allRunners
            .filter((runner) => runnerDecisions[runner.runnerId])
            .map((runner) => {
              const decision = runnerDecisions[runner.runnerId]!;
              const fromBaseLabel =
                runner.fromBase === 0
                  ? "打席"
                  : runner.fromBase === 4
                  ? "本塁"
                  : `${runner.fromBase}塁`;
              const toBaseLabel =
                decision.toBase === 4 ? "本塁" : `${decision.toBase}塁`;
              const outcomeLabel =
                decision.result === "safe"
                  ? "セーフ"
                  : decision.result === "out"
                  ? "アウト"
                  : decision.result === "tagOut"
                  ? "タッチアウト"
                  : "アピール";

              return (
                <div
                  key={runner.runnerId}
                  className="flex items-center justify-between mb-2 p-2 bg-gray-700 rounded"
                >
                  <div className="flex-1">
                    <div className="text-xs">
                      {runner.name}: {fromBaseLabel} → {toBaseLabel} -{" "}
                      {outcomeLabel}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveAdvance(runner.runnerId)}
                    className="text-xs text-red-400 underline ml-2"
                  >
                    削除
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* 全員分の入力が終わったら「進塁を追加」ボタンを表示 */}
      {allRunners.length > 0 && (
        <button
          onClick={handleComplete}
          disabled={!allCompleted}
          className={`w-full py-3 rounded-lg font-bold text-sm ${
            allCompleted
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-700 opacity-50 cursor-not-allowed"
          }`}
        >
          進塁を追加
        </button>
      )}

      {/* 進塁が追加されていない場合のみナビゲーションボタンを表示 */}
      {!showNavigationButtons && displayAdvances.length === 0 && (
        <NavigationButtons
          onNavigateToCutPlay={onNavigateToCutPlay}
          onNavigateToRundown={onNavigateToRundown}
          onNavigateToRunner={onNavigateToRunner}
          onNavigateToResult={onNavigateToResult}
        />
      )}
      {showNavigationButtons && displayAdvances.length === 0 && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <h4 className="text-xs text-gray-400 mb-2">処理順選択</h4>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={onNavigateToCutPlayFromButtons}
              className="py-2 bg-blue-600 rounded-lg font-bold text-xs"
            >
              カット
            </button>
            <button
              onClick={onNavigateToRundownFromButtons}
              className="py-2 bg-orange-600 rounded-lg font-bold text-xs"
            >
              挟殺
            </button>
            <button
              onClick={onNavigateToRunnerFromButtons}
              className="py-2 bg-green-600 rounded-lg font-bold text-xs"
            >
              走者
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
