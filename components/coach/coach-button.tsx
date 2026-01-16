'use client';

interface CoachButtonProps {
  onClick: () => void;
  hasNotification?: boolean;
}

export function CoachButton({ onClick, hasNotification = false }: CoachButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
      aria-label="Ouvrir le Coach IA"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">✨</span>
      {hasNotification && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">!</span>
        </span>
      )}
    </button>
  );
}
