import React from "react";

interface DroppedThirdStrikeModalProps {
  isOpen: boolean;
  onSelect: (isDropped: boolean) => void;
  batterName: string;
}

export const DroppedThirdStrikeModal: React.FC<DroppedThirdStrikeModalProps> = ({
  isOpen,
  onSelect,
  batterName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">三振</h2>
        <p className="text-gray-300 mb-6">
          {batterName}の三振です。振り逃げがありますか？
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onSelect(true)}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
          >
            振り逃げあり
          </button>
          <button
            onClick={() => onSelect(false)}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            振り逃げなし（アウト）
          </button>
        </div>
      </div>
    </div>
  );
};

