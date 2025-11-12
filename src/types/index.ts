// ==========================================
// 既存の型定義（変更なし）
// ==========================================

export type BattingResult = 
  | 'single' | 'double' | 'triple' | 'homerun'
  | 'walk' | 'hitByPitch' | 'strikeout' | 'doublePlay'
  | 'sacrificeBunt' | 'sacrificeFly' | 'fieldersChoice'
  | 'error' 
  | 'stolenBase'        // 🆕 盗塁
  | 'caughtStealing'    // 🆕 盗塁死
  | 'pickoff'           // 🆕 牽制死
  | 'wildPitch'         // 🆕 暴投
  | 'passedBall'        // 🆕 捕逸
  | 'balk'              // 🆕 ボーク
  | 'other';

export type PitchResult = 
  | 'strike' | 'ball' | 'foul' | 'foulTip' | 'hit'
  | 'swingingMiss' | 'calledStrike' | 'bunt'
  | 'hitByPitch' | 'wildPitch' | 'passedBall';

export type HitDirection = 
  | 'left' | 'leftCenter' | 'center' | 'rightCenter' | 'right'
  | 'leftField' | 'centerField' | 'rightField'
  | 'foulLeft' | 'foulRight';

export type HitType = 
  | 'liner' | 'fly' | 'grounder' | 'popup' | 'lineDrive'
  | 'bunt' | 'foul' | 'none';

export type PlayType = 
  | 'normal' | 'cut' | 'relay' | 'runDown'
  | 'pickoff' | 'balk' | 'other' | 'tagUp' | 'rundown' | 'cutoffPlay' | 'relay';

export type Position = 
  | 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF';

export type Base = 0 | 1 | 2 | 3;

export interface Pitch {
  pitchNumber: number;
  result: PitchResult;
  hitDirection?: HitDirection;
  hitType?: HitType;
  position?: Position;
  playType?: PlayType;
  notes?: string;
}

export interface RunnerAdvance {
  fromBase: Base;
  toBase: Base;
  scored: boolean;
  out: boolean;
  runnerName: string;
  position?: Position;
  playType?: PlayType;
}

export interface AtBat {
  batterName: string;
  battingResult?: BattingResult;
  pitches: Pitch[];
  runnerAdvances?: RunnerAdvance[];
  outs: number;
  rbis: number;
  hitDirection?: HitDirection;
  hitType?: HitType;
  position?: Position;
  playType?: PlayType;
  defensivePositions?: Position[];
}

export interface Inning {
  inningNumber: number;
  topBottom: 'top' | 'bottom';
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
  currentTopBottom: 'top' | 'bottom';
  homeScore: number;
  awayScore: number;
  lineup: string[];
}

// ==========================================
// 新機能: 拡張型（段階的に追加）
// ==========================================

// Phase 1: クイックアクション用の型
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  event: Partial<AtBat>; // 既存のAtBat型を再利用
  requiredContext?: {
    runnersOn?: (1 | 2 | 3)[];
    minOuts?: number;
    maxOuts?: number;
  };
  frequency?: number;
}

// Phase 2: Undo/Redo用の型
export interface GameAction {
  type: 'EVENT_ADD' | 'EVENT_REMOVE' | 'EVENT_MODIFY' | 'INNING_CHANGE';
  payload: any;
  timestamp: Date;
  undoable: boolean;
}

export interface UndoStack {
  past: GameAction[];
  future: GameAction[];
  limit: number;
}

// Phase 3: ゲーム状態管理用の型
export interface GameState {
  outs: number;
  runners: Map<1 | 2 | 3, string>;
  balls: number;
  strikes: number;
  currentBatter: string;
  batterIndex: number;
  recentEvents: AtBat[]; // 既存型を再利用
}

// Phase 4: ウィザードUI用の型
export type WizardStep = 
  | 'pitch' 
  | 'batted' 
  | 'ruling' 
  | 'runners' 
  | 'confirm';

export interface WizardState {
  currentStep: WizardStep;
  data: Partial<AtBat>; // 既存型を再利用
  suggestions: EventSuggestion[];
  canAutoComplete: boolean;
}

export interface EventSuggestion {
  events: Partial<AtBat>[]; // 既存型を再利用
  confidence: number;
  reason: string;
}

// Phase 5: 統計算出用の型
export interface PlayerStats {
  name: string;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeruns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  avg: number;
  obp: number;
  slg: number;
}

export interface PitcherStats {
  name: string;
  inningsPitched: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeruns: number;
  era: number;
  whip: number;
}

// ==========================================
// ヘルパー関数（既存コードで使用）
// ==========================================

