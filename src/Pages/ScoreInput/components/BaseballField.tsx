import React from "react";

interface RunnerInfo {
  base: 1 | 2 | 3;
  name: string;
  runnerId: "R1" | "R2" | "R3";
}

interface BaseballFieldProps {
  runners: RunnerInfo[];
}

export const BaseballField: React.FC<BaseballFieldProps> = ({ runners }) => {
  const getRunnerOnBase = (base: 1 | 2 | 3) =>
    runners.find((runner) => runner.base === base);

  const runnerOnFirst = getRunnerOnBase(1);
  const runnerOnSecond = getRunnerOnBase(2);
  const runnerOnThird = getRunnerOnBase(3);

  return (
    <div className="bg-black px-3 py-1">
      <svg viewBox="0 0 400 200" className="w-full max-w-xl mx-auto h-auto">
        {/* 内野のひし形 */}
        <path
          d="M 200 180 L 140 120 L 200 60 L 260 120 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
        />

        {/* マウンド */}
        <circle
          cx="200"
          cy="140"
          r="14"
          fill="none"
          stroke="#888888"
          strokeWidth="1.5"
        />

        {/* ホームベース（五角形） */}
        <path
          d="M 200 180 L 192 172 L 192 164 L 208 164 L 208 172 Z"
          fill="white"
          stroke="#333"
          strokeWidth="1"
        />

        {/* 一塁ベース */}
        <rect
          x="254"
          y="114"
          width="12"
          height="12"
          fill={runnerOnFirst ? "#fbbf24" : "white"}
          stroke="#333"
          strokeWidth="1"
        />
        {runnerOnFirst && (
          <text
            x="260"
            y="140"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {runnerOnFirst.name}
          </text>
        )}

        {/* 二塁ベース */}
        <rect
          x="194"
          y="54"
          width="12"
          height="12"
          fill={runnerOnSecond ? "#fbbf24" : "white"}
          stroke="#333"
          strokeWidth="1"
          transform="rotate(45 200 60)"
        />
        {runnerOnSecond && (
          <text
            x="200"
            y="48"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {runnerOnSecond.name}
          </text>
        )}

        {/* 三塁ベース */}
        <rect
          x="134"
          y="114"
          width="12"
          height="12"
          fill={runnerOnThird ? "#fbbf24" : "white"}
          stroke="#333"
          strokeWidth="1"
        />
        {runnerOnThird && (
          <text
            x="140"
            y="140"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {runnerOnThird.name}
          </text>
        )}
      </svg>
    </div>
  );
};
