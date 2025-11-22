import React, { useState } from "react";

// サンプルデータ
const samplePlayers = [
  {
    id: 1,
    name: "山田太郎",
    number: 4,
    position: "内野手",
    batting: {
      games: 15,
      atBats: 52,
      hits: 18,
      doubles: 4,
      triples: 1,
      homeRuns: 2,
      rbis: 12,
      runs: 9,
      walks: 8,
      strikeouts: 11,
      stolenBases: 3,
      avg: 0.346,
      obp: 0.433,
      slg: 0.538,
    },
    pitching: null,
  },
  {
    id: 2,
    name: "鈴木一郎",
    number: 1,
    position: "投手",
    batting: {
      games: 12,
      atBats: 8,
      hits: 1,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbis: 0,
      runs: 0,
      walks: 0,
      strikeouts: 5,
      stolenBases: 0,
      avg: 0.125,
      obp: 0.125,
      slg: 0.125,
    },
    pitching: {
      games: 12,
      wins: 7,
      losses: 3,
      saves: 0,
      holds: 0,
      innings: 68.1,
      hits: 58,
      runs: 24,
      earnedRuns: 20,
      walks: 18,
      strikeouts: 72,
      homeRuns: 4,
      era: 2.63,
      whip: 1.11,
    },
  },
  {
    id: 3,
    name: "佐藤健",
    number: 9,
    position: "外野手",
    batting: {
      games: 14,
      atBats: 48,
      hits: 14,
      doubles: 2,
      triples: 0,
      homeRuns: 1,
      rbis: 8,
      runs: 11,
      walks: 12,
      strikeouts: 8,
      stolenBases: 7,
      avg: 0.292,
      obp: 0.417,
      slg: 0.396,
    },
    pitching: null,
  },
];

