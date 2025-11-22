import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 型定義
interface GameSummary {
  id: string;
  date: string;
  competitionName: string;
  ballpark: string;
  opponent: string;
  myScore: number;
  opponentScore: number;
  result: "WIN" | "LOSE" | "DRAW";
}

// モックデータ生成関数
const fetchGameSummaries = async (): Promise<GameSummary[]> => {
  // 実際のAPIコールの代わりにモックデータを返す
  return [
    {
      id: "1",
      date: "2024-11-20",
      competitionName: "秋季リーグ",
      ballpark: "東京ドーム",
      opponent: "ライバルズ",
      myScore: 5,
      opponentScore: 3,
      result: "WIN",
    },
    {
      id: "2",
      date: "2024-11-15",
      competitionName: "秋季リーグ",
      ballpark: "神宮球場",
      opponent: "イーグルス",
      myScore: 2,
      opponentScore: 4,
      result: "LOSE",
    },
    {
      id: "3",
      date: "2024-11-10",
      competitionName: "練習試合",
      ballpark: "横浜スタジアム",
      opponent: "ベイスターズ",
      myScore: 3,
      opponentScore: 3,
      result: "DRAW",
    },
    {
      id: "4",
      date: "2024-11-05",
      competitionName: "秋季リーグ",
      ballpark: "甲子園",
      opponent: "タイガース",
      myScore: 6,
      opponentScore: 2,
      result: "WIN",
    },
    {
      id: "5",
      date: "2024-10-30",
      competitionName: "練習試合",
      ballpark: "東京ドーム",
      opponent: "ジャイアンツ",
      myScore: 1,
      opponentScore: 5,
      result: "LOSE",
    },
  ];
};

// ★ 直近5試合の傾向から簡易コメントを作るヘルパー
const buildRecentAiInsights = (recentGames: GameSummary[]): string[] => {
  if (recentGames.length === 0) {
    return ["試合データがまだないため、分析できません。"];
  }

  const total = recentGames.length;
  const wins = recentGames.filter((g) => g.result === "WIN").length;
  const losses = recentGames.filter((g) => g.result === "LOSE").length;
  const draws = recentGames.filter((g) => g.result === "DRAW").length;

  const totalRunsFor = recentGames.reduce((sum, g) => sum + g.myScore, 0);
  const totalRunsAgainst = recentGames.reduce(
    (sum, g) => sum + g.opponentScore,
    0
  );

  const avgFor = totalRunsFor / total;
  const avgAgainst = totalRunsAgainst / total;
  const winRate = wins / total;

  const insights: string[] = [];

  // 勝敗傾向
  if (winRate >= 0.7) {
    insights.push(
      `直近${total}試合で ${wins}勝${losses}敗${draws}分 と好調です。現在の戦い方を継続できると、シーズンを通して安定した成績が期待できます。`
    );
  } else if (winRate <= 0.3) {
    insights.push(
      `直近${total}試合で ${wins}勝${losses}敗${draws}分 とやや苦しい戦いが続いています。敗戦時の失点パターンを振り返ることで改善ポイントが見えてきそうです。`
    );
  } else {
    insights.push(
      `直近${total}試合の成績は ${wins}勝${losses}敗${draws}分 です。勝ち試合・負け試合の内容を分けて振り返ると、強みと課題が明確になります。`
    );
  }

  // 得点力
  if (avgFor >= 5) {
    insights.push(
      `平均得点は ${avgFor.toFixed(
        1
      )} 点と高く、打線は非常に好調です。上位打線だけでなく、下位打線が繋がっている可能性があります。`
    );
  } else if (avgFor <= 2) {
    insights.push(
      `平均得点は ${avgFor.toFixed(
        1
      )} 点とやや低めです。得点圏での打席内容や、出塁後の走塁パターンを見直すことで、効率よく得点を重ねられる余地があります。`
    );
  } else {
    insights.push(
      `平均得点は ${avgFor.toFixed(
        1
      )} 点で、極端な得点の偏りは見られません。あと一歩で試合を決める「あと1点」をどう取るかが鍵になりそうです。`
    );
  }

  // 失点傾向
  if (avgAgainst >= 5) {
    insights.push(
      `平均失点は ${avgAgainst.toFixed(
        1
      )} 点とやや多めです。先発投手の立ち上がりや、終盤の継投タイミングを振り返ると改善ポイントが見つかるかもしれません。`
    );
  } else if (avgAgainst <= 2) {
    insights.push(
      `平均失点は ${avgAgainst.toFixed(
        1
      )} 点と非常に少なく、投手陣と守備は安定しています。僅差の展開でも落ち着いて戦えている状態と言えます。`
    );
  } else {
    insights.push(
      `平均失点は ${avgAgainst.toFixed(
        1
      )} 点です。大崩れは少ないものの、失点に繋がる四死球やエラーの有無を確認すると、さらに失点を減らせる可能性があります。`
    );
  }

  return insights;
};

