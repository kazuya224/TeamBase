import React, { useState, useEffect } from "react";
import { Game, Inning, AtBat, BattingResult, RunnerAdvance } from "../types";
import RunnerAdvanceModal from "../Components/RunnerAdvanceModal";

const ScoreInput: React.FC = () => {
  // 初期の打順（例：9人）
  const [lineup, setLineup] = useState<string[]>([
    "打者1",
    "打者2",
    "打者3",
    "打者4",
    "打者5",
    "打者6",
    "打者7",
    "打者8",
    "打者9",
  ]);

  // 試合情報の初期化
  const [game, setGame] = useState<Game>({
    id: "1",
    date: new Date().toISOString().split("T")[0],
    homeTeam: "ホーム",
    awayTeam: "ビジター",
    innings: [],
    currentInning: 1,
    currentTopBottom: "top",
    homeScore: 0,
    awayScore: 0,
    lineup,
  });

  const [currentBatterIndex, setCurrentBatterIndex] = useState(0);
  const [currentOuts, setCurrentOuts] = useState(0);
  const [isRunnerModalOpen, setIsRunnerModalOpen] = useState(false);
  const [lastAtBatBatterName, setLastAtBatBatterName] = useState<string>("");

  // 打撃結果のボタン定義
  const battingResultOptions: {
    value: BattingResult;
    label: string;
    color: string;
  }[] = [
    { value: "single", label: "単打", color: "bg-green-500" },
    { value: "double", label: "二塁打", color: "bg-blue-500" },
    { value: "triple", label: "三塁打", color: "bg-purple-500" },
    { value: "homerun", label: "本塁打", color: "bg-red-500" },
    { value: "walk", label: "四球", color: "bg-yellow-500" },
    { value: "hitByPitch", label: "死球", color: "bg-orange-500" },
    { value: "strikeout", label: "三振", color: "bg-gray-500" },
    { value: "doublePlay", label: "併殺打", color: "bg-gray-600" },
    { value: "sacrificeBunt", label: "犠打", color: "bg-teal-500" },
    { value: "sacrificeFly", label: "犠牲フライ", color: "bg-cyan-500" },
    { value: "fieldersChoice", label: "野選", color: "bg-indigo-500" },
    { value: "error", label: "失策", color: "bg-pink-500" },
  ];

  // 現在のイニングを取得または作成
  const getCurrentInning = (): Inning => {
    let inning = game.innings.find(
      (i) =>
        i.inningNumber === game.currentInning &&
        i.topBottom === game.currentTopBottom
    );

    if (!inning) {
      inning = {
        inningNumber: game.currentInning,
        topBottom: game.currentTopBottom,
        atBats: [],
        score: 0,
        outs: currentOuts,
      };
      setGame((prev) => ({
        ...prev,
        innings: [
          ...prev.innings.filter((i) => i !== undefined),
          inning,
        ] as Inning[],
      }));
    }

    return inning;
  };

  // 現在の走者を計算（簡易実装）
  const getCurrentRunners = (): { base: 1 | 2 | 3; name: string }[] => {
    const currentInning = getCurrentInning();
    const runners: { base: 1 | 2 | 3; name: string }[] = [];

    // 簡易実装：実際の実装では、各打席の進塁情報から
    // 現在の走者を正確に計算する必要があります
    // ここでは簡略化のため、空の配列を返します
    // TODO: 走者情報の正確な計算を実装

    return runners;
  };

  // 打撃結果を記録
  const handleBattingResult = (result: BattingResult) => {
    const currentInning = getCurrentInning();
    const currentBatter = lineup[currentBatterIndex];

    // アウト数の計算
    let outs = 0;
    if (result === "strikeout" || result === "doublePlay") {
      outs = result === "doublePlay" ? 2 : 1;
    } else if (result === "sacrificeBunt" || result === "sacrificeFly") {
      outs = 1;
    }

    const atBat: AtBat = {
      batterName: currentBatter,
      battingResult: result,
      outs,
      rbis: 0, // 後で計算
    };

    // 走者進塁モーダルを開く（単打、二塁打、三塁打、本塁打、犠牲フライの場合）
    if (
      ["single", "double", "triple", "homerun", "sacrificeFly"].includes(result)
    ) {
      // まず打席を保存（打順は進めない）
      saveAtBatWithPending(atBat, false);
      // モーダルを開く前に打者名を保存
      setLastAtBatBatterName(currentBatter);
      setIsRunnerModalOpen(true);
    } else {
      // 走者進塁がない場合は即座に保存
      saveAtBatWithPending(atBat);
    }
  };

  // 打席を保存（進塁情報は後で追加される可能性がある）
  const saveAtBatWithPending = (
    atBat: AtBat,
    shouldAdvanceBatter: boolean = true
  ) => {
    const currentInning = getCurrentInning();
    const updatedInning = {
      ...currentInning,
      atBats: [...currentInning.atBats, atBat],
      outs: (currentOuts + atBat.outs) % 3,
    };

    updateInningAndGame(updatedInning);

    if (shouldAdvanceBatter) {
      // アウト数が3になったら次のイニングへ
      const newOuts = currentOuts + atBat.outs;
      if (newOuts >= 3) {
        nextInning();
      } else {
        advanceBatter();
      }
    }
  };

  // 走者進塁情報を保存
  const handleSaveRunnerAdvances = (advances: RunnerAdvance[]) => {
    const currentInning = getCurrentInning();
    const currentBatter = lastAtBatBatterName;

    if (!currentBatter) {
      setIsRunnerModalOpen(false);
      return;
    }

    // 最後の打席を探して更新
    const updatedAtBats = [...currentInning.atBats];
    const lastIndex = updatedAtBats.length - 1;

    if (
      lastIndex >= 0 &&
      updatedAtBats[lastIndex].batterName === currentBatter
    ) {
      const scoredCount = advances.filter((a) => a.scored).length;
      updatedAtBats[lastIndex] = {
        ...updatedAtBats[lastIndex],
        runnerAdvances: advances,
        rbis: scoredCount,
      };

      const updatedInning = {
        ...currentInning,
        atBats: updatedAtBats,
        score: currentInning.score + scoredCount,
      };

      updateInningAndGame(updatedInning);

      // 打順を進める
      const lastAtBat = updatedAtBats[lastIndex];
      const newOuts = currentOuts + lastAtBat.outs;
      if (newOuts >= 3) {
        nextInning();
      } else {
        advanceBatter();
      }
    }

    setIsRunnerModalOpen(false);
    setLastAtBatBatterName("");
  };

  // イニングとゲーム情報を更新
  const updateInningAndGame = (updatedInning: Inning) => {
    setGame((prev) => {
      const updatedInnings = prev.innings.map((i) =>
        i.inningNumber === updatedInning.inningNumber &&
        i.topBottom === updatedInning.topBottom
          ? updatedInning
          : i
      );

      // スコアを再計算
      let homeScore = 0;
      let awayScore = 0;
      updatedInnings.forEach((inning) => {
        if (inning.topBottom === "top") {
          awayScore += inning.score;
        } else {
          homeScore += inning.score;
        }
      });

      return {
        ...prev,
        innings: updatedInnings,
        homeScore,
        awayScore,
      };
    });

    setCurrentOuts(updatedInning.outs % 3);
  };

  // 打順を進める
  const advanceBatter = () => {
    setCurrentBatterIndex((prev) => (prev + 1) % lineup.length);
  };

  // 次のイニングへ
  const nextInning = () => {
    setGame((prev) => ({
      ...prev,
      currentTopBottom: prev.currentTopBottom === "top" ? "bottom" : "top",
      currentInning:
        prev.currentTopBottom === "bottom"
          ? prev.currentInning + 1
          : prev.currentInning,
    }));
    setCurrentOuts(0);
  };

  // イニング切り替え
  const switchInning = (inning: number, topBottom: "top" | "bottom") => {
    setGame((prev) => ({
      ...prev,
      currentInning: inning,
      currentTopBottom: topBottom,
    }));
  };

  // 途中保存
  const handleSave = () => {
    const gameData = JSON.stringify(game, null, 2);
    localStorage.setItem("baseballGame", gameData);
    alert("保存しました");
  };

  // 読み込み
  useEffect(() => {
    const saved = localStorage.getItem("baseballGame");
    if (saved) {
      try {
        const loadedGame = JSON.parse(saved);
        setGame(loadedGame);
      } catch (e) {
        console.error("Failed to load game data", e);
      }
    }
  }, []);

  const currentInning = getCurrentInning();

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="container mx-auto px-4 py-6">
        {/* スコア表示 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">スコア</h2>
            <div className="text-sm text-gray-600">
              {game.currentInning}回
              {game.currentTopBottom === "top" ? "表" : "裏"}
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <div className="text-lg font-semibold">{game.awayTeam}</div>
              <div className="text-3xl font-bold text-blue-600">
                {game.awayScore}
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold">{game.homeTeam}</div>
              <div className="text-3xl font-bold text-red-600">
                {game.homeScore}
              </div>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm">アウト: {currentOuts}</span>
          </div>
        </div>

        {/* 現在の打者 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-bold mb-2">現在の打者</h3>
          <div className="text-2xl font-semibold text-center py-2">
            {lineup[currentBatterIndex]}
          </div>
        </div>

        {/* 打撃結果ボタン */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-bold mb-4">打撃結果</h3>
          <div className="grid grid-cols-2 gap-3">
            {battingResultOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleBattingResult(option.value)}
                className={`${option.color} text-white py-4 px-4 rounded-lg font-bold text-lg hover:opacity-90 active:scale-95 transition-transform`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 操作ボタン */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsRunnerModalOpen(true)}
              className="bg-indigo-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-indigo-600"
            >
              走者進塁設定
            </button>
            <button
              onClick={() => {
                // 投手交代、代打、代走などのダイアログを開く
                alert("機能実装予定");
              }}
              className="bg-gray-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-gray-600"
            >
              その他操作
            </button>
          </div>
        </div>

        {/* イニング切り替え */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="text-lg font-bold mb-2">イニング選択</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              { length: Math.max(9, game.currentInning + 1) },
              (_, i) => i + 1
            ).map((inning) => (
              <React.Fragment key={inning}>
                <button
                  onClick={() => switchInning(inning, "top")}
                  className={`px-4 py-2 rounded ${
                    game.currentInning === inning &&
                    game.currentTopBottom === "top"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {inning}回表
                </button>
                <button
                  onClick={() => switchInning(inning, "bottom")}
                  className={`px-4 py-2 rounded ${
                    game.currentInning === inning &&
                    game.currentTopBottom === "bottom"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {inning}回裏
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 固定下部ボタン */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-30">
        <div className="container mx-auto flex justify-between gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-green-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-green-700 active:scale-95 transition-transform"
          >
            途中保存
          </button>
          <button
            onClick={() => {
              if (window.confirm("試合を終了しますか？")) {
                handleSave();
                // 試合終了処理
              }
            }}
            className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-red-700 active:scale-95 transition-transform"
          >
            試合終了
          </button>
        </div>
      </div>

      {/* 走者進塁モーダル */}
      {isRunnerModalOpen && (
        <RunnerAdvanceModal
          isOpen={isRunnerModalOpen}
          onClose={() => {
            setIsRunnerModalOpen(false);
            setLastAtBatBatterName("");
          }}
          onSave={handleSaveRunnerAdvances}
          currentRunners={getCurrentRunners()}
          lineup={lineup}
          currentBatterName={lastAtBatBatterName}
        />
      )}
    </div>
  );
};

export default ScoreInput;
