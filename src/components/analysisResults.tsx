import React from "react";
import { JobStatus } from "@/types";
import ExcelJS from "exceljs";

export default function AnalysisResults({
  XMLTagResult,
}: {
  XMLTagResult: JobStatus | null;
}) {
  const getCellStyle = (value?: string | number | null) => {
    const stringValue = String(value);
    if (stringValue === "undefined" || value === undefined) {
      return "border p-2 text-center bg-red-100 text-red-700";
    } else if (stringValue === "null" || value === null) {
      return "border p-2 text-center bg-yellow-100 text-yellow-700";
    }
    return "border p-2 text-center";
  };

  const downloadAsExcel = async () => {
    if (!XMLTagResult?.results || XMLTagResult.results.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("AnalysisResults");

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

    worksheet.addRow(headers);

    XMLTagResult.results.forEach((row) => {
      worksheet.addRow([
        row.course_code ?? "",
        row.grade ?? "",
        row.session ?? "",
        row.unit ?? "",
        row.period ?? "",
        row.order ?? "",
        row.study ?? "",
        row.type_value ?? "",
        row.style_content ?? "",
        row.url ?? "",
      ]);
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F81BD" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F81BD" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.autoFilter = {
      from: "A1",
      to: "I1",
    };

    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const length = cell.value?.toString().length ?? 10;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "xml_analysis_results.xlsx";
    link.click();
    URL.revokeObjectURL(url);
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
                  {String(row.course_code ?? "")}
                </td>
                <td className={getCellStyle(row.grade)}>
                  {String(row.grade ?? "")}
                </td>
                <td className={getCellStyle(row.session)}>
                  {String(row.session ?? "")}
                </td>
                <td className={getCellStyle(row.unit)}>
                  {String(row.unit ?? "")}
                </td>
                <td className={getCellStyle(row.period)}>
                  {String(row.period ?? "")}
                </td>
                <td className={getCellStyle(row.order)}>
                  {String(row.order ?? "")}
                </td>
                <td className={getCellStyle(row.study)}>
                  {String(row.study ?? "")}
                </td>
                <td className={getCellStyle(row.type_value)}>
                  {String(row.type_value ?? "")}
                </td>
                <td className={getCellStyle(row.style_content)}>
                  {String(row.style_content ?? "")}
                </td>
                <td className="border p-2 text-center">
                  {row.url ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {row.url}
                    </a>
                  ) : (
                    ""
                  )}
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