const Records = () => {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        const data = await fetchGameSummaries();
        // 日付降順でソート
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setGames(sorted);
      } catch (err) {
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  // 集計値の計算
  const totalGames = games.length;
  const wins = games.filter((g) => g.result === "WIN").length;
  const losses = games.filter((g) => g.result === "LOSE").length;
  const draws = games.filter((g) => g.result === "DRAW").length;
  const winRate =
    totalGames > 0 ? Math.round((wins / totalGames) * 1000) / 1000 : 0;

  const handleGameClick = (gameId: string) => {
    navigate(`/results/${gameId}`);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "WIN":
        return "bg-green-600 text-white border-green-500";
      case "LOSE":
        return "bg-red-600 text-white border-red-500";
      case "DRAW":
        return "bg-gray-600 text-white border-gray-500";
      default:
        return "bg-gray-600 text-white border-gray-500";
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case "WIN":
        return "勝";
      case "LOSE":
        return "負";
      case "DRAW":
        return "分";
      default:
        return "-";
    }
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

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  // ★ 直近5試合を抽出（表示は全件でも、分析だけ5試合）
  const recentGames = games.slice(0, 5);
  const recentInsights = buildRecentAiInsights(recentGames);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* ページタイトル */}
        <h1 className="text-3xl font-bold mb-6">戦績一覧</h1>

        {/* 集計情報 */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">総試合数</div>
              <div className="text-2xl font-bold text-white">{totalGames}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">勝</div>
              <div className="text-2xl font-bold text-green-500">{wins}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">負</div>
              <div className="text-2xl font-bold text-red-500">{losses}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">分</div>
              <div className="text-2xl font-bold text-gray-400">{draws}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">勝率</div>
              <div className="text-2xl font-bold text-blue-400">
                {winRate.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* ★ 直近5試合 AI分析カード */}
        <div className="bg-gray-900 rounded-lg border border-purple-700/60 p-6 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/60">
                AI分析（β）
              </span>
              <h2 className="text-lg font-bold text-white">
                直近5試合の傾向分析
              </h2>
            </div>
            <div className="text-xs text-gray-500">
              対象: 直近 {recentGames.length} 試合
            </div>
          </div>

          <ul className="list-disc list-inside space-y-1 text-sm text-gray-200">
            {recentInsights.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>

        {/* 試合一覧 */}
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game.id)}
              className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-500 hover:bg-gray-800 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm text-gray-400">{game.date}</span>
                    <span className="text-sm font-medium text-gray-300">
                      {game.competitionName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {game.ballpark}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-lg font-bold text-white">
                      vs {game.opponent}
                    </span>
                    <span className="text-xl font-bold text-white">
                      {game.myScore} - {game.opponentScore}
                    </span>
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg border font-bold text-lg min-w-[60px] text-center ${getResultColor(
                    game.result
                  )}`}
                >
                  {getResultLabel(game.result)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {games.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            試合データがありません
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
