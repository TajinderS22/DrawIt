"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-6xl font-bold mb-4 text-white tracking-tight">
          ✏️ DrawIt
        </h1>
        <p className="text-gray-400 text-xl max-w-2xl mb-8">
          A real-time, collaborative, open-source whiteboard tool. Plan, design, sketch ideas with your team — directly in the browser.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-lg font-semibold transition">
              Start Drawing
            </button>
          </Link>
          <Link href="https://github.com/TajinderS22/drawit" target="_blank">
            <button className="px-6 py-3 border border-gray-600 hover:border-white rounded-md text-gray-300 hover:text-white text-lg font-semibold transition">
              View on GitHub
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-900 py-20 px-6">
        <div className="max-w-6xl mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "🧑‍🤝‍🧑 Real-time Collaboration",
              desc: "Work with your team live. Instant updates and no page refreshes.",
            },
            {
              title: "Why DrawIt?",
              desc: "Simple, secure and fast",
            },
            {
              title: "📦 Open Source",
              desc: "Free and extensible. Self-host or contribute to the community.",
            },
            {
              title: "🧠 Smart Drawing Tools",
              desc: "Draw shapes, arrows, and text with snap-to-grid precision.",
            },
            {
              title: "💾 Autosave",
              desc: "All your sketches are saved locally and synced in real time.",
            },
            {
              title: "🌐 Lightweight",
              desc: "No installs, no bloat. Works in any modern browser.",
            },
          ].map(({ title, desc }, idx) => (
            <div key={idx} className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl transition">
              <h3 className={` ${title=="Why DrawIt?"?"font-extrabold text-3xl text-blue-400":"text-xl font-semibold"}  mb-2`}>{title}</h3>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshot / Demo Section */}
      

      {/* Footer */}
      <footer className="py-10 border-t border-gray-800 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} DrawIt — Built with ❤️ by{" "}
        <a
          href="https://github.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white"
        >
          TajinderSingh
        </a>
      </footer>
    </div>
  );
}
