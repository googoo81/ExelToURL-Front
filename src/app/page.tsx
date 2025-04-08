"use client";

import { useState } from "react";
import { JobStatus, FileRow, JobType } from "@/types";
import React from "react";
import {
  useCopyAllUrls,
  useDisplayData,
  useHandleFileUpload,
  useJobPolling,
} from "@/hooks";
import { useStyleStore } from "@/states";
import {
  AnalysisResults,
  ParseTotal,
  Progress,
  ResultTable,
} from "@/components";
import {
  downloadMultipleXMLsAsZip,
  downloadSingleXML,
  startXMLAnalysis,
  startUrlValidation,
  startXmlValidation,
} from "@/apis";

export default function Home() {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [validOnly, setValidOnly] = useState<boolean>(false);
  const serverUrl = "http://127.0.0.1:5000";
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [XMLTagResult, setXMLTagResult] = useState<JobStatus | null>(null);
  const [typeAnalysisResult, setTypeAnalysisResult] = useState<Record<
    string,
    number
  > | null>(null);

  const { fileData, setFileData } = useStyleStore();
  const { selectedTypeFilter, setSelectedTypeFilter } = useStyleStore();
  const { selectedStyleFilter, setSelectedStyleFilter } = useStyleStore();

  const handleFileUpload = useHandleFileUpload();
  const displayData = useDisplayData(validOnly);
  const copyAllUrls = useCopyAllUrls(setCopySuccess, validOnly);

  const {
    progress: jobProgress,
    pollJobStatus,
    cancelPolling,
  } = useJobPolling(serverUrl);

  React.useEffect(() => {
    setValidationProgress(jobProgress);
  }, [jobProgress]);

  const handleUrlValidation = async () => {
    if (!fileData) return;
    setIsValidating(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);
    try {
      const result = await startUrlValidation(fileData);
      if (result) {
        pollJobStatus(result.jobId, result.type as JobType, {
          onComplete: (jobStatus) => {
            setIsValidating(false);
            updateFileDataWithResults(jobStatus);
          },
          onError: () => {
            setIsValidating(false);
          },
        });
      } else {
        setIsValidating(false);
      }
    } catch (error) {
      console.error("Error in validation process:", error);
      setIsValidating(false);
    }
  };

  const handleXmlValidation = async () => {
    if (!fileData) return;
    setIsValidating(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);
    try {
      const result = await startXmlValidation(fileData);
      if (result) {
        pollJobStatus(result.jobId, result.type as JobType, {
          onComplete: (jobStatus) => {
            setIsValidating(false);
            updateFileDataWithResults(jobStatus);
          },
          onError: () => {
            setIsValidating(false);
          },
        });
      } else {
        setIsValidating(false);
      }
    } catch (error) {
      console.error("Error in XML validation process:", error);
      setIsValidating(false);
    }
  };

  const handleTypeAnalysis = async () => {
    if (!fileData) return;
    setIsAnalyzing(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);

    try {
      const result = await startXMLAnalysis(fileData);
      if (result.success) {
        pollJobStatus(result.jobId, result.type as JobType, {
          onComplete: (jobStatus) => {
            setIsAnalyzing(false);
            updateFileDataWithResults(jobStatus);
            setXMLTagResult(jobStatus);
            if (jobStatus.type_counts) {
              setTypeAnalysisResult(jobStatus.type_counts);
            }
          },
          onError: () => {
            setIsAnalyzing(false);
          },
        });
      } else {
        if (result.message) {
          alert(result.message);
        }
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Error in analysis process:", error);
      setIsAnalyzing(false);
    }
  };

  const updateFileDataWithResults = (jobStatus: JobStatus) => {
    if (jobStatus.results && fileData) {
      const updatedData = [...fileData];
      jobStatus.results.forEach((result) => {
        const matchingRow = updatedData.find((row) => row.url === result.url);
        if (matchingRow) {
          if (result.isValid !== undefined) {
            matchingRow.isValid = result.isValid;
          }
          if (result.statusCode !== undefined) {
            matchingRow.status = result.statusCode;
          }
          if (result.isXml !== undefined) {
            matchingRow.isXml = result.isXml;
          }
          if (result.type_value !== undefined) {
            matchingRow.typeValue = result.type_value;
          }
          if (result.style_content !== undefined) {
            matchingRow.styleContent = result.style_content;
          }
          if (result.course_code !== undefined) {
            matchingRow.course_code = result.course_code;
          }
          if (result.grade !== undefined) {
            matchingRow.grade = result.grade;
          }
          if (result.session !== undefined) {
            matchingRow.session = result.session;
          }
          if (result.unit !== undefined) {
            matchingRow.unit = result.unit;
          }
          if (result.period !== undefined) {
            matchingRow.period = result.period;
          }
          if (result.order !== undefined) {
            matchingRow.order = result.order;
          }
          if (result.study !== undefined) {
            matchingRow.study = result.study;
          }
        }
      });
      setFileData(updatedData);
    }
  };

  const assumeAllValid = () => {
    if (!fileData) return;
    setIsValidating(true);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);
    try {
      const updatedData = fileData.map((row) => ({
        ...row,
        isValid: true,
        status: 200,
      }));

      setFileData(updatedData);
    } finally {
      setIsValidating(false);
    }
  };

  const cancelValidation = () => {
    cancelPolling();
    setIsValidating(false);
    setIsAnalyzing(false);
  };

  const downloadXML = async (url: string, row: FileRow) => {
    const result = await downloadSingleXML(url, row);
    if (!result.success && result.message) {
      alert(result.message);
    }
    return result.success;
  };

  const downloadSelectedXMLs = async (useZip = true) => {
    const dataToDownload = displayData || [];
    if (!dataToDownload.length) {
      alert("다운로드할 XML 파일이 없습니다.");
      return;
    }
    const validFiles = dataToDownload.filter(
      (row) => row.url && row.isValid !== false
    );
    if (validFiles.length === 0) {
      alert("다운로드할 유효한 XML 파일이 없습니다.");
      return;
    }
    setIsDownloading(true);

    if (useZip) {
      try {
        const urls = validFiles.map((row) => row.url as string);
        const filenameMapping: Record<string, string> = {};
        validFiles.forEach((row) => {
          if (row.url) {
            if (row.과목코드 && row.학년 && row.학기 && row.목차일련번호) {
              filenameMapping[
                row.url
              ] = `${row.과목코드}_${row.학년}_${row.학기}_${row.목차일련번호}.xml`;
            } else {
              const defaultName = row.url.split("/").pop() || "file.xml";
              filenameMapping[row.url] = defaultName;
            }
          }
        });
        const result = await downloadMultipleXMLsAsZip(urls, filenameMapping);
        if (result.success) {
          alert(`${result.count}개의 XML 파일이 ZIP으로 다운로드되었습니다.`);
        } else if (result.message) {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error downloading ZIP:", error);
        alert("ZIP 다운로드 중 오류가 발생했습니다.");
      }
    } else {
      const maxDownloads = 10;
      if (validFiles.length > maxDownloads) {
        if (
          !confirm(
            `선택된 ${validFiles.length}개 중 처음 ${maxDownloads}개만 다운로드합니다. 계속하시겠습니까?`
          )
        ) {
          setIsDownloading(false);
          return;
        }
      }
      let successCount = 0;
      for (let i = 0; i < Math.min(validFiles.length, maxDownloads); i++) {
        const row = validFiles[i];
        if (!row.url) continue;
        const success = await downloadXML(row.url, row);
        if (success) successCount++;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      alert(`${successCount}개의 XML 파일 다운로드를 완료했습니다.`);
    }
    setIsDownloading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">URL 추출 및 유효성 검사</h1>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
      />

      {fileData && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
            <h2 className="text-xl font-bold">추출된 URL 목록</h2>
            <div className="flex gap-2 flex-wrap">
              {isValidating || isAnalyzing ? (
                <button
                  onClick={cancelValidation}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                >
                  {isValidating ? "검사 취소" : "분석 취소"}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUrlValidation}
                    disabled={isValidating || isAnalyzing}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    URL 유효성 검사
                  </button>

                  <button
                    onClick={handleXmlValidation}
                    disabled={isValidating || isAnalyzing}
                    className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    XML 특수 검사
                  </button>

                  <button
                    onClick={handleTypeAnalysis}
                    disabled={isValidating || isAnalyzing}
                    className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    XML 태그 전체 분석
                  </button>
                </>
              )}

              <button
                onClick={assumeAllValid}
                disabled={isValidating || isAnalyzing}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
              >
                모든 URL 유효하게 처리
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="validOnly"
                  checked={validOnly}
                  onChange={(e) => setValidOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="validOnly"
                  className="font-medium text-green-600"
                >
                  유효한 URL만 보기
                </label>
              </div>

              <button
                onClick={copyAllUrls}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer flex items-center"
              >
                {copySuccess ? (
                  "복사 완료!"
                ) : (
                  <>
                    <span>
                      {validOnly || selectedTypeFilter || selectedStyleFilter
                        ? `필터링된 URL 복사 (${displayData?.length || 0}개)`
                        : `모든 URL 복사 (${fileData.length}개)`}
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={() => downloadSelectedXMLs(true)}
                disabled={isDownloading || isValidating || isAnalyzing}
                className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400 flex items-center"
              >
                {isDownloading
                  ? "ZIP 다운로드 중..."
                  : `ZIP으로 다운로드 (${
                      displayData?.filter((row) => row.isValid !== false)
                        .length || 0
                    }개)`}
              </button>
            </div>
          </div>

          {(isValidating || isAnalyzing) && (
            <Progress
              isAnalyzing={isAnalyzing}
              validationProgress={validationProgress}
            />
          )}

          <ParseTotal validOnly={validOnly} />

          {typeAnalysisResult && (
            <AnalysisResults XMLTagResult={XMLTagResult} />
          )}

          <ResultTable validOnly={validOnly} />
        </div>
      )}
    </div>
  );
}
