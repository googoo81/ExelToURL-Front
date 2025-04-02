export interface JobStatus {
  status: "in_progress" | "completed";
  progress: number;
  results?: Array<{
    url: string;
    isValid: boolean;
    statusCode: number;
    isXml?: boolean;
    type_value?: string;
    error?: string;
  }>;
  type_counts?: Record<string, number>;
}
