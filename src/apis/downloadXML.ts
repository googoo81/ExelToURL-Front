import { axiosInstance } from "@/libs";
import { FileRow } from "@/types";

export default async function downloadXML(url: string, row: FileRow) {
  try {
    const response = await axiosInstance.get("/download-xml", {
      params: { url },
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/xml" });
    const downloadUrl = window.URL.createObjectURL(blob);

    let filename = url.split("/").pop() || "download.xml";

    if (row.과목코드 && row.학년 && row.학기 && row.목차일련번호) {
      filename = `${row.과목코드}_${row.학년}_${row.학기}_${row.목차일련번호}.xml`;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return true;
  } catch (error) {
    console.error("Error downloading XML:", error);
    alert("XML 다운로드 중 오류가 발생했습니다.");
    return false;
  }
}
