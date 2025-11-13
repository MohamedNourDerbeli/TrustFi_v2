import { Link } from "wouter";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to TrustFi</h1>
      <p className="text-xl mb-8">Your Universal Web3 Identity Platform</p>
      <div className="space-x-4">
        {/* --- CHANGE IS HERE --- */}
        <Link 
          href="/login" 
          className="px-6 py-3 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
        >
          Login / Connect Wallet
        </Link>
        
        {/* --- AND CHANGE IS HERE --- */}
        <Link 
          href="/dashboard" 
          className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
