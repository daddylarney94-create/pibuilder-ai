export default function Offline() {
  return (
    <div className="min-h-screen bg-[#030a05] flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">📡</div>
        <h1 className="text-xl font-bold text-[#4ade80] mb-2">You're Offline</h1>
        <p className="text-sm text-[#2d6a3f] mb-6">
          PiBuilder AI works offline for manual building.<br />
          AI Builder requires an internet connection.
        </p>
        <a href="/" className="text-[#22c55e] border border-[#22c55e] px-4 py-2 rounded text-sm hover:bg-[#071410]">
          Return to App
        </a>
      </div>
    </div>
  );
}
