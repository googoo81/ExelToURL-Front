"use client";

import React, { useState } from "react";
import {
  JobStatus,
  JobType,
  ExtractedRow,
  ValidationResultState,
  UrlValidationResult,
} from "@/types";
import { useJobPolling } from "@/hooks";
import { AnalysisResults, Progress } from "@/components";
import { startXMLAnalysis, startUrlValidation } from "@/apis";

export default function Url() {
  const [urls, setUrls] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [XMLTagResult, setXMLTagResult] = useState<JobStatus | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResultState | null>(null);
  const [showOnlyValid, setShowOnlyValid] = useState<boolean>(false);

  const {
    progress: jobProgress,
    pollJobStatus,
    cancelPolling,
  } = useJobPolling();

  React.useEffect(() => {
    setValidationProgress(jobProgress);
  }, [jobProgress]);

  const handleValidation = async () => {
    if (!urls.trim()) {
      alert("검사할 URL을 입력해주세요.");
      return;
    }
    setIsValidating(true);
    setValidationProgress(0);
    setValidationResult(null);

    try {
      const urlList = urls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (urlList.length === 0) {
        alert("검사할 유효한 URL이 없습니다.");
        setIsValidating(false);
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

      const result = await startUrlValidation(fileData);

      if (!result || !result.jobId) {
        alert("URL 유효성 검사 작업을 시작할 수 없습니다.");
        setIsValidating(false);
        return;
      }
      pollJobStatus(result.jobId, "validation" as JobType, {
        onComplete: (jobStatus: JobStatus) => {
          setIsValidating(false);
          if (jobStatus.results && Array.isArray(jobStatus.results)) {
            const validationResults = jobStatus.results.map((result) => ({
              url: result.url,
              isValid: result.isValid,
              statusCode: result.statusCode,
              error: result.error,
            })) as UrlValidationResult[];

            const validCount = validationResults.filter(
              (r) => r.isValid
            ).length;

            setValidationResult({
              results: validationResults,
              valid: validCount,
              invalid: validationResults.length - validCount,
            });
          } else {
            alert("URL 유효성 검사 결과를 처리할 수 없습니다.");
          }
        },
        onError: () => {
          setIsValidating(false);
          alert("URL 유효성 검사 중 오류가 발생했습니다.");
        },
      });
    } catch (error) {
      console.error("Error in URL validation:", error);
      alert("URL 유효성 검사 중 오류가 발생했습니다.");
      setIsValidating(false);
    }
  };

  const handleTagAnalysis = async () => {
    if (!urls.trim()) {
      alert("분석할 URL을 입력해주세요.");
      return;
    }
    if (!validationResult) {
      const shouldProceed = confirm("URL 유효성 검사를 먼저 진행하시겠습니까?");
      if (shouldProceed) {
        await handleValidation();
        return;
      }
    }
    setIsAnalyzing(true);
    setValidationProgress(0);

    try {
      let urlList = urls
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
      if (validationResult && validationResult.invalid > 0) {
        const useOnlyValid = confirm(
          `${validationResult.invalid}개의 유효하지 않은 URL이 있습니다. 유효한 URL만 분석하시겠습니까?`
        );
        if (useOnlyValid) {
          const validUrls = validationResult.results
            .filter((result) => result.isValid)
            .map((result) => result.url);
          urlList = urlList.filter((url) => validUrls.includes(url));
        }
      }
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
        alert(result.message || "XML 분석을 시작할 수 없습니다.");
        setIsAnalyzing(false);
        return;
      }
      pollJobStatus(result.jobId, "xml_analysis" as JobType, {
        onComplete: (jobStatus: JobStatus) => {
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
    setIsValidating(false);
  };

  const getFilteredUrls = () => {
    if (!validationResult || !showOnlyValid) return urls;

    const validUrls = validationResult.results
      .filter((result) => result.isValid)
      .map((result) => result.url);

    return urls
      .split("\n")
      .filter((url) => {
        const trimmedUrl = url.trim();
        return trimmedUrl.length > 0 && validUrls.includes(trimmedUrl);
      })
      .join("\n");
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">XML URL 분석</h1>
      <div className="mb-4">
        <textarea
          className="border border-gray-500 p-2 rounded-sm w-full h-40"
          placeholder="분석할 URL을 한 줄에 하나씩 입력하세요"
          value={showOnlyValid && validationResult ? getFilteredUrls() : urls}
          onChange={(e) => setUrls(e.target.value)}
          disabled={isAnalyzing || isValidating}
        ></textarea>
      </div>

      <div className="flex flex-col gap-2">
        {(isAnalyzing || isValidating) && (
          <Progress
            isAnalyzing={isAnalyzing || isValidating}
            validationProgress={validationProgress}
          />
        )}

        <div className="flex gap-2">
          {isAnalyzing || isValidating ? (
            <button
              onClick={cancelAnalysis}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
            >
              {isValidating ? "검사 취소" : "분석 취소"}
            </button>
          ) : (
            <>
              <button
                onClick={handleValidation}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                disabled={isAnalyzing || isValidating || !urls.trim()}
              >
                URL 유효성 검사
              </button>
              <button
                onClick={handleTagAnalysis}
                className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                disabled={isAnalyzing || isValidating || !urls.trim()}
              >
                XML URL 태그 전체 분석
              </button>
            </>
          )}
        </div>
      </div>

      {XMLTagResult && <AnalysisResults XMLTagResult={XMLTagResult} />}

      {validationResult && (
        <div className="bg-gray-100 p-4 rounded-md mt-8">
          <h2 className="text-lg font-semibold mb-2">URL 유효성 검사 결과</h2>
          <div className="flex gap-4 mb-3">
            <div className="text-green-600">
              유효한 URL: {validationResult.valid}개
            </div>
            <div className="text-red-600">
              유효하지 않은 URL: {validationResult.invalid}개
            </div>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="showOnlyValid"
              checked={showOnlyValid}
              onChange={(e) => setShowOnlyValid(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="showOnlyValid">유효한 URL만 표시</label>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">URL</th>
                  <th className="border p-2 text-left">상태</th>
                  <th className="border p-2 text-left">상태 코드</th>
                </tr>
              </thead>
              <tbody>
                {validationResult.results
                  .filter((result) => !showOnlyValid || result.isValid)
                  .map((result, index) => (
                    <tr
                      key={index}
                      className={result.isValid ? "bg-green-50" : "bg-red-50"}
                    >
                      <td className="border p-2 break-all">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {result.url}
                        </a>
                      </td>
                      <td className="border p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-sm ${
                            result.isValid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {result.isValid ? "유효함" : "유효하지 않음"}
                        </span>
                      </td>
                      <td className="border p-2">
                        {result.statusCode}{" "}
                        {result.error ? `(${result.error})` : ""}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
