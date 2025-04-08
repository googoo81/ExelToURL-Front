import { useDisplayData } from "@/hooks";
import { useCallback } from "react";

export default function useCopyAllUrls(
  setCopySuccess: React.Dispatch<React.SetStateAction<boolean>>,
  validOnly: boolean
) {
  const displayData = useDisplayData(validOnly);

  return useCallback(() => {
    if (!displayData) return;
    const allUrls = displayData.map((row) => row.url).join("\n");

    navigator.clipboard
      .writeText(allUrls)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URLs: ", err);
      });
  }, [displayData, setCopySuccess]);
}
