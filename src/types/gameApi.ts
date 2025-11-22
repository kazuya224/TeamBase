import { GameSummary, GameDetail } from "../types/game";

// モックデータ
const mockGameSummaries: GameSummary[] = [
  {
    id: "game-001",
    date: "2024-11-15",
    opponent: "ライオンズ",
    ballpark: "甲子園球場",
    competitionName: "秋季リーグ戦",
    isHome: true,
    myTeamName: "タイガース",
    opponentTeamName: "ライオンズ",
    myScore: 5,
    opponentScore: 3,
    result: "WIN",
  },
  {
    id: "game-002",
    date: "2024-11-10",
    opponent: "ドラゴンズ",
    ballpark: "ナゴヤドーム",
    competitionName: "秋季リーグ戦",
    isHome: false,
    myTeamName: "タイガース",
    opponentTeamName: "ドラゴンズ",
    myScore: 2,
    opponentScore: 4,
    result: "LOSE",
  },
  {
    id: "game-003",
    date: "2024-11-05",
    opponent: "ジャイアンツ",
    ballpark: "甲子園球場",
    competitionName: "秋季リーグ戦",
    isHome: true,
    myTeamName: "タイガース",
    opponentTeamName: "ジャイアンツ",
    myScore: 3,
    opponentScore: 3,
    result: "DRAW",
  },
];

const mockGameDetails: Record<string, GameDetail> = {
  "game-001": {
    ...mockGameSummaries[0],
    innings: [
      { inningNumber: 1, topScore: 0, bottomScore: 2 },
      { inningNumber: 2, topScore: 1, bottomScore: 0 },
      { inningNumber: 3, topScore: 0, bottomScore: 1 },
      { inningNumber: 4, topScore: 2, bottomScore: 0 },
      { inningNumber: 5, topScore: 0, bottomScore: 1 },
      { inningNumber: 6, topScore: 0, bottomScore: 1 },
      { inningNumber: 7, topScore: 0, bottomScore: 0 },
      { inningNumber: 8, topScore: 0, bottomScore: 0 },
      { inningNumber: 9, topScore: 0, bottomScore: 0 },
    ],
    hits: { myTeam: 8, opponent: 6 },
    errors: { myTeam: 1, opponent: 2 },
  },
  "game-002": {
    ...mockGameSummaries[1],
    innings: [
      { inningNumber: 1, topScore: 0, bottomScore: 0 },
      { inningNumber: 2, topScore: 1, bottomScore: 0 },
      { inningNumber: 3, topScore: 0, bottomScore: 1 },
      { inningNumber: 4, topScore: 0, bottomScore: 1 },
      { inningNumber: 5, topScore: 1, bottomScore: 0 },
      { inningNumber: 6, topScore: 0, bottomScore: 2 },
      { inningNumber: 7, topScore: 0, bottomScore: 0 },
      { inningNumber: 8, topScore: 0, bottomScore: 0 },
      { inningNumber: 9, topScore: 0, bottomScore: 0 },
    ],
    hits: { myTeam: 5, opponent: 9 },
    errors: { myTeam: 2, opponent: 0 },
  },
  "game-003": {
    ...mockGameSummaries[2],
    innings: [
      { inningNumber: 1, topScore: 1, bottomScore: 0 },
      { inningNumber: 2, topScore: 0, bottomScore: 1 },
      { inningNumber: 3, topScore: 1, bottomScore: 0 },
      { inningNumber: 4, topScore: 0, bottomScore: 1 },
      { inningNumber: 5, topScore: 1, bottomScore: 0 },
      { inningNumber: 6, topScore: 0, bottomScore: 1 },
      { inningNumber: 7, topScore: 0, bottomScore: 0 },
      { inningNumber: 8, topScore: 0, bottomScore: 0 },
      { inningNumber: 9, topScore: 0, bottomScore: 0 },
    ],
    hits: { myTeam: 7, opponent: 7 },
    errors: { myTeam: 0, opponent: 1 },
  },
};

export async function fetchGameSummaries(): Promise<GameSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockGameSummaries;
}

export async function fetchGameDetail(id: string): Promise<GameDetail> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const detail = mockGameDetails[id];
  if (!detail) {
    throw new Error("Game not found");
  }
  return detail;
}