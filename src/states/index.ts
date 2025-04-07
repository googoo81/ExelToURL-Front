import { create } from "zustand";
import { ExtractedRow } from "@/types";

interface StyleAnalysisState {
  styleAnalysisResult: Record<string, number> | null;
  setStyleAnalysisResult: (result: Record<string, number>) => void;

  selectedTypeFilter: string | null;
  setSelectedTypeFilter: (type: string | null) => void;

  selectedStyleFilter: string | null;
  setSelectedStyleFilter: (style: string | null) => void;

  fileData: ExtractedRow[] | null;
  setFileData: (data: ExtractedRow[]) => void;
}

export const useStyleStore = create<StyleAnalysisState>((set) => ({
  styleAnalysisResult: null,
  setStyleAnalysisResult: (result) => set({ styleAnalysisResult: result }),

  selectedTypeFilter: null,
  setSelectedTypeFilter: (type) => set({ selectedTypeFilter: type }),

  selectedStyleFilter: null,
  setSelectedStyleFilter: (style) => set({ selectedStyleFilter: style }),

  fileData: null,
  setFileData: (data) => set({ fileData: data }),
}));
