import { useStyleStore } from "@/states";

export default function useHandleTypeClick() {
  const { selectedTypeFilter, setSelectedTypeFilter } = useStyleStore();
  const setSelectedStyleFilter = useStyleStore(
    (state) => state.setSelectedStyleFilter
  );

  return (typeValue: string) => {
    if (selectedTypeFilter === typeValue) {
      setSelectedTypeFilter(null);
    } else {
      setSelectedTypeFilter(typeValue);
      setSelectedStyleFilter(null);
    }
  };
}
