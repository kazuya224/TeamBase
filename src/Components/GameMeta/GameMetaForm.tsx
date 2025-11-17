import React, { useState, useEffect, useCallback } from "react";
import type {
  GameMeta,
  GameInfo,
  TeamMeta,
  LineupEntry,
  Player,
  Position,
} from "../../types/gameMeta";
import { MAX_BATTERS } from "../../types/gameMeta";

type GameMetaFormProps = {
  initialValue?: GameMeta; // 初期値（未指定ならデフォルト生成）
  onChange?: (value: GameMeta) => void; // 入力が変わるたび発火（オートセーブ用）
  onSubmit?: (value: GameMeta) => void; // 「保存」時に発火
};

const WEATHER_OPTIONS = [
  { value: "晴れ", label: "晴れ" },
  { value: "曇り", label: "曇り" },
  { value: "雨", label: "雨" },
  { value: "小雨", label: "小雨" },
  { value: "風強", label: "風強" },
];

const GROUND_CONDITION_OPTIONS = [
  { value: "良", label: "良" },
  { value: "やや不良", label: "やや不良" },
  { value: "不良", label: "不良" },
];

const POSITION_OPTIONS: { value: Position; label: string }[] = [
  { value: "P", label: "投手" },
  { value: "C", label: "捕手" },
  { value: "1B", label: "一塁" },
  { value: "2B", label: "二塁" },
  { value: "3B", label: "三塁" },
  { value: "SS", label: "遊撃" },
  { value: "LF", label: "左翼" },
  { value: "CF", label: "中堅" },
  { value: "RF", label: "右翼" },
  { value: "DH", label: "DH" },
];

