"use client";

import { useDisplayData, useHandleTypeClick } from "@/hooks";
import { useStyleStore } from "@/states";

export default function ResultTable({ validOnly }: { validOnly: boolean }) {
  const { selectedTypeFilter, selectedStyleFilter } = useStyleStore();

  const handleTypeClick = useHandleTypeClick();
  const displayData = useDisplayData(validOnly);

  return (
    <ul className="list-disc pl-5 space-y-2">
      <li className="border-b pb-2">
        https://cache.wjthinkbig.com/BLLCONTENTS/ACT/과목코드/학년/학기/단원순서/학년_학기_1_목차일련번호_1.XML
        <br />
        https://cache.wjthinkbig.com/BLLCONTENTS/ACT/SCNE/GR14/4/1/GR14_4_1_129787_1.XML
      </li>

      {displayData && displayData.length > 0 ? (
        displayData.map((row, index) => (
          <li
            key={index}
            className={`border-b pb-2 ${
              row.isValid === false
                ? "bg-red-100"
                : row.isValid === true
                ? "bg-green-100"
                : ""
            } ${
              row.typeValue === selectedTypeFilter ? "ring-2 ring-blue-400" : ""
            } ${
              row.styleContent === selectedStyleFilter
                ? "ring-2 ring-purple-400"
                : ""
            }`}
          >
            <div className="mb-1">
              <span className="font-medium">과목코드:</span> {row.과목코드},{" "}
              <span className="font-medium">학년:</span> {row.학년},{" "}
              <span className="font-medium">학기:</span> {row.학기},{" "}
              <span className="font-medium">단원순서:</span> {row.단원순서},{" "}
              <span className="font-medium">학년E:</span> {row.학년E},{" "}
              <span className="font-medium">목차일련번호:</span>{" "}
              {row.목차일련번호}
              {row.isValid !== undefined && (
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded ${
                    row.isValid
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {row.isValid ? "유효함" : "접근 불가"}
                  {row.status && `(${row.status})`}
                  {row.isXml && " XML확인"}
                </span>
              )}
              {row.typeValue && (
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded ${
                    row.typeValue === selectedTypeFilter
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-blue-500 text-white"
                  }`}
                  onClick={() => handleTypeClick(row.typeValue as string)}
                  style={{ cursor: "pointer" }}
                  title="클릭하여 이 TYPE으로 필터링"
                >
                  TYPE: {row.typeValue}
                </span>
              )}
              {row.styleContent && (
                <span
                  className={`ml-2 px-2 py-1 text-xs rounded ${
                    row.styleContent === selectedStyleFilter
                      ? "bg-purple-600 text-white font-bold"
                      : "bg-purple-500 text-white"
                  }`}
                  style={{ cursor: "pointer" }}
                  title="클릭하여 이 STYLE으로 필터링"
                >
                  STYLE: {row.styleContent}
                </span>
              )}
            </div>
            <a
              href={row.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline break-all ${
                row.isValid === false
                  ? "text-red-600 line-through"
                  : "text-blue-600"
              }`}
            >
              {row.url}
            </a>
          </li>
        ))
      ) : (
        <li className="py-4 text-center text-gray-500">
          {selectedTypeFilter
            ? `선택한 TYPE "${selectedTypeFilter}"에 해당하는 URL이 없습니다.`
            : "표시할 URL이 없습니다."}
        </li>
      )}
    </ul>
  );
}
