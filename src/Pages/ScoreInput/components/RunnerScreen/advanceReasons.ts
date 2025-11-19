import type { RunnerAdvanceReason } from "../../../../types/baseball";

export const ADVANCE_REASONS: { value: RunnerAdvanceReason; label: string }[] = [
  { value: "Hit", label: "安打" },
  { value: "BB", label: "四球" },
  { value: "HBP", label: "死球" },
  { value: "strikeoutDropped", label: "振り逃げ"},
  { value: "SB", label: "盗塁" },
  { value: "CS", label: "盗塁死" },
  { value: "PO", label: "牽制死" },
  { value: "WP", label: "暴投" },
  { value: "PB", label: "捕逸" },
  { value: "BK", label: "ボーク" },
  { value: "DI", label: "無警戒進塁" },
  { value: "E", label: "エラー" },
  { value: "FC", label: "フィルダースチョイス" },
  { value: "SF", label: "犠飛" },
  { value: "SH", label: "犠打" },
  // 妨害系: 具体的な種別を使用（汎用的な"Interference"は非推奨）
  { value: "FielderInterference", label: "守備妨害" },
  { value: "BatterInterference", label: "打撃妨害" },
  { value: "RunnerInterference", label: "走塁妨害" },
  { value: "TagUp", label: "タッグアップ" },
  { value: "Overtake", label: "追い越し" },
  { value: "AbandonBase", label: "離塁放棄" },
  { value: "Appeal", label: "アピール" },
  { value: "Other", label: "その他" },
];

