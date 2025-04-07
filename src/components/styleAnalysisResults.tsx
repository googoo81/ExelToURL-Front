import { useHandleStyleClick } from "@/hooks";
import { useStyleStore } from "@/states";

export default function StyleAnalysisResults({
  styleAnalysisResult,
  selectedStyleCount,
}: {
  styleAnalysisResult: Record<string, number> | null;
  selectedStyleCount: number;
}) {
  const { selectedStyleFilter, setSelectedStyleFilter } = useStyleStore();
  const handleStyleClick = useHandleStyleClick();

  if (!styleAnalysisResult) return null;

  const entries = Object.entries(styleAnalysisResult);
  if (entries.length === 0) return <p>STYLE 분석 결과가 없습니다.</p>;

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-3">
        XML &lt;STYLE&gt; 태그 분석 결과
      </h3>
      <p className="mb-2">총 분석된 XML 파일: {total}개</p>

      {selectedStyleFilter && (
        <div className="mb-4 p-2 bg-purple-100 rounded flex items-center justify-between">
          <p>
            <span className="font-bold">&quot;{selectedStyleFilter}&quot;</span>{" "}
            STYLE 필터 적용 중 ({selectedStyleCount}개 URL)
          </p>
          <button
            onClick={() => setSelectedStyleFilter(null)}
            className="bg-purple-500 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm"
          >
            필터 해제
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">STYLE 값</th>
              <th className="border p-2 text-center">갯수</th>
              <th className="border p-2 text-center">비율</th>
              <th className="border p-2 text-center">액션</th>
            </tr>
          </thead>
          <tbody>
            {entries
              .sort((a, b) => b[1] - a[1])
              .map(([styleValue, count]) => (
                <tr
                  key={styleValue || "없음"}
                  className={`hover:bg-gray-100 ${
                    selectedStyleFilter === styleValue ? "bg-purple-50" : ""
                  }`}
                >
                  <td className="border p-2 font-medium">
                    {styleValue || (
                      <span className="text-gray-500 italic">없음</span>
                    )}
                  </td>
                  <td className="border p-2 text-center">{count}</td>
                  <td className="border p-2 text-center">
                    {((count / total) * 100).toFixed(1)}%
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleStyleClick(styleValue)}
                      className={`py-1 px-3 rounded text-sm ${
                        selectedStyleFilter === styleValue
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {selectedStyleFilter === styleValue
                        ? "필터 해제"
                        : "URL 보기"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
