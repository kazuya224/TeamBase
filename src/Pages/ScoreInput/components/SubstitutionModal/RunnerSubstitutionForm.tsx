import React from "react";
import type { Base } from "../../../../types/baseball";

interface Runner {
  id: string;
  name: string;
  base: Base;
  runnerId: string;
}

interface RunnerSubstitutionFormProps {
  base: Base | undefined;
  runnerList: Runner[];
  onBaseChange: (base: Base, runnerId: string) => void;
}

export const RunnerSubstitutionForm: React.FC<
  RunnerSubstitutionFormProps
> = ({ base, runnerList, onBaseChange }) => {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          塁
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((b) => (
            <button
              key={b}
              onClick={() => {
                const selectedBase = b as Base;
                const runner = runnerList.find((r) => r.base === selectedBase);
                onBaseChange(selectedBase, runner?.id || "");
              }}
              className={`py-2 rounded-lg font-bold text-sm ${
                base === b ? "bg-yellow-600" : "bg-gray-700"
              }`}
            >
              {b}塁
            </button>
          ))}
        </div>
      </div>
      {base && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            交代前の走者
          </label>
          <div className="px-3 py-2 bg-gray-700 text-white rounded-lg">
            {runnerList.find((r) => r.base === base)?.name || "走者なし"}
          </div>
        </div>
      )}
    </>
  );
};