const Stats: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState(samplePlayers[0]);
  const [activeTab, setActiveTab] = useState<"batting" | "pitching">("batting");

  return (
    // ダークテーマに統一: bg-black, text-white
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* ヘッダー: bg-gray-900に変更 */}
        <div className="bg-gray-900 rounded-lg shadow-md p-6 mb-4 border border-gray-800">
          <h1 className="text-2xl font-bold mb-4 text-gray-100">個人成績</h1>

          {/* 選手選択 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              選手を選択
            </label>
            <select
              value={selectedPlayer.id}
              onChange={(e) => {
                const player = samplePlayers.find(
                  (p) => p.id === Number(e.target.value)
                );
                if (player) {
                  setSelectedPlayer(player);
                  setActiveTab(player.pitching ? "pitching" : "batting");
                }
              }}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {samplePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  #{player.number} {player.name} ({player.position})
                </option>
              ))}
            </select>
          </div>

          {/* 選手情報: bg-gray-800に変更 */}
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between border border-gray-700">
            <div>
              <div className="text-3xl font-bold text-blue-400">
                #{selectedPlayer.number} {selectedPlayer.name}
              </div>
              <div className="text-lg text-blue-300 mt-1">
                {selectedPlayer.position}
              </div>
            </div>
          </div>
        </div>

        {/* タブ: bg-gray-900に変更 */}
        <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden mb-4 border border-gray-800">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab("batting")}
              className={`flex-1 py-3 px-4 font-medium transition-colors ${
                activeTab === "batting"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-gray-300 hover:bg-gray-800"
              }`}
            >
              打撃成績
            </button>
            {selectedPlayer.pitching && (
              <button
                onClick={() => setActiveTab("pitching")}
                className={`flex-1 py-3 px-4 font-medium transition-colors ${
                  activeTab === "pitching"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 text-gray-300 hover:bg-gray-800"
                }`}
              >
                投手成績
              </button>
            )}
          </div>

          {/* 打撃成績 */}
          {activeTab === "batting" && selectedPlayer.batting && (
            <div className="p-6">
              {/* 主要指標: グラデーションはそのまま維持 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">打率</div>
                  <div className="text-3xl font-bold">
                    {selectedPlayer.batting.avg.toFixed(3)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">出塁率</div>
                  <div className="text-3xl font-bold">
                    {selectedPlayer.batting.obp.toFixed(3)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">長打率</div>
                  <div className="text-3xl font-bold">
                    {selectedPlayer.batting.slg.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* 詳細成績 */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4 text-gray-100 border-b border-gray-700 pb-2">
                  詳細成績
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <StatRow
                    label="試合数"
                    value={selectedPlayer.batting.games}
                  />
                  <StatRow label="打数" value={selectedPlayer.batting.atBats} />
                  <StatRow label="安打" value={selectedPlayer.batting.hits} />
                  <StatRow
                    label="二塁打"
                    value={selectedPlayer.batting.doubles}
                  />
                  <StatRow
                    label="三塁打"
                    value={selectedPlayer.batting.triples}
                  />
                  <StatRow
                    label="本塁打"
                    value={selectedPlayer.batting.homeRuns}
                    highlight
                  />
                  <StatRow
                    label="打点"
                    value={selectedPlayer.batting.rbis}
                    highlight
                  />
                  <StatRow label="得点" value={selectedPlayer.batting.runs} />
                  <StatRow label="四球" value={selectedPlayer.batting.walks} />
                  <StatRow
                    label="三振"
                    value={selectedPlayer.batting.strikeouts}
                  />
                  <StatRow
                    label="盗塁"
                    value={selectedPlayer.batting.stolenBases}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 投手成績 */}
          {activeTab === "pitching" && selectedPlayer.pitching && (
            <div className="p-6">
              {/* 主要指標: グラデーションはそのまま維持 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">防御率</div>
                  <div className="text-3xl font-bold">
                    {selectedPlayer.pitching.era.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">勝利</div>
                  <div className="text-3xl font-bold">
                    {selectedPlayer.pitching.wins}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">WHIP</div>
                  <div className="text-3xl font-bold">
                    {selectedPlayer.pitching.whip.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* 詳細成績 */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4 text-gray-100 border-b border-gray-700 pb-2">
                  詳細成績
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <StatRow
                    label="試合数"
                    value={selectedPlayer.pitching.games}
                  />
                  <StatRow
                    label="勝利"
                    value={selectedPlayer.pitching.wins}
                    highlight
                  />
                  <StatRow
                    label="敗北"
                    value={selectedPlayer.pitching.losses}
                  />
                  <StatRow
                    label="セーブ"
                    value={selectedPlayer.pitching.saves}
                  />
                  <StatRow
                    label="ホールド"
                    value={selectedPlayer.pitching.holds}
                  />
                  <StatRow
                    label="投球回"
                    value={selectedPlayer.pitching.innings}
                  />
                  <StatRow
                    label="被安打"
                    value={selectedPlayer.pitching.hits}
                  />
                  <StatRow label="失点" value={selectedPlayer.pitching.runs} />
                  <StatRow
                    label="自責点"
                    value={selectedPlayer.pitching.earnedRuns}
                  />
                  <StatRow label="四球" value={selectedPlayer.pitching.walks} />
                  <StatRow
                    label="奪三振"
                    value={selectedPlayer.pitching.strikeouts}
                    highlight
                  />
                  <StatRow
                    label="被本塁打"
                    value={selectedPlayer.pitching.homeRuns}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 注釈: ダークテーマ対応 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-300">
            <span className="font-semibold">※</span>{" "}
            これはサンプルデータです。実際のデータと連携することで、リアルタイムの成績を表示できます。
          </p>
        </div>
      </div>
    </div>
  );
};

// 成績行コンポーネント: ダークテーマ対応
const StatRow: React.FC<{
  label: string;
  value: number | string;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => {
  return (
    <div
      className={`flex justify-between items-center py-2 px-3 rounded ${
        highlight
          ? "bg-yellow-900/30 border border-yellow-500/60"
          : "bg-gray-800 border border-gray-700"
      }`}
    >
      <span
        className={`font-medium ${
          highlight ? "text-yellow-300" : "text-gray-300"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-bold ${
          highlight ? "text-yellow-200 text-lg" : "text-gray-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default Stats;
