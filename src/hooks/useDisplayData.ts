import { useStyleStore } from "@/states";
import { useMemo } from "react";
import { FileRow } from "@/types";

export default function useDisplayData(validOnly: boolean) {
  const { fileData, selectedTypeFilter, selectedStyleFilter } = useStyleStore();

  const filteredData = useMemo(() => {
    if (!fileData) return null;

    let filtered = [...fileData] as FileRow[];

    if (validOnly) {
      filtered = filtered.filter((row) => row.isValid === true);
    }

    if (selectedTypeFilter) {
      filtered = filtered.filter((row) => row.typeValue === selectedTypeFilter);
    }

    if (selectedStyleFilter) {
      filtered = filtered.filter(
        (row) => row.styleContent === selectedStyleFilter
      );
    }

    return filtered;
  }, [fileData, validOnly, selectedTypeFilter, selectedStyleFilter]);

  return filteredData;
}
