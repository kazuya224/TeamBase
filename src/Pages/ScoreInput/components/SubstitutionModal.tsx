import React, { useState, useEffect } from "react";
import type { SubstitutionType, Base, Position } from "../../../types/baseball";
import type { SubstitutionModalProps } from "./SubstitutionModal/types";
import { getInitialTeam } from "./SubstitutionModal/utils";
import { useTeamData } from "./SubstitutionModal/hooks";
import { TeamSelection } from "./SubstitutionModal/TeamSelection";
import { SubstitutionTypeSelection } from "./SubstitutionModal/SubstitutionTypeSelection";
import { BatterSubstitutionForm } from "./SubstitutionModal/BatterSubstitutionForm";
import { RunnerSubstitutionForm } from "./SubstitutionModal/RunnerSubstitutionForm";
import { DefenseSubstitutionForm } from "./SubstitutionModal/DefenseSubstitutionForm";
import { DefenseSwapForm } from "./SubstitutionModal/DefenseSwapForm";
import { NewPlayerSelection } from "./SubstitutionModal/NewPlayerSelection";

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  gameMeta,
  currentInning, // 使っていないが、将来の拡張用に残しておく
  currentTopBottom,
  currentBatterIndex,
  runners,
}) => {
  const [team, setTeam] = useState<"home" | "away">(
    getInitialTeam(currentTopBottom)
  );
  const [type, setType] = useState<SubstitutionType>("batter");
  const [originalPlayerId, setOriginalPlayerId] = useState<string>("");
  const [newPlayerId, setNewPlayerId] = useState<string>("");
  const [battingOrder, setBattingOrder] = useState<number>(
    currentBatterIndex + 1
  );
  const [base, setBase] = useState<Base | undefined>(undefined);
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [swapFromPosition, setSwapFromPosition] = useState<
    Position | undefined
  >(undefined);
  const [swapToPosition, setSwapToPosition] = useState<Position | undefined>(
    undefined
  );

  const { lineupPlayers, benchPlayers, runnerList, defensePlayers } =
    useTeamData({ team, gameMeta, runners });

  // 種類変更時の共通リセット
  const resetCommonState = () => {
    setOriginalPlayerId("");
    setNewPlayerId("");
    setBase(undefined);
    setPosition(undefined);
    setSwapFromPosition(undefined);
    setSwapToPosition(undefined);
  };

  const handleTypeChange = (nextType: SubstitutionType) => {
    setType(nextType);
    resetCommonState();

    if (nextType === "batter") {
      // 打者交代は現在の打順を初期値に
      const initialOrder = currentBatterIndex + 1;
      const order = initialOrder <= lineupPlayers.length ? initialOrder : 1; // 念のため範囲ガード
      setBattingOrder(order);
      setOriginalPlayerId(lineupPlayers[order - 1]?.id || "");
    } else if (nextType === "runner") {
      // base は押されたときにセットするのでここでは何もしない
      setBattingOrder(0);
    } else if (nextType === "defense") {
      setBattingOrder(0);
    } else if (nextType === "defenseSwap") {
      setBattingOrder(0);
    }
  };

  // チーム切り替え時は、今の type を維持しつつフィールドだけリセット
  useEffect(() => {
    if (!isOpen) return;

    resetCommonState();

    if (type === "batter") {
      const initialOrder = currentBatterIndex + 1;
      const order = initialOrder <= lineupPlayers.length ? initialOrder : 1;
      setBattingOrder(order);
      setOriginalPlayerId(lineupPlayers[order - 1]?.id || "");
    } else {
      setBattingOrder(0);
    }
  }, [team, type, isOpen, currentBatterIndex, lineupPlayers]);

  // モーダルが開くたびに初期状態に戻す
  useEffect(() => {
    if (!isOpen) return;

    const initialTeam = getInitialTeam(currentTopBottom);
    setTeam(initialTeam);
    setType("batter");
    resetCommonState();

    const initialOrder = currentBatterIndex + 1;
    const order = initialOrder <= lineupPlayers.length ? initialOrder : 1;
    setBattingOrder(order);
    setOriginalPlayerId(lineupPlayers[order - 1]?.id || "");
  }, [isOpen, currentTopBottom, currentBatterIndex]);

  const handleConfirm = () => {
    if (type === "batter") {
      if (!battingOrder) {
        alert("打順を選択してください");
        return;
      }
      if (!originalPlayerId && !newPlayerId) {
        alert("交代前または交代後の選手を選択してください");
        return;
      }
    } else if (type === "runner") {
      if (!base) {
        alert("塁を選択してください");
        return;
      }
      if (!originalPlayerId && !newPlayerId) {
        alert("交代前または交代後の選手を選択してください");
        return;
      }
    } else if (type === "defense") {
      if (!position) {
        alert("守備位置を選択してください");
        return;
      }
      if (!newPlayerId) {
        alert("交代後の選手を選択してください");
        return;
      }
    } else if (type === "defenseSwap") {
      if (!swapFromPosition || !swapToPosition) {
        alert("入れ替える2つの守備位置を選択してください");
        return;
      }
      if (swapFromPosition === swapToPosition) {
        alert("異なる2つの守備位置を選択してください");
        return;
      }
    }

    onConfirm({
      team,
      type,
      originalPlayerId: originalPlayerId || "",
      newPlayerId: newPlayerId || "",
      battingOrder: type === "batter" ? battingOrder : undefined,
      base: type === "runner" ? base : undefined,
      position: type === "defense" ? position : undefined,
      fromPosition: type === "defenseSwap" ? swapFromPosition : undefined,
      toPosition: type === "defenseSwap" ? swapToPosition : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">選手交代</h2>

        <TeamSelection team={team} onTeamChange={setTeam} gameMeta={gameMeta} />

        <SubstitutionTypeSelection
          type={type}
          onTypeChange={handleTypeChange}
        />

        {type === "batter" && (
          <BatterSubstitutionForm
            battingOrder={battingOrder}
            lineupPlayers={lineupPlayers}
            onBattingOrderChange={(order, playerId) => {
              setBattingOrder(order);
              setOriginalPlayerId(playerId);
            }}
          />
        )}

        {type === "runner" && (
          <RunnerSubstitutionForm
            base={base}
            runnerList={runnerList}
            onBaseChange={(selectedBase, playerId) => {
              setBase(selectedBase);
              setOriginalPlayerId(playerId);
            }}
          />
        )}

        {type === "defense" && (
          <DefenseSubstitutionForm
            position={position}
            defensePlayers={defensePlayers}
            onPositionChange={(selectedPosition, playerId) => {
              setPosition(selectedPosition);
              setOriginalPlayerId(playerId);
            }}
          />
        )}

        {type === "defenseSwap" && (
          <DefenseSwapForm
            swapFromPosition={swapFromPosition}
            swapToPosition={swapToPosition}
            defensePlayers={defensePlayers}
            onSwapFromPositionChange={setSwapFromPosition}
            onSwapToPositionChange={setSwapToPosition}
          />
        )}

        {type !== "defenseSwap" && (
          <NewPlayerSelection
            newPlayerId={newPlayerId}
            benchPlayers={benchPlayers}
            onNewPlayerChange={setNewPlayerId}
          />
        )}

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
          >
            交代実行
          </button>
        </div>
      </div>
    </div>
  );
};
