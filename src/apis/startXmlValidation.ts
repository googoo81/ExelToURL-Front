import { axiosInstance } from "@/libs";
import { ExtractedRow } from "@/types";

export default async function startXmlValidation(fileData: ExtractedRow[]) {
  try {
    const urls = fileData.map((row) => row.url).filter(Boolean) as string[];
    const response = await axiosInstance.post("/start-xml-validation", {
      urls,
    });
    const jobId = response.data.job_id;
    return { jobId, type: "xml_validation" };
  } catch (error) {
    console.error("Error starting XML validation:", error);
    return false;
  }
}
