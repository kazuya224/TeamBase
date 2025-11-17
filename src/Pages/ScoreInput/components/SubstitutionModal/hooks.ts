import { useMemo } from "react";
import type { GameMeta } from "../../../../types/gameMeta";

interface UseTeamDataProps {
  team: "home" | "away";
  gameMeta: GameMeta;
  runners: Array<{
    base: 1 | 2 | 3;
    name: string;
    runnerId: "R1" | "R2" | "R3";
  }>;
}

export const useTeamData = ({ team, gameMeta, runners }: UseTeamDataProps) => {
  // チームごとのデータをメモ化
  const selectedTeam = useMemo(
    () => (team === "home" ? gameMeta.homeTeam : gameMeta.awayTeam),
    [gameMeta, team]
  );

  // スタメン選手リスト（打順順）
  const lineupPlayers = useMemo(
    () =>
      [...selectedTeam.lineup]
        .sort((a, b) => a.battingOrder - b.battingOrder)
        .map((entry) => {
          const player = selectedTeam.benchPlayers.find(
            (p) => p.id === entry.playerId
          );
          return {
            id: entry.playerId,
            name: player?.name || `打者${entry.battingOrder}`,
            number: player?.number || "",
            battingOrder: entry.battingOrder,
            position: entry.position,
          };
        }),
    [selectedTeam]
  );

  // 控え選手リスト
  const benchPlayers = useMemo(
    () =>
      selectedTeam.benchPlayers.filter(
        (player) =>
          !selectedTeam.lineup.some((entry) => entry.playerId === player.id)
      ),
    [selectedTeam]
  );

  // 走者リスト
  const runnerList = useMemo(() => {
    // lineup の playerId から name を引けるように allPlayers を組み立てる
    const lineupPlayersMap = new Map<string, { id: string; name: string; number: string }>();
    selectedTeam.lineup.forEach((entry) => {
      const player = selectedTeam.benchPlayers.find((bp) => bp.id === entry.playerId);
      if (player) {
        lineupPlayersMap.set(entry.playerId, {
          id: entry.playerId,
          name: player.name,
          number: player.number || "",
        });
      } else {
        // ベンチにいない場合は、lineup から名前を生成
        lineupPlayersMap.set(entry.playerId, {
          id: entry.playerId,
          name: `打者${entry.battingOrder}`,
          number: "",
        });
      }
    });

    // 全選手リストを作成（lineup + benchPlayers）
    const allPlayers = [
      ...Array.from(lineupPlayersMap.values()),
      ...selectedTeam.benchPlayers.filter(
        (bp) => !lineupPlayersMap.has(bp.id)
      ),
    ];

    return runners
      .map((runner) => {
        const player = allPlayers.find((p) => p.name === runner.name);
        return {
          id: player?.id || "",
          name: runner.name,
          base: runner.base,
          runnerId: runner.runnerId,
        };
      })
      .filter((r) => r.id !== "");
  }, [runners, selectedTeam]);

  // 守備位置の選手リスト
  const defensePlayers = useMemo(
    () =>
      selectedTeam.lineup.map((entry) => {
        const player = selectedTeam.benchPlayers.find(
          (p) => p.id === entry.playerId
        );
        return {
          id: entry.playerId,
          name: player?.name || "",
          number: player?.number || "",
          position: entry.position,
        };
      }),
    [selectedTeam]
  );

  return {
    selectedTeam,
    lineupPlayers,
    benchPlayers,
    runnerList,
    defensePlayers,
  };
};

