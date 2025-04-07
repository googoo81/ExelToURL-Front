import { useStyleStore } from "@/states";

export default function useGetFilteredData() {
  const { fileData, selectedTypeFilter, selectedStyleFilter } = useStyleStore();

  return (validOnly: boolean = false) => {
    if (!fileData) return [];

    let filteredData = [...fileData];

    if (validOnly) {
      filteredData = filteredData.filter((row) => row.isValid);
    }

    if (selectedTypeFilter) {
      filteredData = filteredData.filter(
        (row) => row.typeValue === selectedTypeFilter
      );
    }

    if (selectedStyleFilter) {
      filteredData = filteredData.filter(
        (row) => row.styleContent === selectedStyleFilter
      );
    }

    return filteredData;
  };
}
