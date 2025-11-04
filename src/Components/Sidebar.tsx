import React from "react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">メニュー</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <nav className="space-y-2">
            <Link
              to="/score-input"
              onClick={onClose}
              className={`block px-4 py-2 rounded transition-colors ${
                isActive("/score-input") || isActive("/")
                  ? "bg-gray-700 font-bold"
                  : "hover:bg-gray-700"
              }`}
            >
              スコア入力
            </Link>
            <Link
              to="/records"
              onClick={onClose}
              className={`block px-4 py-2 rounded transition-colors ${
                isActive("/records")
                  ? "bg-gray-700 font-bold"
                  : "hover:bg-gray-700"
              }`}
            >
              戦績
            </Link>
            <Link
              to="/stats"
              onClick={onClose}
              className={`block px-4 py-2 rounded transition-colors ${
                isActive("/stats")
                  ? "bg-gray-700 font-bold"
                  : "hover:bg-gray-700"
              }`}
            >
              成績管理
            </Link>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
