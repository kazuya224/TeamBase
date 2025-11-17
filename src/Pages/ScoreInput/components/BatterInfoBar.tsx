import React from "react";

interface BatterInfoBarProps {
  batterIndex: number;
  batterName: string;
  balls: number;
  strikes: number;
  outs: number;
}

interface CountDotsProps {
  label: string;
  count: number;
  max: number;
  activeClassName: string;
  inactiveClassName: string;
}

const CountDots: React.FC<CountDotsProps> = ({
  label,
  count,
  max,
  activeClassName,
  inactiveClassName,
}) => (
  <div className="flex items-center gap-0.5">
    <span className="text-[10px] opacity-80">{label}</span>
    {Array.from({ length: max }).map((_, i) => (
      <div
        key={i}
        className={`w-1.5 h-1.5 rounded-full ${
          i < count ? activeClassName : inactiveClassName
        }`}
      />
    ))}
  </div>
);

export const BatterInfoBar: React.FC<BatterInfoBarProps> = ({
  batterIndex,
  batterName,
  balls,
  strikes,
  outs,
}) => {
  return (
    <div className="bg-blue-600 px-2 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xs">
          {batterIndex + 1}
        </div>
        <div className="font-bold text-sm">{batterName}</div>
      </div>
      <div className="flex items-center gap-2">
        <CountDots
          label="B"
          count={balls}
          max={4}
          activeClassName="bg-green-400"
          inactiveClassName="bg-blue-800"
        />
        <CountDots
          label="S"
          count={strikes}
          max={3}
          activeClassName="bg-yellow-400"
          inactiveClassName="bg-blue-800"
        />
        <CountDots
          label="O"
          count={outs}
          max={3}
          activeClassName="bg-red-400"
          inactiveClassName="bg-blue-800"
        />
      </div>
    </div>
  );
};
