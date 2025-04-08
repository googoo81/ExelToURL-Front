import { axiosInstance } from "@/libs";
import { ExtractedRow } from "@/types";

export default async function startUrlValidation(fileData: ExtractedRow[]) {
  try {
    const urls = fileData.map((row) => row.url).filter(Boolean) as string[];
    const response = await axiosInstance.post("/start-validation", {
      urls,
    });
    const jobId = response.data.job_id;
    return { jobId, type: "validation" };
  } catch (error) {
    console.error("Error starting validation:", error);
    return false;
  }
}
