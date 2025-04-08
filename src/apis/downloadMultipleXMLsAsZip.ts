import { axiosInstance } from "@/libs";

export default async function downloadMultipleXMLsAsZip(
  urls: string[],
  filenameMapping: Record<string, string>
) {
  try {
    const response = await axiosInstance.post(
      "/create-zip",
      {
        urls,
        filenames: filenameMapping,
      },
      { responseType: "blob" }
    );

    const blob = new Blob([response.data], { type: "application/zip" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", "xml_files.zip");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, count: urls.length };
  } catch (error) {
    console.error("Error downloading ZIP:", error);
    return { success: false, message: "ZIP 다운로드 중 오류가 발생했습니다." };
  }
}
