import type { Position } from "../../../../types/baseball";

export const POSITION_OPTIONS: { value: Position; label: string }[] = [
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

