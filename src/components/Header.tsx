import { useState } from "react";
import { ChefHat } from "lucide-react";

export default function Header() {
  const [showFallback, setShowFallback] = useState(false);

  return (
    <header className="relative text-center p-8 pb-10 bg-white overflow-hidden rounded-t-3xl shadow-xs">
      {/* Brand Insignia with Floating Effect */}
      <div className="relative z-3 inline-flex items-center justify-center w-28 h-28 rounded-full border-3 border-amber-500 bg-white shadow-lg shadow-amber-500/15 mb-4 overflow-hidden animate-float">
        {!showFallback ? (
          <img
            src="/logo.png"
            alt="Bon Appetit"
            className="w-full h-full object-cover scale-[1.03]"
            referrerPolicy="no-referrer"
            onError={() => setShowFallback(true)}
          />
        ) : (
          <ChefHat className="w-12 h-12 text-amber-600 stroke-[1.5]" />
        )}
      </div>

      <h1 className="relative z-3 font-display text-4xl font-extrabold text-[#3e2723] tracking-tight">
        Bon Appetit
      </h1>
      <p className="relative z-3 text-xs font-bold text-amber-700 tracking-[0.25em] uppercase mt-2">
        El Gustazo
      </p>
    </header>
  );
}
