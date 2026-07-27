import React from "react";

export default async function Home() {
  let systemStatus = null;
  try {
    const response = await fetch("http://server:8080/api/v1/status", {
      cache: "no-store", // Keeps data live, great for dashboards
    });
    systemStatus = await response.json();
  } catch (error) {
    systemStatus = { database: "Backend Offline", service: "Disconnected" };
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Lumen<span className="text-indigo-500">Patrons</span>
            </h1>
          </div>
          <nav className="p-4 space-y-2">
            <a
              href="#"
              className="block px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-lg font-medium border border-indigo-500/20"
            >
              🔍 Discover Patrons
            </a>
            <a
              href="#"
              className="block px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              📁 My Applications
            </a>
            <a
              href="#"
              className="block px-4 py-3 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            >
              ⚙️ Settings
            </a>
          </nav>
        </div>

        {/* Connection Status Widget */}
        <div className="p-4 m-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">System Status</p>
          <div className="flex items-center space-x-2 text-sm font-medium">
            <span
              className={`w-2 h-2 rounded-full ${systemStatus?.database?.includes("Connected") ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`}
            ></span>
            <span className="text-gray-200 truncate">
              {systemStatus?.database || "Connecting..."}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-8 backdrop-blur-sm">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Search for biotech, seed funds, stipends..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder-gray-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
              🔎
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Sign In
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
              Get Started
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to LumenPatrons
            </h2>
            <p className="text-gray-400 mb-8">
              Find non-dilutive capital and institutional backing without the
              noise.
            </p>

            {/* Empty State / Mock Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded text-center">
                      Tech & SaaS
                    </span>
                    <span className="text-gray-500 text-sm group-hover:text-indigo-400 transition-colors">
                      Grant
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    EU Horizon Seed Fund 2026
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    Early stage non-dilutive capital for software startups
                    building cloud infrastructure.
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-400 font-semibold">
                      €50,000
                    </span>
                    <span className="text-gray-500">Closes in 12 days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
