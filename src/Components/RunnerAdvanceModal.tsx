import React, { useState } from "react";
import { RunnerAdvance, Base } from "../types";

interface RunnerAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (advances: RunnerAdvance[]) => void;
  currentRunners: { base: 1 | 2 | 3; name: string }[]; // 現在の走者情報
  lineup: string[]; // 打順リスト
  currentBatterName?: string; // 現在の打者名
}

const RunnerAdvanceModal: React.FC<RunnerAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentRunners,
  lineup,
  currentBatterName = "",
}) => {
  const [advances, setAdvances] = useState<RunnerAdvance[]>([]);

  const baseLabels: Record<Base, string> = {
    0: "本塁",
    1: "一塁",
    2: "二塁",
    3: "三塁",
  };

  const handleRunnerChange = (
    fromBase: Base,
    field: keyof RunnerAdvance,
    value: any
  ) => {
    setAdvances((prev) => {
      const existing = prev.find((a) => a.fromBase === fromBase);
      if (existing) {
        return prev.map((a) =>
          a.fromBase === fromBase ? { ...a, [field]: value } : a
        );
      } else {
        return [
          ...prev,
          {
            fromBase,
            toBase: fromBase,
            scored: false,
            out: false,
            runnerName: "",
            [field]: value,
          },
        ];
      }
    });
  };

  const handleSave = () => {
    onSave(advances);
    setAdvances([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">走者進塁設定</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {currentRunners.map((runner) => (
              <div key={runner.base} className="border p-4 rounded-lg">
                <h3 className="font-bold mb-2">
                  {baseLabels[runner.base]}の走者: {runner.name}
                </h3>

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      進塁先
                    </label>
                    <select
                      value={
                        advances.find((a) => a.fromBase === runner.base)
                          ?.toBase ?? runner.base
                      }
                      onChange={(e) =>
                        handleRunnerChange(
                          runner.base,
                          "toBase",
                          Number(e.target.value) as Base
                        )
                      }
                      className="w-full p-2 border rounded"
                    >
                      {([0, 1, 2, 3] as Base[]).map((base) => (
                        <option key={base} value={base}>
                          {baseLabels[base]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          advances.find((a) => a.fromBase === runner.base)
                            ?.scored ?? false
                        }
                        onChange={(e) =>
                          handleRunnerChange(
                            runner.base,
                            "scored",
                            e.target.checked
                          )
                        }
                        className="mr-2"
                      />
                      得点
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          advances.find((a) => a.fromBase === runner.base)
                            ?.out ?? false
                        }
                        onChange={(e) =>
                          handleRunnerChange(
                            runner.base,
                            "out",
                            e.target.checked
                          )
                        }
                        className="mr-2"
                      />
                      アウト
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {/* 打者の進塁を設定 */}
            {currentRunners.length === 0 && (
              <div className="border p-4 rounded-lg">
                <h3 className="font-bold mb-2">打者の進塁</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      進塁先
                    </label>
                    <select
                      value={
                        advances.find((a) => a.fromBase === 0)?.toBase ?? 1
                      }
                      onChange={(e) => {
                        const toBase = Number(e.target.value) as Base;
                        const existing = advances.find((a) => a.fromBase === 0);
                        if (existing) {
                          setAdvances(
                            advances.map((a) =>
                              a.fromBase === 0 ? { ...a, toBase } : a
                            )
                          );
                        } else {
                          setAdvances([
                            ...advances,
                            {
                              fromBase: 0,
                              toBase,
                              scored: false,
                              out: false,
                              runnerName: currentBatterName,
                            },
                          ]);
                        }
                      }}
                      className="w-full p-2 border rounded"
                    >
                      {([0, 1, 2, 3] as Base[]).map((base) => (
                        <option key={base} value={base}>
                          {baseLabels[base]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          advances.find((a) => a.fromBase === 0)?.scored ??
                          false
                        }
                        onChange={(e) => {
                          const existing = advances.find(
                            (a) => a.fromBase === 0
                          );
                          if (existing) {
                            setAdvances(
                              advances.map((a) =>
                                a.fromBase === 0
                                  ? { ...a, scored: e.target.checked }
                                  : a
                              )
                            );
                          } else {
                            setAdvances([
                              ...advances,
                              {
                                fromBase: 0,
                                toBase: 1,
                                scored: e.target.checked,
                                out: false,
                                runnerName: currentBatterName,
                              },
                            ]);
                          }
                        }}
                        className="mr-2"
                      />
                      得点
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerAdvanceModal;
