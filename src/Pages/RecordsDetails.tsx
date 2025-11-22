import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 型定義
interface PitchResult {
  result: string;
  count: { balls: number; strikes: number };
}

interface RunnerAdvance {
  runnerId: string;
  fromBase: number;
  toBase: number;
  scored: boolean;
  out: boolean;
  runnerName: string;
}

interface AtBat {
  batterName: string;
  battingResult: string;
  pitches: PitchResult[];
  outs: number;
  rbis: number;
  runnerAdvances?: RunnerAdvance[];
  hitDirection?: string;
  hitType?: string;
  position?: string;
}

interface Inning {
  inningNumber: number;
  topBottom: "top" | "bottom";
  atBats: AtBat[];
  score: number;
}

interface GameDetail {
  id: string;
  date: string;
  competitionName: string;
  ballpark: string;
  myTeamName: string;
  opponentTeamName: string;
  myScore: number;
  opponentScore: number;
  result: "WIN" | "LOSE" | "DRAW";
  isHome: boolean;
  innings: Inning[];
  hits: {
    myTeam: number;
    opponent: number;
  };
  errors: {
    myTeam: number;
    opponent: number;
  };
}

// モックデータ生成関数
const fetchGameDetail = async (gameId: string): Promise<GameDetail> => {
  const mockData: Record<string, GameDetail> = {
    "1": {
      id: "1",
      date: "2024-11-20",
      competitionName: "秋季リーグ",
      ballpark: "東京ドーム",
      myTeamName: "ホークス",
      opponentTeamName: "ライバルズ",
      myScore: 5,
      opponentScore: 3,
      result: "WIN",
      isHome: true,
      innings: [
        {
          inningNumber: 1,
          topBottom: "top",
          score: 0,
          atBats: [
            {
              batterName: "打者1",
              battingResult: "groundout",
              pitches: [
                { result: "ball", count: { balls: 1, strikes: 0 } },
                { result: "strike", count: { balls: 1, strikes: 1 } },
                { result: "hit", count: { balls: 1, strikes: 1 } },
              ],
              outs: 1,
              rbis: 0,
              hitDirection: "center",
              position: "2B",
            },
            {
              batterName: "打者2",
              battingResult: "strikeout",
              pitches: [
                { result: "strike", count: { balls: 0, strikes: 1 } },
                { result: "ball", count: { balls: 1, strikes: 1 } },
                { result: "strike", count: { balls: 1, strikes: 2 } },
                { result: "strike", count: { balls: 1, strikes: 3 } },
              ],
              outs: 1,
              rbis: 0,
            },
            {
              batterName: "打者3",
              battingResult: "flyout",
              pitches: [
                { result: "ball", count: { balls: 1, strikes: 0 } },
                { result: "ball", count: { balls: 2, strikes: 0 } },
                { result: "hit", count: { balls: 2, strikes: 0 } },
              ],
              outs: 1,
              rbis: 0,
              hitDirection: "right",
              position: "RF",
            },
          ],
        },
        {
          inningNumber: 1,
          topBottom: "bottom",
          score: 1,
          atBats: [
            {
              batterName: "打者4",
              battingResult: "single",
              pitches: [
                { result: "strike", count: { balls: 0, strikes: 1 } },
                { result: "ball", count: { balls: 1, strikes: 1 } },
                { result: "hit", count: { balls: 1, strikes: 1 } },
              ],
              outs: 0,
              rbis: 0,
              hitDirection: "left",
              hitType: "liner",
              position: "LF",
              runnerAdvances: [
                {
                  runnerId: "BR",
                  fromBase: 0,
                  toBase: 1,
                  scored: false,
                  out: false,
                  runnerName: "打者4",
                },
              ],
            },
            {
              batterName: "打者5",
              battingResult: "double",
              pitches: [
                { result: "ball", count: { balls: 1, strikes: 0 } },
                { result: "strike", count: { balls: 1, strikes: 1 } },
                { result: "ball", count: { balls: 2, strikes: 1 } },
                { result: "hit", count: { balls: 2, strikes: 1 } },
              ],
              outs: 0,
              rbis: 1,
              hitDirection: "left",
              hitType: "liner",
              position: "LF",
              runnerAdvances: [
                {
                  runnerId: "BR",
                  fromBase: 0,
                  toBase: 2,
                  scored: false,
                  out: false,
                  runnerName: "打者5",
                },
                {
                  runnerId: "R1",
                  fromBase: 1,
                  toBase: 4,
                  scored: true,
                  out: false,
                  runnerName: "打者4",
                },
              ],
            },
            {
              batterName: "打者6",
              battingResult: "groundout",
              pitches: [
                { result: "strike", count: { balls: 0, strikes: 1 } },
                { result: "hit", count: { balls: 0, strikes: 1 } },
              ],
              outs: 1,
              rbis: 0,
              hitDirection: "center",
              position: "SS",
            },
            {
              batterName: "打者7",
              battingResult: "flyout",
              pitches: [
                { result: "ball", count: { balls: 1, strikes: 0 } },
                { result: "strike", count: { balls: 1, strikes: 1 } },
                { result: "hit", count: { balls: 1, strikes: 1 } },
              ],
              outs: 1,
              rbis: 0,
              hitDirection: "right",
              position: "RF",
            },
            {
              batterName: "打者8",
              battingResult: "strikeout",
              pitches: [
                { result: "strike", count: { balls: 0, strikes: 1 } },
                { result: "ball", count: { balls: 1, strikes: 1 } },
                { result: "strike", count: { balls: 1, strikes: 2 } },
                { result: "strike", count: { balls: 1, strikes: 3 } },
              ],
              outs: 1,
              rbis: 0,
            },
          ],
        },
        {
          inningNumber: 2,
          topBottom: "top",
          score: 1,
          atBats: [
            {
              batterName: "打者4",
              battingResult: "single",
              pitches: [
                { result: "ball", count: { balls: 1, strikes: 0 } },
                { result: "hit", count: { balls: 1, strikes: 0 } },
              ],
              outs: 0,
              rbis: 0,
              hitDirection: "center",
              hitType: "grounder",
              position: "P",
              runnerAdvances: [
                {
                  runnerId: "BR",
                  fromBase: 0,
                  toBase: 1,
                  scored: false,
                  out: false,
                  runnerName: "打者4",
                },
              ],
            },
            {
              batterName: "打者5",
              battingResult: "homerun",
              pitches: [
                { result: "strike", count: { balls: 0, strikes: 1 } },
                { result: "ball", count: { balls: 1, strikes: 1 } },
                { result: "hit", count: { balls: 1, strikes: 1 } },
              ],
              outs: 0,
              rbis: 2,
              hitDirection: "center",
              hitType: "fly",
              position: "CF",
              runnerAdvances: [
                {
                  runnerId: "BR",
                  fromBase: 0,
                  toBase: 4,
                  scored: true,
                  out: false,
                  runnerName: "打者5",
                },
                {
                  runnerId: "R1",
                  fromBase: 1,
                  toBase: 4,
                  scored: true,
                  out: false,
                  runnerName: "打者4",
                },
              ],
            },
            {
              batterName: "打者6",
              battingResult: "strikeout",
              pitches: [
                { result: "strike", count: { balls: 0, strikes: 1 } },
                { result: "strike", count: { balls: 0, strikes: 2 } },
                { result: "strike", count: { balls: 0, strikes: 3 } },
              ],
              outs: 1,
              rbis: 0,
            },
            {
              batterName: "打者7",
              battingResult: "groundout",
              pitches: [{ result: "hit", count: { balls: 0, strikes: 0 } }],
              outs: 1,
              rbis: 0,
              hitDirection: "left",
              position: "3B",
            },
            {
              batterName: "打者8",
              battingResult: "flyout",
              pitches: [
                { result: "ball", count: { balls: 1, strikes: 0 } },
                { result: "hit", count: { balls: 1, strikes: 0 } },
              ],
              outs: 1,
              rbis: 0,
              hitDirection: "center",
              position: "CF",
            },
          ],
        },
      ],
      hits: {
        myTeam: 8,
        opponent: 6,
      },
      errors: {
        myTeam: 0,
        opponent: 1,
      },
    },
  };

  await new Promise((resolve) => setTimeout(resolve, 500));

  const game = mockData[gameId];
  if (!game) {
    throw new Error("Game not found");
  }
  return game;
};