export const createDefaultGame = (): Game => ({
  id: Date.now().toString(),
  date: new Date().toISOString().split('T')[0],
  homeTeam: 'ホーム',
  awayTeam: 'ビジター',
  innings: [],
  currentInning: 1,
  currentTopBottom: 'top',
  homeScore: 0,
  awayScore: 0,
  lineup: Array.from({ length: 9 }, (_, i) => `打者${i + 1}`)
});

export const createDefaultGameState = (game: Game, batterIndex: number): GameState => ({
  outs: 0,
  runners: new Map(),
  balls: 0,
  strikes: 0,
  currentBatter: game.lineup[batterIndex],
  batterIndex,
  recentEvents: []
});

// マイグレーション用: 既存のGame型からGameStateを生成
export const gameToGameState = (game: Game, batterIndex: number): GameState => {
  const currentInning = game.innings.find(
    i => i.inningNumber === game.currentInning && i.topBottom === game.currentTopBottom
  );

  const runners = new Map<1 | 2 | 3, string>();
  // 現在のイニングから走者を復元する処理
  // （既存のgetCurrentRunners関数のロジックを使用）

  return {
    outs: currentInning?.outs || 0,
    runners,
    balls: 0,
    strikes: 0,
    currentBatter: game.lineup[batterIndex],
    batterIndex,
    recentEvents: currentInning?.atBats || []
  };
};

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  result: BattingResult;
  show: boolean;
}

export type AdvancedPlayType = 
  | 'normal'
  | 'tagUp'             // 🆕 タッチアップ
  | 'rundown'           // 🆕 挟殺
  | 'cutoffPlay'        // 🆕 カットプレー
  | 'relay';            // 🆕 中継プレー

export interface DefensivePlay {
  positions: Position[];  // 例: ["SS", "2B", "1B"] = 6-4-3
  playType: AdvancedPlayType;
  description?: string;   // "二塁盗塁失敗(2-4)" など
}

export interface RunnerAdvance {
  fromBase: Base;
  toBase: Base;
  scored: boolean;
  out: boolean;
  runnerName: string;
  playType?: PlayType;      // 🆕
  defensivePlay?: DefensivePlay;    // 🆕
  notes?: string;                   // 🆕 "タッチアップ"等
}

// バントの種類
export type BuntType = 
  | "sacrifice"      // 犠打
  | "safety"         // セーフティ
  | "squeeze"        // スクイズ
  | "delayedSqueeze" // ディレードスクイズ
  | "buster"         // バスター
  | "failed"         // 失敗
  ;

// 走塁戦術
export type BaserunningPlay = 
  | "straightSteal"      // 通常の盗塁
  | "delayedSteal"       // ディレードスチール
  | "doubleSteal"        // ダブルスチール
  | "hitAndRun"          // ヒットエンドラン
  | "runAndHit"          // ランアンドヒット
  | "tagUp"              // タッチアップ
  | "advanceOnThrow"     // 送球間の進塁
  ;

// アウトの種類
export type OutType = 
  | "force"          // フォースアウト
  | "tag"            // タッグアウト
  | "flyout"         // フライアウト
  | "lineout"        // ライナーアウト
  | "strikeout"      // 三振
  | "pickoff"        // 牽制アウト
  ;

// 特殊プレー
export type SpecialPlay = 
  | "balk"                    // ボーク
  | "infieldFly"              // インフィールドフライ
  | "catcherInterference"     // 捕手妨害
  | "obstruction"             // 走塁妨害
  | "triplePlay"              // トリプルプレー
  ;

// 投球詳細
export interface PitchDetails {
  pitchType?: "fastball" | "curve" | "slider" | "changeup" | "splitter" | "cutter";
  velocity?: number;
  location?: "insideHigh" | "insideLow" | "outsideHigh" | "outsideLow" | "middle";
}

// AtBat に追加するフィールド
export interface AtBat {
  batterName: string;
  battingResult?: BattingResult;
  pitches: Pitch[];
  outs: number;
  rbis: number;
  runnerAdvances?: RunnerAdvance[];
  hitDirection?: HitDirection;
  hitType?: HitType;
  position?: Position;
  defensivePositions?: Position[];
  
  // 🆕 追加
  buntType?: BuntType;
  baserunningPlay?: BaserunningPlay;
  outType?: OutType;
  specialPlay?: SpecialPlay;
  pitchDetails?: PitchDetails;
  substitution?: {
    type: "pinchHitter" | "pinchRunner" | "defensiveReplacement";
    originalPlayer: string;
    newPlayer: string;
  };
}