import { JobStatus } from "@/types";

export default function AnalysisResults({
  XMLTagResult,
}: {
  XMLTagResult: JobStatus | null;
}) {
  const getCellStyle = (value?: string) => {
    if (value === "undefined") {
      return "border p-2 text-center bg-red-100 text-red-700";
    } else if (value === "null") {
      return "border p-2 text-center bg-yellow-100 text-yellow-700";
    }
    return "border p-2 text-center";
  };

  const downloadAsExcel = () => {
    if (!XMLTagResult?.results || XMLTagResult.results.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const headers = [
      "COURSE_CODE",
      "GRADE",
      "SESSION",
      "UNIT",
      "PERIOD",
      "ORDER",
      "STUDY",
      "TYPE",
      "STYLE",
      "XML_URL",
    ];

    const csvData = [
      headers.join(","),
      ...XMLTagResult.results.map((row) =>
        [
          row.course_code || "",
          row.grade || "",
          row.session || "",
          row.unit || "",
          row.period || "",
          row.order || "",
          row.study || "",
          row.type_value || "",
          row.style_content || "",
          row.url || "",
        ].join(",")
      ),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvData], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "xml_analysis_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">XML &lt;TYPE&gt; 태그 분석 결과</h3>
        <button
          onClick={downloadAsExcel}
          disabled={!XMLTagResult?.results || XMLTagResult.results.length === 0}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Excel 다운로드
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">COURSE_CODE</th>
              <th className="border p-2 text-center">GRADE</th>
              <th className="border p-2 text-center">SESSION</th>
              <th className="border p-2 text-center">UNIT</th>
              <th className="border p-2 text-center">PERIOD</th>
              <th className="border p-2 text-center">ORDER</th>
              <th className="border p-2 text-center">STUDY</th>
              <th className="border p-2 text-center">TYPE</th>
              <th className="border p-2 text-center">STYLE</th>
              <th className="border p-2 text-center">XML_URL</th>
            </tr>
          </thead>
          <tbody>
            {XMLTagResult?.results?.map((row, index) => (
              <tr key={index}>
                <td className={getCellStyle(row.course_code)}>
                  {row.course_code}
                </td>
                <td className={getCellStyle(row.grade)}>{row.grade}</td>
                <td className={getCellStyle(row.session)}>{row.session}</td>
                <td className={getCellStyle(row.unit)}>{row.unit}</td>
                <td className={getCellStyle(row.period)}>{row.period}</td>
                <td className={getCellStyle(row.order)}>{row.order}</td>
                <td className={getCellStyle(row.study)}>{row.study}</td>
                <td className={getCellStyle(row.type_value)}>
                  {row.type_value}
                </td>
                <td className={getCellStyle(row.style_content)}>
                  {row.style_content}
                </td>
                <td className="border p-2 text-center">
                  <a
                    href={row.url}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    {row.url}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-700 mr-2"></div>
          <span className="text-sm">undefined: 해당 태그 없음</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-700 mr-2"></div>
          <span className="text-sm">null: 태그는 있으나 값이 없음</span>
        </div>
      </div>
    </div>
  );
}
