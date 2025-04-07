import { useStyleStore } from "@/states";
import { ExcelRow, ExtractedRow } from "@/types";
import { ChangeEvent, useCallback } from "react";
import * as XLSX from "xlsx";

export default function useHandleFileUpload() {
  const setFileData = useStyleStore((state) => state.setFileData);
  const setSelectedTypeFilter = useStyleStore(
    (state) => state.setSelectedTypeFilter
  );
  const setSelectedStyleFilter = useStyleStore(
    (state) => state.setSelectedStyleFilter
  );

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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

        const originalData = XLSX.utils.sheet_to_json(sheet, {
          header: "A",
        }) as ExcelRow[];

        const filteredOriginalData = originalData.filter((row: ExcelRow) => {
          return row["Z"] !== "중복" && row["U"] === "Y";
        });

        const extractedData = filteredOriginalData
          .slice(1)
          .map((row) => {
            const typedRow = row as Record<string, string | number>;
            const rowEntries = Object.entries(typedRow);

            if (rowEntries.length === 0) return null;
            const grade = String(rowEntries[3]?.[1] || "");
            const term = String(rowEntries[4]?.[1] || "");

            let gradeE: string;
            switch (grade) {
              case "예비초":
                gradeE = "GR10";
                break;
              case "1학년":
                gradeE = "GR11";
                break;
              case "2학년":
                gradeE = "GR12";
                break;
              case "3학년":
                gradeE = "GR13";
                break;
              case "4학년":
                gradeE = "GR14";
                break;
              case "5학년":
                gradeE = "GR15";
                break;
              case "6학년":
                gradeE = "GR16";
                break;
              default:
                gradeE = grade;
            }

            let termE: string;
            switch (term) {
              case "여름방학":
                termE = "3";
                break;
              case "겨울방학":
                termE = "4";
                break;
              default:
                termE = term.slice(0, 1);
                break;
            }

            const extractedValues: ExtractedRow = {
              과목코드: rowEntries[1]?.[1],
              학년: grade.slice(0, 1),
              학기: termE,
              단원순서: rowEntries[5]?.[1],
              목차일련번호: rowEntries[6]?.[1],
              학년E: gradeE,
              url: null,
            };

            const resultURL = `https://cache.wjthinkbig.com/BLLCONTENTS/ACT/${extractedValues.과목코드}/${extractedValues.학년E}/${extractedValues.학기}/${extractedValues.단원순서}/${extractedValues.학년E}_${extractedValues.학기}_1_${extractedValues.목차일련번호}_1.XML`;
            extractedValues.url = resultURL;

            return extractedValues;
          })
          .filter((row): row is ExtractedRow => row !== null);

        console.log(extractedData);
        setFileData(extractedData);
        setSelectedTypeFilter(null);
        setSelectedStyleFilter(null);
      };

      reader.readAsArrayBuffer(file);
    },
    [setFileData, setSelectedTypeFilter, setSelectedStyleFilter]
  );

  return handleFileUpload;
}
