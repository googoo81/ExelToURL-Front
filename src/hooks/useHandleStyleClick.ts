import { useStyleStore } from "@/states";

export default function useHandleStyleClick() {
  const { selectedStyleFilter, setSelectedStyleFilter } = useStyleStore();
  const setSelectedTypeFilter = useStyleStore(
    (state) => state.setSelectedTypeFilter
  );

  return (styleValue: string) => {
    if (selectedStyleFilter === styleValue) {
      setSelectedStyleFilter(null);
    } else {
      setSelectedStyleFilter(styleValue);
      setSelectedTypeFilter(null);
    }
  };
}
