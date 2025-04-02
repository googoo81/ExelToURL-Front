"use client";

import { useState, ChangeEvent } from "react";
import * as XLSX from "xlsx";

interface ExcelRow {
  [key: string]: string | number;
}

export default function Origin() {
  const [fileData, setFileData] = useState<ExcelRow[] | null>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result === "string") return;
      const data = new Uint8Array(result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: "A",
      }) as ExcelRow[];

      const filteredData = jsonData.filter((row: ExcelRow) => {
        return row["Z"] !== "중복" && row["U"] === "Y";
      });

      console.log(filteredData);
      setFileData(filteredData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
      />
      {fileData && (
        <pre className="mt-4 p-2 bg-gray-100 border rounded">
          {JSON.stringify(fileData, null, 2)}
        </pre>
      )}
    </div>
  );
}
