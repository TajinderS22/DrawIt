"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 pt-24">
        <h1 className="text-6xl font-bold mb-4 text-white tracking-tight">
          DrawIt
        </h1>
        <p className="text-gray-300 text-xl max-w-2xl mb-8">
          A real-time, collaborative, open-source whiteboard tool. Plan, design,
          sketch ideas with your team — directly in the browser.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/signup">
            <button className="px-8 py-3 bg-[#7BF1A8] hover:bg-[#7BF1A8]/90 rounded-lg text-black text-lg font-semibold transition shadow-lg hover:shadow-xl">
              Start Drawing
            </button>
          </Link>
          <Link href="https://github.com/TajinderS22/drawit" target="_blank">
            <button className="px-8 py-3 border-2 border-[#7BF1A8] hover:bg-[#7BF1A8]/10 rounded-lg text-[#7BF1A8] hover:text-white text-lg font-semibold transition">
              View on GitHub
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            Why DrawIt?
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Real-time Collaboration",
                desc: "Work with your team live. Instant updates and no page refreshes.",
              },
              {
                title: "Open Source",
                desc: "Free and extensible. Self-host or contribute to the community.",
              },
          
              {
                title: "Autosave",
                desc: "All your sketches are saved locally and synced in real time.",
              },
              {
                title: "Lightning Fast",
                desc: "Optimized performance with instant rendering and smooth interactions.",
              },
              {
                title: "Lightweight",
                desc: "No installs, no bloat. Works in any modern browser.",
              },
            ].map(({ title, desc }, idx) => (
              <div
                key={idx}
                className="bg-gray-900/50 border border-gray-800 p-8 rounded-xl hover:border-[#7BF1A8]/50 hover:shadow-lg hover:shadow-[#7BF1A8]/10 transition duration-300 backdrop-blur-sm"
              >
                <h3 className="text-xl font-semibold mb-3 text-white">
                  {title}
                </h3>
                <p className="text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 text-center border-t border-gray-800">
        <h2 className="text-4xl font-bold mb-6 text-white">
          Ready to Start Drawing?
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
          Start using DrawIt for real-time collaboration
          and seamless sketching.
        </p>
        <Link href="/signup">
          <button className="px-8 py-4 bg-[#7BF1A8] hover:bg-[#7BF1A8]/90 rounded-lg text-black text-lg font-semibold transition shadow-lg hover:shadow-xl">
            Get Started Now
          </button>
        </Link>
      </section>

      <footer className="py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} DrawIt — Built with ❤️ by{" "}
        <a
          href="https://github.com/TajinderS22"
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
