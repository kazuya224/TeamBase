// src/components/ScoreInput/components/Scoreboard.tsx
import React from "react";

interface ScoreboardProps {
  awayTeam: string;
  homeTeam: string;
  currentInning: number;
  currentTopBottom: "top" | "bottom";
  awayScore: number;
  homeScore: number;
  getInningScore: (
    inningNumber: number,
    topBottom: "top" | "bottom"
  ) => number | null;
  getTeamHits: (topBottom: "top" | "bottom") => number;
  getTeamErrors: (topBottom: "top" | "bottom") => number;
}

const INNINGS = Array.from({ length: 9 }, (_, i) => i + 1);

type Half = "top" | "bottom";

interface TeamRowProps {
  teamName: string;
  half: Half;
  totalScore: number;
  currentInning: number;
  currentTopBottom: Half;
  getInningScore: (inningNumber: number, topBottom: Half) => number | null;
  getTeamHits: (topBottom: Half) => number;
  getTeamErrors: (topBottom: Half) => number;
}

const TeamRow: React.FC<TeamRowProps> = ({
  teamName,
  half,
  totalScore,
  currentInning,
  currentTopBottom,
  getInningScore,
  getTeamHits,
  getTeamErrors,
}) => {
  const isCurrentHalf = (inning: number) =>
    currentInning === inning && currentTopBottom === half;

  return (
    <tr className="text-center border-t border-gray-700">
      <td className="text-left px-1 font-bold text-xs">{teamName}</td>
      {INNINGS.map((inning) => {
        const score = getInningScore(inning, half);
        return (
          <td
            key={inning}
            className={`px-0.5 py-0.5 text-xs ${
              isCurrentHalf(inning) ? "bg-blue-600 font-bold" : ""
            }`}
          >
            {score === null ? "" : score}
          </td>
        );
      })}
      <td className="px-1 text-yellow-400 font-bold text-sm">{totalScore}</td>
      <td className="px-1 text-xs">{getTeamHits(half)}</td>
      <td className="px-1 text-xs">{getTeamErrors(half)}</td>
    </tr>
  );
};

export const Scoreboard: React.FC<ScoreboardProps> = ({
  awayTeam,
  homeTeam,
  currentInning,
  currentTopBottom,
  awayScore,
  homeScore,
  getInningScore,
  getTeamHits,
  getTeamErrors,
}) => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-black px-2 py-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-gray-400">
            <th className="text-left px-1 w-12 text-[10px]">チーム</th>
            {INNINGS.map((inning) => (
              <th key={inning} className="px-0.5 w-5 text-[10px]">
                {inning}
              </th>
            ))}
            <th className="px-1 text-yellow-400 w-6 text-[10px]">計</th>
            <th className="px-1 w-5 text-[10px]">安</th>
            <th className="px-1 w-5 text-[10px]">失</th>
          </tr>
        </thead>
        <tbody>
          <TeamRow
            teamName={awayTeam}
            half="top"
            totalScore={awayScore}
            currentInning={currentInning}
            currentTopBottom={currentTopBottom}
            getInningScore={getInningScore}
            getTeamHits={getTeamHits}
            getTeamErrors={getTeamErrors}
          />
          <TeamRow
            teamName={homeTeam}
            half="bottom"
            totalScore={homeScore}
            currentInning={currentInning}
            currentTopBottom={currentTopBottom}
            getInningScore={getInningScore}
            getTeamHits={getTeamHits}
            getTeamErrors={getTeamErrors}
          />
        </tbody>
      </table>
    </div>
  );
};
