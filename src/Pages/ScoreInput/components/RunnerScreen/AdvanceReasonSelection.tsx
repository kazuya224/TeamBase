import React from "react";
import type { RunnerAdvanceReason } from "../../../../types/baseball";
import { ADVANCE_REASONS } from "./advanceReasons";
import { getBaseLabel } from "./utils";

interface AdvanceReasonSelectionProps {
  selectedRunner: string | "BR" | "";
  selectedToBase: number | null;
  baseSegments: number[];
  segmentReasons: Record<number, RunnerAdvanceReason>;
  onSegmentReasonChange: (segment: number, reason: RunnerAdvanceReason) => void;
}

export const AdvanceReasonSelection: React.FC<AdvanceReasonSelectionProps> = ({
  selectedRunner,
  selectedToBase,
  baseSegments,
  segmentReasons,
  onSegmentReasonChange,
}) => {
  if (!selectedRunner || selectedToBase === null || baseSegments.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="text-xs text-gray-400 mb-2">各塁間の進塁理由を選択</div>
      {baseSegments.map((segment) => (
        <div key={segment} className="mb-2">
          <div className="text-xs text-gray-500 mb-1">
            {getBaseLabel(segment)} → {getBaseLabel(segment + 1)}間
          </div>
          <select
            value={segmentReasons[segment] || ""}
            onChange={(e) =>
              onSegmentReasonChange(
                segment,
                e.target.value as RunnerAdvanceReason
              )
            }
            className="w-full py-2 px-3 bg-gray-700 rounded-lg text-white text-sm"
          >
            <option value="">選択してください</option>
            {ADVANCE_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};
