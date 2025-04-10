export interface UrlValidationResult {
  url: string;
  isValid: boolean;
  statusCode: number;
  error?: string;
}
