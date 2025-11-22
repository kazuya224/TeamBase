export type InningScore = {
    inningNumber: number;
    topScore: number;
    bottomScore: number;
  };
  
  export type GameSummary = {
    id: string;
    date: string;
    opponent: string;
    ballpark: string;
    competitionName: string;
    isHome: boolean;
    myTeamName: string;
    opponentTeamName: string;
    myScore: number;
    opponentScore: number;
    result: "WIN" | "LOSE" | "DRAW";
  };
  
  export type GameDetail = GameSummary & {
    innings: InningScore[];
    hits: { myTeam: number; opponent: number };
    errors: { myTeam: number; opponent: number };
  };