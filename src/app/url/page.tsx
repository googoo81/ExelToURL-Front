"use client";

import { useState } from "react";
import React from "react";
import { JobStatus, JobType, ExtractedRow } from "@/types";
import { useJobPolling } from "@/hooks";
import { AnalysisResults, Progress } from "@/components";
import { startXMLAnalysis } from "@/apis";

export default function Url() {
  const [urls, setUrls] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [XMLTagResult, setXMLTagResult] = useState<JobStatus | null>(null);

  const {
    progress: jobProgress,
    pollJobStatus,
    cancelPolling,
  } = useJobPolling();

  React.useEffect(() => {
    setValidationProgress(jobProgress);
  }, [jobProgress]);

  const handleTagAnalysis = async () => {
    if (!urls.trim()) {
      alert("분석할 URL을 입력해주세요.");
      return;
    }
    setIsAnalyzing(true);
    setValidationProgress(0);

    try {
      const urlList = urls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (urlList.length === 0) {
        alert("분석할 유효한 URL이 없습니다.");
        setIsAnalyzing(false);
        return;
      }
      const fileData: ExtractedRow[] = urlList.map((url) => ({
        과목코드: "",
        학년: "",
        학기: "",
        단원순서: "",
        목차일련번호: "",
        학년E: "",
        url: url,
        isValid: true,
      }));
      const result = await startXMLAnalysis(fileData);

      if (!result.success) {
        alert(result.message);
        setIsAnalyzing(false);
        return;
      }
      pollJobStatus(result.jobId, "xml_analysis" as JobType, {
        onComplete: (jobStatus) => {
          setIsAnalyzing(false);
          setXMLTagResult(jobStatus);
        },
        onError: () => {
          setIsAnalyzing(false);
          alert("XML 태그 분석 중 오류가 발생했습니다.");
        },
      });
    } catch (error) {
      console.error("Error in analysis process:", error);
      alert("분석 시작 중 오류가 발생했습니다.");
      setIsAnalyzing(false);
    }
  };

  const cancelAnalysis = () => {
    cancelPolling();
    setIsAnalyzing(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">XML URL 분석</h1>
      <div className="mb-4">
        <textarea
          className="border border-gray-500 p-2 rounded-sm w-full h-40"
          placeholder="분석할 URL을 한 줄에 하나씩 입력하세요"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          disabled={isAnalyzing}
        ></textarea>
      </div>

      <div className="flex flex-col gap-2">
        {isAnalyzing && (
          <Progress
            isAnalyzing={isAnalyzing}
            validationProgress={validationProgress}
          />
        )}

        <div className="flex gap-2">
          {isAnalyzing ? (
            <button
              onClick={cancelAnalysis}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
            >
              분석 취소
            </button>
          ) : (
            <button
              onClick={handleTagAnalysis}
              className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
              disabled={isAnalyzing || !urls.trim()}
            >
              XML URL 태그 전체 분석
            </button>
          )}
        </div>
      </div>

      {XMLTagResult && <AnalysisResults XMLTagResult={XMLTagResult} />}
    </div>
  );
}
