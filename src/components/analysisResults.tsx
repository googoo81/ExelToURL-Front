export default function AnalysisResults() {
  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-3">
        XML &lt;TYPE&gt; 태그 분석 결과
      </h3>

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
          <tbody></tbody>
        </table>
      </div>
    </div>
  );
}
