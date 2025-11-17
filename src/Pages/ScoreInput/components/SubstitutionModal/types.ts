import type { SubstitutionType, Base, Position } from "../../../../types/baseball";
import type { GameMeta } from "../../../../types/gameMeta";

export interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (substitution: {
    team: "home" | "away";
    type: SubstitutionType;
    originalPlayerId: string;
    newPlayerId: string;
    battingOrder?: number;
    base?: Base;
    position?: Position;
    fromPosition?: Position;
    toPosition?: Position;
  }) => void;
  gameMeta: GameMeta;
  currentInning: number;
  currentTopBottom: "top" | "bottom";
  currentBatterIndex: number;
  runners: Array<{
    base: 1 | 2 | 3;
    name: string;
    runnerId: "R1" | "R2" | "R3";
  }>;
}