const RecordDetails = () => {
  const navigate = useNavigate();
  const gameId = "1";
  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInning, setSelectedInning] = useState<number>(1);
  const [selectedTopBottom, setSelectedTopBottom] = useState<"top" | "bottom">(
    "top"
  );

  const handleBackClick = () => {
    navigate("/records");
  };

  useEffect(() => {
    const loadGame = async () => {
      if (!gameId) {
        setError("試合IDが指定されていません");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchGameDetail(gameId);
        setGame(data);
      } catch (err) {
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  // ★ ヘルパー関数: イニングの得点を計算
  const getRunsInInning = (inning: Inning): number => {
    // Inning.score を利用（runnerAdvances からも計算可能だが、既にある値を使う）
    return inning.score;
  };

  // ★ ヘルパー関数: イニングの安打数を計算
  const getHitsInInning = (inning: Inning): number => {
    return inning.atBats.filter((atBat) =>
      ["single", "double", "triple", "homerun"].includes(atBat.battingResult)
    ).length;
  };

  // ★ ヘルパー関数: 得点シーンかどうかを判定
  const isScoringAtBat = (atBat: AtBat): boolean => {
    if (atBat.rbis > 0) return true;
    if (atBat.runnerAdvances && atBat.runnerAdvances.some((ra) => ra.scored))
      return true;
    return false;
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "WIN":
        return "bg-green-900/30 text-green-400 border-green-700";
      case "LOSE":
        return "bg-red-900/30 text-red-400 border-red-700";
      case "DRAW":
        return "bg-neutral-800 text-neutral-400 border-neutral-600";
      default:
        return "bg-neutral-800 text-neutral-400 border-neutral-600";
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "WIN":
        return "勝利";
      case "LOSE":
        return "敗北";
      case "DRAW":
        return "引き分け";
      default:
        return "-";
    }
  };

  const getPitchResultLabel = (result: string) => {
    const labels: Record<string, string> = {
      ball: "ボール",
      strike: "ストライク",
      swingingMiss: "空振り",
      calledStrike: "見逃し",
      foul: "ファウル",
      hit: "打球",
      hitByPitch: "死球",
    };
    return labels[result] || result;
  };

  const getBattingResultLabel = (result: string) => {
    const labels: Record<string, string> = {
      single: "単打",
      double: "二塁打",
      triple: "三塁打",
      homerun: "本塁打",
      walk: "四球",
      hitByPitch: "死球",
      strikeout: "三振",
      groundout: "ゴロアウト",
      flyout: "フライアウト",
      lineout: "ライナーアウト",
      sacrificeBunt: "犠打",
      sacrificeFly: "犠飛",
      doublePlay: "併殺打",
      fieldersChoice: "野選",
    };
    return labels[result] || result;
  };

  const getHitDirectionLabel = (direction?: string) => {
    const labels: Record<string, string> = {
      left: "左方向",
      center: "中央",
      right: "右方向",
      leftCenter: "左中間",
      rightCenter: "右中間",
    };
    return direction ? labels[direction] || direction : "";
  };

  const getHitTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      grounder: "ゴロ",
      liner: "ライナー",
      fly: "フライ",
    };
    return type ? labels[type] || type : "";
  };

  const getPositionLabel = (position?: string) => {
    const labels: Record<string, string> = {
      P: "投手",
      C: "捕手",
      "1B": "一塁手",
      "2B": "二塁手",
      "3B": "三塁手",
      SS: "遊撃手",
      LF: "左翼手",
      CF: "中堅手",
      RF: "右翼手",
    };
    return position ? labels[position] || position : "";
  };

  const getInningScore = (
    inningNumber: number,
    topBottom: "top" | "bottom"
  ) => {
    const inning = game?.innings.find(
      (i) => i.inningNumber === inningNumber && i.topBottom === topBottom
    );
    return inning?.score ?? "-";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4 text-lg">
            {error || "データが見つかりません"}
          </div>
          <button
            onClick={handleBackClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            戦績一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const currentInning = game.innings.find(
    (i) =>
      i.inningNumber === selectedInning && i.topBottom === selectedTopBottom
  );

  // 最終回を取得（9回未満でも最終回まで表示）
  const maxInning = Math.max(9, ...game.innings.map((i) => i.inningNumber));

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <button
          onClick={handleBackClick}
          className="mb-6 px-4 py-2 text-blue-400 hover:text-blue-300 font-medium flex items-center gap-2 transition-colors"
        >
          ← 戦績一覧に戻る
        </button>

        {/* ヘッダー部分 */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">{game.date}</div>
              <div className="text-xl font-bold text-white mb-1">
                {game.competitionName}
              </div>
              <div className="text-sm text-gray-400">{game.ballpark}</div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg border font-bold ${getResultColor(
                game.result
              )}`}
            >
              {getResultLabel(game.result)}
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-center gap-4 md:gap-8 text-center flex-wrap">
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  {game.isHome ? "ホーム" : "ビジター"}
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  {game.myTeamName}
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white">
                {game.myScore}
              </div>
              <div className="text-xl md:text-2xl text-gray-600">-</div>
              <div className="text-3xl md:text-4xl font-bold text-white">
                {game.opponentScore}
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  {game.isHome ? "ビジター" : "ホーム"}
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  {game.opponentTeamName}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-purple-700/70 p-4 mb-6">
          <div className="text-sm text-purple-300 font-semibold mb-2">
            AI試合分析
          </div>
          <ul className="text-sm text-gray-200 space-y-1">
            <li>・初回の長打で先制できたことが勝因となりました。</li>
            <li>
              ・◯〜△回の間、走者を出しながら得点できなかったことが課題です。
            </li>
            <li>
              ・被安打に対して失点が少なく、守備と投手がよく踏ん張りました。
            </li>
          </ul>
        </div>

        {/* スコアボード表示 */}
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-4 mb-6 overflow-x-auto">
          <div className="text-sm text-gray-400 mb-2">
            ※ 各イニングをクリックすると詳細が表示されます
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-300">
                  回
                </th>
                {Array.from({ length: maxInning }, (_, i) => i + 1).map(
                  (inning) => (
                    <th
                      key={inning}
                      className="text-center py-2 px-3 font-medium text-gray-300"
                    >
                      {inning}
                    </th>
                  )
                )}
                <th className="text-center py-2 px-3 font-bold text-white border-l border-gray-700">
                  R
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-2 px-3 font-medium text-white">
                  {game.isHome ? game.opponentTeamName : game.myTeamName}
                </td>
                {Array.from({ length: maxInning }, (_, i) => i + 1).map(
                  (inning) => (
                    <td
                      key={inning}
                      onClick={() => {
                        setSelectedInning(inning);
                        setSelectedTopBottom("top");
                      }}
                      className={`text-center py-2 px-3 cursor-pointer transition-colors ${
                        selectedInning === inning && selectedTopBottom === "top"
                          ? "bg-blue-600 text-white font-bold"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      {getInningScore(inning, "top")}
                    </td>
                  )
                )}
                <td className="text-center py-2 px-3 font-bold text-white border-l border-gray-700">
                  {game.isHome ? game.opponentScore : game.myScore}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium text-white">
                  {game.isHome ? game.myTeamName : game.opponentTeamName}
                </td>
                {Array.from({ length: maxInning }, (_, i) => i + 1).map(
                  (inning) => (
                    <td
                      key={inning}
                      onClick={() => {
                        setSelectedInning(inning);
                        setSelectedTopBottom("bottom");
                      }}
                      className={`text-center py-2 px-3 cursor-pointer transition-colors ${
                        selectedInning === inning &&
                        selectedTopBottom === "bottom"
                          ? "bg-blue-600 text-white font-bold"
                          : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      {getInningScore(inning, "bottom")}
                    </td>
                  )
                )}
                <td className="text-center py-2 px-3 font-bold text-white border-l border-gray-700">
                  {game.isHome ? game.myScore : game.opponentScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 打席詳細 */}
        {currentInning ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {selectedInning}回{selectedTopBottom === "top" ? "表" : "裏"} -
                打席詳細
              </h2>
            </div>

            {/* ★ イニングサマリー表示 */}
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-4">
              <div className="flex items-center gap-6 flex-wrap text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">この回の得点:</span>
                  <span className="text-white font-bold text-lg">
                    {getRunsInInning(currentInning)}点
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">安打:</span>
                  <span className="text-white font-bold text-lg">
                    {getHitsInInning(currentInning)}本
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">打席数:</span>
                  <span className="text-white font-bold text-lg">
                    {currentInning.atBats.length}
                  </span>
                </div>
              </div>
            </div>

            {currentInning.atBats.map((atBat, index) => {
              const isScoring = isScoringAtBat(atBat);
              return (
                <div
                  key={index}
                  className={`bg-gray-900 rounded-xl p-6 transition-all ${
                    isScoring
                      ? "border-2 border-yellow-400/70 shadow-lg shadow-yellow-500/20"
                      : "border border-gray-700"
                  }`}
                >
                  {/* ★ 得点シーンバッジ */}
                  {isScoring && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-400/50">
                        ⚡ 得点シーン
                      </span>
                    </div>
                  )}

                  {/* ★ 一行サマリー */}
                  <div className="mb-4 pb-4 border-b border-gray-700">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-gray-400 text-sm">
                          {index + 1}打席目
                        </span>
                        <span className="text-lg font-bold text-white">
                          {atBat.batterName}
                        </span>
                        <span
                          className={`text-sm font-medium px-3 py-1 rounded ${
                            atBat.battingResult === "single" ||
                            atBat.battingResult === "double" ||
                            atBat.battingResult === "triple" ||
                            atBat.battingResult === "homerun"
                              ? "bg-green-900/30 text-green-400"
                              : atBat.battingResult === "walk" ||
                                atBat.battingResult === "hitByPitch"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-red-900/30 text-red-400"
                          }`}
                        >
                          {getBattingResultLabel(atBat.battingResult)}
                        </span>
                      </div>
                      {atBat.rbis > 0 && (
                        <span className="text-yellow-400 font-bold text-lg">
                          {atBat.rbis}打点
                        </span>
                      )}
                    </div>
                    {/* ★ 打球の詳細情報 */}
                    {(atBat.position || atBat.hitType) && (
                      <div className="mt-3 flex items-center gap-4 flex-wrap">
                        {atBat.position && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">打球方向:</span>
                            <span className="text-blue-300 font-medium bg-blue-900/20 px-3 py-1 rounded">
                              {getPositionLabel(atBat.position)}
                            </span>
                          </div>
                        )}
                        {atBat.hitType && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">打球タイプ:</span>
                            <span className="text-purple-300 font-medium bg-purple-900/20 px-3 py-1 rounded">
                              {getHitTypeLabel(atBat.hitType)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 投球記録 */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-400 mb-2">
                      投球記録:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {atBat.pitches.map((pitch, pitchIndex) => (
                        <div
                          key={pitchIndex}
                          className="bg-gray-800 rounded-lg px-3 py-2 text-sm"
                        >
                          <div className="text-white font-medium">
                            {pitchIndex + 1}球目:{" "}
                            {getPitchResultLabel(pitch.result)}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            {pitch.count.balls}B-{pitch.count.strikes}S
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 走者進塁 */}
                  {atBat.runnerAdvances && atBat.runnerAdvances.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-400 mb-2">
                        走者進塁:
                      </div>
                      <div className="space-y-2">
                        {atBat.runnerAdvances.map((advance, advIndex) => (
                          <div
                            key={advIndex}
                            className={`rounded-lg px-4 py-2 text-sm flex items-center justify-between ${
                              advance.scored
                                ? "bg-green-900/30 border border-green-700/50"
                                : "bg-gray-800"
                            }`}
                          >
                            <span className="text-white font-medium">
                              {advance.runnerName}
                            </span>
                            <span className="text-gray-400">
                              {advance.fromBase === 0
                                ? "打席"
                                : `${advance.fromBase}塁`}{" "}
                              →
                              {advance.toBase === 4
                                ? "本塁"
                                : `${advance.toBase}塁`}
                            </span>
                            {advance.scored && (
                              <span className="text-green-400 font-bold">
                                ⚾ 得点
                              </span>
                            )}
                            {advance.out && (
                              <span className="text-red-400 font-medium">
                                アウト
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 text-center text-gray-400">
            このイニングのデータはありません
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordDetails;
