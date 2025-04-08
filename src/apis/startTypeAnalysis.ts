import { axiosInstance } from "@/libs";
import { ExtractedRow } from "@/types";

export default async function startTypeAnalysis(fileData: ExtractedRow[]) {
  try {
    const validUrls = fileData
      .filter((row) => row.isValid === true)
      .map((row) => row.url)
      .filter(Boolean) as string[];

    if (validUrls.length === 0) {
      return {
        success: false,
        message:
          "분석할 유효한 URL이 없습니다. 먼저 URL 유효성 검사를 실행해주세요.",
      };
    }

    const response = await axiosInstance.post("/analyze-xml-types", {
      urls: validUrls,
    });

    const jobId = response.data.job_id;
    return { success: true, jobId, type: "analysis" };
  } catch (error) {
    console.error("Error starting XML analysis:", error);
    return { success: false, message: "분석 시작 중 오류가 발생했습니다." };
  }
}