export const GameMetaForm: React.FC<GameMetaFormProps> = ({
  initialValue,
  onChange,
  onSubmit,
}) => {
  const [value, setValue] = useState<GameMeta>(() => {
    if (initialValue) {
      return initialValue;
    }
    // デフォルト生成
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const generatePlayerId = (prefix: string, index: number) =>
      `${prefix}-player-${index}`;

    const createDefaultLineup = (teamPrefix: string): LineupEntry[] => {
      // 一般的な守備位置の順序
      const defaultPositions: Position[] = [
        "P",
        "C",
        "1B",
        "2B",
        "3B",
        "SS",
        "LF",
        "CF",
        "RF",
      ];
      return Array.from({ length: 9 }, (_, i) => ({
        battingOrder: i + 1,
        playerId: generatePlayerId(teamPrefix, i + 1),
        position: defaultPositions[i] || ("DH" as Position),
      }));
    };

    return {
      gameInfo: {
        date: today,
        startTime: startTime,
        endTime: startTime,
        ballpark: "",
        competitionName: "",
        weather: "晴れ",
        groundCondition: "良",
        umpirePlate: "",
        umpireBase1: "",
        umpireBase2: "",
        umpireBase3: "",
        scorerName: "",
      },
      homeTeam: {
        name: "",
        shortName: "",
        isHome: true,
        managerName: "",
        coachName: "",
        lineup: createDefaultLineup("home"),
        benchPlayers: [],
      },
      awayTeam: {
        name: "",
        shortName: "",
        isHome: false,
        managerName: "",
        coachName: "",
        lineup: createDefaultLineup("away"),
        benchPlayers: [],
      },
    };
  });

  // 初期値が変更された場合の更新
  useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  // 値が変更されたときにonChangeを呼び出す
  const updateValue = useCallback(
    (updater: (prev: GameMeta) => GameMeta) => {
      setValue((prev) => {
        const next = updater(prev);
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  // GameInfo更新ヘルパー
  const updateGameInfo = useCallback(
    (updates: Partial<GameInfo>) => {
      updateValue((prev) => ({
        ...prev,
        gameInfo: { ...prev.gameInfo, ...updates },
      }));
    },
    [updateValue]
  );

  // TeamMeta更新ヘルパー
  const updateTeamMeta = useCallback(
    (teamKey: "homeTeam" | "awayTeam", updates: Partial<TeamMeta>) => {
      updateValue((prev) => ({
        ...prev,
        [teamKey]: { ...prev[teamKey], ...updates },
      }));
    },
    [updateValue]
  );

  // LineupEntry更新ヘルパー
  const updateLineupEntry = useCallback(
    (
      teamKey: "homeTeam" | "awayTeam",
      battingOrder: number,
      updates: Partial<LineupEntry>
    ) => {
      updateValue((prev) => {
        const team = prev[teamKey];
        const newLineup = team.lineup.map((entry) =>
          entry.battingOrder === battingOrder ? { ...entry, ...updates } : entry
        );
        return {
          ...prev,
          [teamKey]: { ...team, lineup: newLineup },
        };
      });
    },
    [updateValue]
  );

  // 選手情報を更新（スタメン用）
  const updatePlayerInLineup = useCallback(
    (
      teamKey: "homeTeam" | "awayTeam",
      battingOrder: number,
      playerUpdates: Partial<Player>
    ) => {
      updateValue((prev) => {
        const team = prev[teamKey];
        const entry = team.lineup.find((e) => e.battingOrder === battingOrder);
        if (!entry) return prev;

        // 既存の選手を探すか、新規作成
        const allPlayers = [
          ...team.lineup.map((e) => {
            // 簡易的に、playerIdから選手情報を取得する想定
            // 実際には別途選手マスタが必要な場合がある
            return { id: e.playerId, name: "", number: "" };
          }),
          ...team.benchPlayers,
        ];

        let player = allPlayers.find((p) => p.id === entry.playerId);
        if (!player) {
          player = { id: entry.playerId, name: "", number: "" };
        }

        const updatedPlayer = { ...player, ...playerUpdates };

        // スタメンのplayerIdを更新（必要に応じて）
        const newLineup = team.lineup.map((e) =>
          e.battingOrder === battingOrder
            ? { ...e, playerId: updatedPlayer.id }
            : e
        );

        return {
          ...prev,
          [teamKey]: { ...team, lineup: newLineup },
        };
      });
    },
    [updateValue]
  );

  // 控え選手追加ヘルパー
  const addBenchPlayer = useCallback(
    (teamKey: "homeTeam" | "awayTeam") => {
      updateValue((prev) => {
        const team = prev[teamKey];
        const newId = `${teamKey}-bench-${Date.now()}`;
        const newPlayer: Player = {
          id: newId,
          name: "",
          number: "",
        };
        return {
          ...prev,
          [teamKey]: {
            ...team,
            benchPlayers: [...team.benchPlayers, newPlayer],
          },
        };
      });
    },
    [updateValue]
  );

  // 控え選手更新ヘルパー
  const updateBenchPlayer = useCallback(
    (
      teamKey: "homeTeam" | "awayTeam",
      playerId: string,
      updates: Partial<Player>
    ) => {
      updateValue((prev) => {
        const team = prev[teamKey];
        const newBenchPlayers = team.benchPlayers.map((player) =>
          player.id === playerId ? { ...player, ...updates } : player
        );
        return {
          ...prev,
          [teamKey]: { ...team, benchPlayers: newBenchPlayers },
        };
      });
    },
    [updateValue]
  );

  // 控え選手削除ヘルパー
  const removeBenchPlayer = useCallback(
    (teamKey: "homeTeam" | "awayTeam", playerId: string) => {
      updateValue((prev) => {
        const team = prev[teamKey];
        return {
          ...prev,
          [teamKey]: {
            ...team,
            benchPlayers: team.benchPlayers.filter((p) => p.id !== playerId),
          },
        };
      });
    },
    [updateValue]
  );

  // 打者追加ヘルパー
  const addLineupPlayer = useCallback(
    (teamKey: "homeTeam" | "awayTeam") => {
      updateValue((prev) => {
        const team = prev[teamKey];

        // 最大人数チェック
        if (team.lineup.length >= MAX_BATTERS) {
          alert(`打者は${MAX_BATTERS}人までしか登録できません`);
          return prev;
        }

        // 現在の最大打順を取得
        const maxBattingOrder =
          team.lineup.length > 0
            ? Math.max(...team.lineup.map((e) => e.battingOrder))
            : 0;

        // 新しい打順
        const newBattingOrder = maxBattingOrder + 1;

        // 選手IDを生成
        const generatePlayerId = (prefix: string, index: number) =>
          `${prefix}-player-${index}`;
        const newPlayerId = generatePlayerId(
          teamKey === "homeTeam" ? "home" : "away",
          newBattingOrder
        );

        // 新しいLineupEntryを作成
        const newEntry: LineupEntry = {
          battingOrder: newBattingOrder,
          playerId: newPlayerId,
          position: "DH", // 追加分はデフォルトでDH
        };

        return {
          ...prev,
          [teamKey]: {
            ...team,
            lineup: [...team.lineup, newEntry],
          },
        };
      });
    },
    [updateValue]
  );

  // スタメンの選手情報を管理
  // LineupEntryのplayerIdに対応するPlayer情報を取得・更新
  const getPlayerForLineup = useCallback(
    (
      teamKey: "homeTeam" | "awayTeam",
      playerId: string
    ): Player | undefined => {
      const team = value[teamKey];
      // まず控え選手から探す
      const benchPlayer = team.benchPlayers.find((p) => p.id === playerId);
      if (benchPlayer) return benchPlayer;
      // 控えにない場合は、新規作成（実際の実装では選手マスタから取得）
      return { id: playerId, name: "", number: "" };
    },
    [value]
  );

  // スタメンの選手名・背番号を更新
  const updateLineupPlayer = useCallback(
    (
      teamKey: "homeTeam" | "awayTeam",
      playerId: string,
      name: string,
      number: string
    ) => {
      updateValue((prev) => {
        const team = prev[teamKey];
        // 控え選手に既に存在する場合は更新、なければ新規作成して控えに追加
        const existingBenchIndex = team.benchPlayers.findIndex(
          (p) => p.id === playerId
        );
        let newBenchPlayers: Player[];

        if (existingBenchIndex >= 0) {
          newBenchPlayers = team.benchPlayers.map((p, idx) =>
            idx === existingBenchIndex ? { ...p, name, number } : p
          );
        } else {
          // スタメン専用の選手として控えに追加（実際の実装では別管理が望ましい）
          newBenchPlayers = [
            ...team.benchPlayers,
            { id: playerId, name, number },
          ];
        }

        return {
          ...prev,
          [teamKey]: {
            ...team,
            benchPlayers: newBenchPlayers,
          },
        };
      });
    },
    [updateValue]
  );

  const getPlayerName = useCallback(
    (teamKey: "homeTeam" | "awayTeam", playerId: string): string => {
      const player = getPlayerForLineup(teamKey, playerId);
      return player?.name || "";
    },
    [getPlayerForLineup]
  );

  const getPlayerNumber = useCallback(
    (teamKey: "homeTeam" | "awayTeam", playerId: string): string => {
      const player = getPlayerForLineup(teamKey, playerId);
      return player?.number || "";
    },
    [getPlayerForLineup]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto p-4 space-y-6">
      {/* セクション①：試合情報 */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">試合情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              試合日 <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={value.gameInfo.date}
              onChange={(e) => updateGameInfo({ date: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              開始時刻
            </label>
            <input
              type="time"
              value={value.gameInfo.startTime}
              onChange={(e) => updateGameInfo({ startTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              終了時刻
            </label>
            <input
              type="time"
              value={value.gameInfo.endTime}
              onChange={(e) => updateGameInfo({ endTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              球場名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={value.gameInfo.ballpark}
              onChange={(e) => updateGameInfo({ ballpark: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              大会名
            </label>
            <input
              type="text"
              value={value.gameInfo.competitionName}
              onChange={(e) =>
                updateGameInfo({ competitionName: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              天候
            </label>
            <select
              value={value.gameInfo.weather}
              onChange={(e) => updateGameInfo({ weather: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WEATHER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              グラウンド状況
            </label>
            <select
              value={value.gameInfo.groundCondition}
              onChange={(e) =>
                updateGameInfo({ groundCondition: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GROUND_CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              主審
            </label>
            <input
              type="text"
              value={value.gameInfo.umpirePlate}
              onChange={(e) => updateGameInfo({ umpirePlate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              1塁審
            </label>
            <input
              type="text"
              value={value.gameInfo.umpireBase1 || ""}
              onChange={(e) => updateGameInfo({ umpireBase1: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              2塁審
            </label>
            <input
              type="text"
              value={value.gameInfo.umpireBase2 || ""}
              onChange={(e) => updateGameInfo({ umpireBase2: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              3塁審
            </label>
            <input
              type="text"
              value={value.gameInfo.umpireBase3 || ""}
              onChange={(e) => updateGameInfo({ umpireBase3: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              記録員
            </label>
            <input
              type="text"
              value={value.gameInfo.scorerName}
              onChange={(e) => updateGameInfo({ scorerName: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* セクション②：チーム情報 */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">チーム情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 先攻（Away） */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4">先攻（Away）</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  チーム名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={value.awayTeam.name}
                  onChange={(e) =>
                    updateTeamMeta("awayTeam", { name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  略称
                </label>
                <input
                  type="text"
                  value={value.awayTeam.shortName || ""}
                  onChange={(e) =>
                    updateTeamMeta("awayTeam", { shortName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  監督名
                </label>
                <input
                  type="text"
                  value={value.awayTeam.managerName}
                  onChange={(e) =>
                    updateTeamMeta("awayTeam", { managerName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  コーチ名
                </label>
                <input
                  type="text"
                  value={value.awayTeam.coachName || ""}
                  onChange={(e) =>
                    updateTeamMeta("awayTeam", { coachName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 後攻（Home） */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-4">後攻（Home）</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  チーム名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={value.homeTeam.name}
                  onChange={(e) =>
                    updateTeamMeta("homeTeam", { name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  略称
                </label>
                <input
                  type="text"
                  value={value.homeTeam.shortName || ""}
                  onChange={(e) =>
                    updateTeamMeta("homeTeam", { shortName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  監督名
                </label>
                <input
                  type="text"
                  value={value.homeTeam.managerName}
                  onChange={(e) =>
                    updateTeamMeta("homeTeam", { managerName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  コーチ名
                </label>
                <input
                  type="text"
                  value={value.homeTeam.coachName || ""}
                  onChange={(e) =>
                    updateTeamMeta("homeTeam", { coachName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* セクション③：メンバー表 */}
      <section className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">メンバー表</h2>

        {/* 先攻チーム */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">
            {value.awayTeam.name || "先攻チーム"}
          </h3>

          {/* スタメン */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-300">スタメン</h4>
              <button
                type="button"
                onClick={() => addLineupPlayer("awayTeam")}
                disabled={value.awayTeam.lineup.length >= MAX_BATTERS}
                className={`px-3 py-1 text-white text-sm rounded-lg ${
                  value.awayTeam.lineup.length >= MAX_BATTERS
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                ＋打者を追加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      打順
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      選手名
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      背番号
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      守備位置
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {value.awayTeam.lineup.map((entry) => (
                    <tr key={entry.battingOrder} className="bg-gray-700">
                      <td className="px-2 py-2 text-white text-sm border border-gray-600">
                        {entry.battingOrder}
                      </td>
                      <td className="px-2 py-2 border border-gray-600">
                        <input
                          type="text"
                          value={getPlayerName("awayTeam", entry.playerId)}
                          onChange={(e) => {
                            updateLineupPlayer(
                              "awayTeam",
                              entry.playerId,
                              e.target.value,
                              getPlayerNumber("awayTeam", entry.playerId)
                            );
                          }}
                          className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="選手名"
                        />
                      </td>
                      <td className="px-2 py-2 border border-gray-600">
                        <input
                          type="text"
                          value={getPlayerNumber("awayTeam", entry.playerId)}
                          onChange={(e) => {
                            updateLineupPlayer(
                              "awayTeam",
                              entry.playerId,
                              getPlayerName("awayTeam", entry.playerId),
                              e.target.value
                            );
                          }}
                          className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="背番号"
                        />
                      </td>
                      <td className="px-2 py-2 border border-gray-600">
                        <select
                          value={entry.position}
                          onChange={(e) =>
                            updateLineupEntry("awayTeam", entry.battingOrder, {
                              position: e.target.value as Position,
                            })
                          }
                          className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {POSITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 控え選手 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-300">控え選手</h4>
              <button
                type="button"
                onClick={() => addBenchPlayer("awayTeam")}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                控えを追加
              </button>
            </div>
            {value.awayTeam.benchPlayers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                        選手名
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                        背番号
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {value.awayTeam.benchPlayers.map((player) => (
                      <tr key={player.id} className="bg-gray-700">
                        <td className="px-2 py-2 border border-gray-600">
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) =>
                              updateBenchPlayer("awayTeam", player.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="選手名"
                          />
                        </td>
                        <td className="px-2 py-2 border border-gray-600">
                          <input
                            type="text"
                            value={player.number || ""}
                            onChange={(e) =>
                              updateBenchPlayer("awayTeam", player.id, {
                                number: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="背番号"
                          />
                        </td>
                        <td className="px-2 py-2 border border-gray-600">
                          <button
                            type="button"
                            onClick={() =>
                              removeBenchPlayer("awayTeam", player.id)
                            }
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 後攻チーム */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            {value.homeTeam.name || "後攻チーム"}
          </h3>

          {/* スタメン */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-300">スタメン</h4>
              <button
                type="button"
                onClick={() => addLineupPlayer("homeTeam")}
                disabled={value.homeTeam.lineup.length >= MAX_BATTERS}
                className={`px-3 py-1 text-white text-sm rounded-lg ${
                  value.homeTeam.lineup.length >= MAX_BATTERS
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                ＋打者を追加
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      打順
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      選手名
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      背番号
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                      守備位置
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {value.homeTeam.lineup.map((entry) => (
                    <tr key={entry.battingOrder} className="bg-gray-700">
                      <td className="px-2 py-2 text-white text-sm border border-gray-600">
                        {entry.battingOrder}
                      </td>
                      <td className="px-2 py-2 border border-gray-600">
                        <input
                          type="text"
                          value={getPlayerName("homeTeam", entry.playerId)}
                          onChange={(e) => {
                            updateLineupPlayer(
                              "homeTeam",
                              entry.playerId,
                              e.target.value,
                              getPlayerNumber("homeTeam", entry.playerId)
                            );
                          }}
                          className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="選手名"
                        />
                      </td>
                      <td className="px-2 py-2 border border-gray-600">
                        <input
                          type="text"
                          value={getPlayerNumber("homeTeam", entry.playerId)}
                          onChange={(e) => {
                            updateLineupPlayer(
                              "homeTeam",
                              entry.playerId,
                              getPlayerName("homeTeam", entry.playerId),
                              e.target.value
                            );
                          }}
                          className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="背番号"
                        />
                      </td>
                      <td className="px-2 py-2 border border-gray-600">
                        <select
                          value={entry.position}
                          onChange={(e) =>
                            updateLineupEntry("homeTeam", entry.battingOrder, {
                              position: e.target.value as Position,
                            })
                          }
                          className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {POSITION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 控え選手 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-300">控え選手</h4>
              <button
                type="button"
                onClick={() => addBenchPlayer("homeTeam")}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                控えを追加
              </button>
            </div>
            {value.homeTeam.benchPlayers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                        選手名
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                        背番号
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 border border-gray-600">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {value.homeTeam.benchPlayers.map((player) => (
                      <tr key={player.id} className="bg-gray-700">
                        <td className="px-2 py-2 border border-gray-600">
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) =>
                              updateBenchPlayer("homeTeam", player.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="選手名"
                          />
                        </td>
                        <td className="px-2 py-2 border border-gray-600">
                          <input
                            type="text"
                            value={player.number || ""}
                            onChange={(e) =>
                              updateBenchPlayer("homeTeam", player.id, {
                                number: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 bg-gray-600 text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="背番号"
                          />
                        </td>
                        <td className="px-2 py-2 border border-gray-600">
                          <button
                            type="button"
                            onClick={() =>
                              removeBenchPlayer("homeTeam", player.id)
                            }
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          保存
        </button>
      </div>
    </form>
  );
};
