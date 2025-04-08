"use client";

export default function Progress({
  isAnalyzing,
  validationProgress,
}: {
  isAnalyzing: boolean;
  validationProgress: number;
}) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${validationProgress}%` }}
      ></div>
      <p className="text-center text-sm mt-1">
        진행률: {validationProgress}% {isAnalyzing && "(태그 분석 중...)"}
      </p>
    </div>
  );
}
