// ============================================
// 試合メタ情報の型定義
// ============================================

// 打者の最大人数
export const MAX_BATTERS = 20;

// 試合情報
export type GameInfo = {
  id?: string;
  date: string;             // 試合日
  startTime: string;        // 開始時刻
  endTime: string;          // 終了時刻
  ballpark: string;         // 球場名
  competitionName: string;  // 大会名・リーグ名
  weather: string;          // 天候
  groundCondition: string;  // グラウンド状況（良/やや不良/不良）
  umpirePlate: string;      // 主審
  umpireBase1?: string;     // 1塁審
  umpireBase2?: string;     // 2塁審
  umpireBase3?: string;     // 3塁審
  scorerName: string;       // 記録員
};

// 守備位置（DHを含む）
export type Position =
  | "P"
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "LF"
  | "CF"
  | "RF"
  | "DH";

// 選手情報
export type Player = {
  id: string;
  name: string;
  number?: string;             // 背番号
};

// スタメン1人分
export type LineupEntry = {
  battingOrder: number;        // 打順
  playerId: string;            // Player.id
  position: Position;
};

// チーム情報
export type TeamMeta = {
  id?: string;
  name: string;                // チーム名
  shortName?: string;          // スコア表記の略称
  isHome: boolean;             // true = 後攻, false = 先攻
  managerName: string;
  coachName?: string;
  lineup: LineupEntry[];       // スタメン9人分
  benchPlayers: Player[];      // 控え
};

// メタ情報全体
export type GameMeta = {
  gameInfo: GameInfo;
  homeTeam: TeamMeta;
  awayTeam: TeamMeta;
};

// デフォルト値生成ヘルパー
export const createDefaultGameMeta = (): GameMeta => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  // デフォルトの選手ID生成
  const generatePlayerId = (prefix: string, index: number) => `${prefix}-player-${index}`;
  
  // デフォルトのスタメン生成（初期は9人）
  const createDefaultLineup = (teamPrefix: string): LineupEntry[] => {
    // 一般的な守備位置の順序
    const defaultPositions: Position[] = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"];
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
};

