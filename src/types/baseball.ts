// ============================================
// 野球スコア管理の型定義
// ============================================

export type Position = "P" | "C" | "1B" | "2B" | "3B" | "SS" | "LF" | "CF" | "RF";
export type Base = 0 | 1 | 2 | 3 | 4;

export type PitchResult =
  | "strike"
  | "ball"
  | "foul"
  | "swingingMiss"
  | "calledStrike"
  | "foulTip"
  | "hitByPitch"
  | "hit"
  | "bunt";

export type HitDirection = "left" | "leftCenter" | "center" | "rightCenter" | "right";
export type HitType = "grounder" | "liner" | "fly" | "popup";

export type BattingResult =
  | "single"
  | "double"
  | "triple"
  | "homerun"
  | "strikeout"
  | "walk"
  | "hitByPitch"
  | "error"
  | "fieldersChoice"
  | "doublePlay"
  | "triplePlay"
  | "sacrificeBunt"
  | "sacrificeFly"
  | "stolenBase"
  | "caughtStealing"
  | "pickoff"
  | "pickoffError"
  | "wildPitch"
  | "passedBall"
  | "balk"
  | "interference"
  | "obstruction";

export type AdvancedPlayType =
  | "normal"
  | "tagUp"
  | "rundown"
  | "cutoffPlay"
  | "relay"
  | "appeal";

export type BuntType =
  | "normal" // 通常
  | "safety" // セーフティ
  | "squeeze"; // スーサイド（スクイズ）

// TODO: 戻塁（Return）は UI が未対応のため、現在は使用されていません。
// 本格対応は後で backward movement を実装する時に行う予定です。
export type RunnerAdvanceReason =
  | "SB"
  | "CS"
  | "SB+E"
  | "PO"
  | "POE"
  | "WP"
  | "PB"
  | "BK"
  | "DI"
  | "Hit"
  | "BB"
  | "HBP"
  | "SF"
  | "SH"
  | "E"
  | "FC"
  | "Award"
  | "Interference"
  | "FielderInterference"
  | "BatterInterference"
  | "RunnerInterference"
  | "TagUp"
  | "Overtake"
  | "AbandonBase"
  | "Appeal"
  | "Return" // TODO: UI未対応
  | "Other";

export type ErrorType = "catch" | "throw";
export type AwardBasis = "TOP" | "TOT";

export interface Pitch {
  result: PitchResult;
  count: { balls: number; strikes: number };
  timestamp?: string;
}

export interface DefensivePlay {
  positions: Position[];
  playType: AdvancedPlayType;
  description?: string;
}

export interface RunnerAdvance {
  runnerId: "BR" | "R1" | "R2" | "R3";
  fromBase: Base;
  toBase: Base;
  reason: RunnerAdvanceReason;
  fieldersPath?: string[];
  award?: "NONE" | "1B" | "2B";
  awardBasis?: AwardBasis;
  out?: boolean;
  outcome?: "safe" | "out" | "tagOut"; // セーフ、アウト、タッチアウト
  scored?: boolean;
  runnerName?: string;
  playType?: AdvancedPlayType;
  defensivePlay?: DefensivePlay;
  notes?: string;
}

export interface ErrorInfo {
  position: Position;
  type: ErrorType;
  description?: string;
}

// 守備プレーの各ステップ
export interface DefensiveStep {
  position?: Position;
  errorType?: "catch" | "throw" | "FC"; // 捕球E, 送球E, FC
  stepIndex: number;
}

export interface AtBat {
  batterName: string;
  battingResult: BattingResult;
  pitches: Pitch[];
  outs: number;
  rbis: number;
  hitDirection?: HitDirection;
  hitType?: HitType;
  position?: Position;
  defensePath?: string[];
  defensivePositions?: Position[];
  errors?: ErrorInfo[];
  runnerAdvances?: RunnerAdvance[];
  outsOrder?: Array<"batter" | "R1" | "R2" | "R3">;
  thirdOutType?: "force" | "time";
  flags?: {
    IF_declared?: boolean;
    IF_drop?: boolean;
    ballDead?: boolean;
    balkAdvantage?: boolean;
    simultaneousAdvance?: boolean;
  };
  buntType?: BuntType;
  timestamp?: string;
  // 要件対応の追加フィールド
  droppedThirdStrike?: boolean;
  strikeoutType?: "normal" | "droppedThird";
  caughtFoul?: boolean;
  foulTip?: boolean;
  infieldFly?: boolean;
  resultType?: "safe" | "out" | "tagOut" | "doublePlay" | "triplePlay";
  playType?: AdvancedPlayType;
}

export interface Inning {
  inningNumber: number;
  topBottom: "top" | "bottom";
  atBats: AtBat[];
  score: number;
  outs: number;
}

export interface Game {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  innings: Inning[];
  currentInning: number;
  currentTopBottom: "top" | "bottom";
  homeScore: number;
  awayScore: number;
  lineup: string[];
}

export interface GameAction {
  type: "EVENT_ADD" | "EVENT_REMOVE" | "EVENT_MODIFY" | "INNING_CHANGE";
  undoable: boolean;
  payload: any;
  timestamp: string;
  apply: (game: Game) => Game;
  revert: (game: Game) => Game;
}

export interface RunnerInfo {
  base: 1 | 2 | 3;
  name: string;
  runnerId: "R1" | "R2" | "R3";
}

export type ScreenType =
  | "pitch"
  | "batting"
  | "defense"
  | "runner"
  | "cutPlay"
  | "rundown"
  | "result"
  | "buntType";

