import { UrlValidationResult } from "@/types";

export interface ValidationResultState {
  results: UrlValidationResult[];
  valid: number;
  invalid: number;
}
