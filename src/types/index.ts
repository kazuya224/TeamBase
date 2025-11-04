// 打撃結果の種類
export type BattingResult = 
  | 'single'        // 単打
  | 'double'        // 二塁打
  | 'triple'        // 三塁打
  | 'homerun'       // 本塁打
  | 'walk'          // 四球
  | 'hitByPitch'    // 死球
  | 'strikeout'     // 三振
  | 'doublePlay'    // 併殺打
  | 'sacrificeBunt' // 犠打（バント）
  | 'sacrificeFly'  // 犠牲フライ
  | 'fieldersChoice'// 野選
  | 'error'         // 失策
  | 'other';        // その他

// 塁の種類
export type Base = 0 | 1 | 2 | 3; // 0: 本塁（ホーム）、1: 一塁、2: 二塁、3: 三塁

// 走者進塁情報
export interface RunnerAdvance {
  fromBase: Base;
  toBase: Base;
  scored: boolean;    // 得点したか
  out: boolean;       // アウトになったか
  runnerName: string; // 走者名
}

// 打席情報
export interface AtBat {
  batterName: string;
  battingResult?: BattingResult;
  runnerAdvances?: RunnerAdvance[];
  outs: number; // この打席で増えたアウト数
  rbis: number; // 打点
}

// イニング情報
export interface Inning {
  inningNumber: number;
  topBottom: 'top' | 'bottom'; // top: 表、bottom: 裏
  atBats: AtBat[];
  score: number; // このイニングの得点
  outs: number;  // 現在のアウト数（0-3）
}

// 試合情報
export interface Game {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  innings: Inning[];
  currentInning: number;
  currentTopBottom: 'top' | 'bottom';
  homeScore: number;
  awayScore: number;
  lineup: string[]; // 打順
}
