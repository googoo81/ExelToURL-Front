export interface JobStatus {
  status: "in_progress" | "completed";
  progress: number;
  results?: Array<{
    url: string;
    isValid: boolean;
    statusCode: number;
    isXml?: boolean;
    type_value?: string;
    style_content?: string;
    course_code?: string;
    grade?: string;
    session?: string;
    unit?: string;
    period?: string;
    order?: string;
    study?: string;
    error?: string;
  }>;
  type_counts?: Record<string, number>;
  style_counts?: Record<string, number>;
  course_code?: Record<string, number>;
  grade?: Record<string, number>;
  session?: Record<string, number>;
  unit?: Record<string, number>;
  period?: Record<string, number>;
  order?: Record<string, number>;
  study?: Record<string, number>;
  tag_counts?: Record<string, Record<string, number>> | null;
}
