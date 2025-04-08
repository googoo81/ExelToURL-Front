"use client";

import { useStyleStore } from "@/states";

export default function ParseTotal({ validOnly }: { validOnly: boolean }) {
  const { fileData, selectedTypeFilter, selectedStyleFilter } = useStyleStore();

  const validCount =
    fileData?.filter((row) => row.isValid === true).length || 0;
  const invalidCount =
    fileData?.filter((row) => row.isValid === false).length || 0;
  const uncheckedCount =
    fileData?.filter((row) => row.isValid === undefined).length || 0;

  const selectedTypeCount = selectedTypeFilter
    ? fileData?.filter((row) => row.typeValue === selectedTypeFilter).length ||
      0
    : 0;

  const selectedStyleCount = selectedStyleFilter
    ? fileData?.filter((row) => row.styleContent === selectedStyleFilter)
        .length || 0
    : 0;

  return (
    <div className="mb-4">
      {fileData && (
        <p className="text-sm text-gray-600">
          총 URL 수: {fileData.length} | 유효한 URL: {validCount} | 유효하지
          않은 URL: {invalidCount} | 검사되지 않은 URL: {uncheckedCount}
          {validOnly && (
            <span className="ml-2 font-medium text-green-600">
              (현재 유효한 URL {validCount}개만 표시 중)
            </span>
          )}
          {selectedTypeFilter && (
            <span className="ml-2 font-medium text-blue-600">
              | TYPE: &quot;{selectedTypeFilter}&quot; 필터 적용 중 (
              {selectedTypeCount}개)
            </span>
          )}
          {selectedStyleFilter && (
            <span className="ml-2 font-medium text-purple-600">
              | STYLE: &quot;{selectedStyleFilter}&quot; 필터 적용 중 (
              {selectedStyleCount}개)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
