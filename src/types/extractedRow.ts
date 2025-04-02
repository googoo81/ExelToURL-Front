export interface ExtractedRow {
  과목코드: string | number;
  학년: string | number;
  학기: string | number;
  단원순서: string | number;
  목차일련번호: string | number;
  학년E: string | number;
  url: string | null;
  isValid?: boolean;
  status?: number;
  isXml?: boolean;
  typeValue?: string;
}
