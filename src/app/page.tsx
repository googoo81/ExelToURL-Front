"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { JobStatus, FileRow } from "@/types";
import React from "react";
import { useHandleFileUpload, useHandleTypeClick } from "@/hooks";
import { useStyleStore } from "@/states";
import { AnalysisResults } from "@/components";
import {
  downloadMultipleXMLsAsZip,
  downloadSingleXML,
  startTypeAnalysis,
  startUrlValidation,
  startXmlValidation,
} from "@/apis";

export default function Home() {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [validOnly, setValidOnly] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const serverUrl = "http://127.0.0.1:5000";
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [typeAnalysisResult, setTypeAnalysisResult] = useState<Record<
    string,
    number
  > | null>(null);

  const { fileData, setFileData } = useStyleStore();
  const { selectedTypeFilter, setSelectedTypeFilter } = useStyleStore();
  const { selectedStyleFilter, setSelectedStyleFilter } = useStyleStore();

  const handleFileUpload = useHandleFileUpload();
  const handleTypeClick = useHandleTypeClick();

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const copyAllUrls = () => {
    if (!fileData) return;

    const dataToUse = displayData || [];

    const allUrls = dataToUse.map((row) => row.url).join("\n");
    navigator.clipboard
      .writeText(allUrls)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URLs: ", err);
      });
  };

  const pollJobStatus = (jobId: string, jobType = "validation") => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    const interval = setInterval(async () => {
      try {
        const response = await axios.get<JobStatus>(
          `${serverUrl}/job-status/${jobId}`
        );
        const jobStatus = response.data;

        setValidationProgress(jobStatus.progress);

        if (jobStatus.status === "completed") {
          clearInterval(interval);
          setPollingInterval(null);

          if (jobType === "validation" || jobType === "xml_validation") {
            setIsValidating(false);
          } else if (jobType === "analysis") {
            setIsAnalyzing(false);
          }

          if (jobStatus.results && fileData) {
            const updatedData = [...fileData];

            jobStatus.results.forEach((result) => {
              const matchingRow = updatedData.find(
                (row) => row.url === result.url
              );
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
              }
            });

            setFileData(updatedData);
          }

          if (jobType === "analysis") {
            if (jobStatus.type_counts) {
              setTypeAnalysisResult(jobStatus.type_counts);
            }
          }
        }
      } catch (error) {
        console.error(`Error polling ${jobType} status:`, error);
        clearInterval(interval);
        setPollingInterval(null);

        if (jobType === "validation" || jobType === "xml_validation") {
          setIsValidating(false);
        } else if (jobType === "analysis") {
          setIsAnalyzing(false);
        }
      }
    }, 1000);

    setPollingInterval(interval);
  };

  const handleUrlValidation = async () => {
    if (!fileData) return;
    setIsValidating(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);

    try {
      const result = await startUrlValidation(fileData);
      if (result) {
        pollJobStatus(result.jobId, result.type);
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
        pollJobStatus(result.jobId, result.type);
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
      const result = await startTypeAnalysis(fileData);
      if (result.success) {
        pollJobStatus(result.jobId, result.type);
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
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsValidating(false);
    setIsAnalyzing(false);
  };

  const displayData = React.useMemo(() => {
    if (!fileData) return null;

    let filtered = [...fileData] as FileRow[];

    if (validOnly) {
      filtered = filtered.filter((row) => row.isValid === true);
    }

    if (selectedTypeFilter) {
      filtered = filtered.filter((row) => row.typeValue === selectedTypeFilter);
    }

    if (selectedStyleFilter) {
      filtered = filtered.filter(
        (row) => row.styleContent === selectedStyleFilter
      );
    }

    return filtered;
  }, [fileData, validOnly, selectedTypeFilter, selectedStyleFilter]);

  const validCount =
    fileData?.filter((row) => row.isValid === true).length || 0;
  const invalidCount =
    fileData?.filter((row) => row.isValid === false).length || 0;
  const uncheckedCount =
    fileData?.filter((row) => row.isValid === undefined).length || 0;

  const selectedTypeCount = selectedTypeFilter
    ? fileData?.filter((row) => row.typeValue === selectedTypeFilter).length ||
      0
    : 0;

  const selectedStyleCount = selectedStyleFilter
    ? fileData?.filter((row) => row.styleContent === selectedStyleFilter)
        .length || 0
    : 0;

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
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${validationProgress}%` }}
              ></div>
              <p className="text-center text-sm mt-1">
                진행률: {validationProgress}%{" "}
                {isAnalyzing && "(태그 분석 중...)"}
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              총 URL 수: {fileData.length} | 유효한 URL: {validCount} | 유효하지
              않은 URL: {invalidCount} | 검사되지 않은 URL: {uncheckedCount}
              {validOnly && (
                <span className="ml-2 font-medium text-green-600">
                  (현재 유효한 URL {validCount}개만 표시 중)
                </span>
              )}
              {selectedTypeFilter && (
                <span className="ml-2 font-medium text-blue-600">
                  | TYPE: &quot;{selectedTypeFilter}&quot; 필터 적용 중 (
                  {selectedTypeCount}개)
                </span>
              )}
              {selectedStyleFilter && (
                <span className="ml-2 font-medium text-purple-600">
                  | STYLE: &quot;{selectedStyleFilter}&quot; 필터 적용 중 (
                  {selectedStyleCount}개)
                </span>
              )}
            </p>
          </div>

          {typeAnalysisResult && <AnalysisResults />}

          <ul className="list-disc pl-5 space-y-2">
            <li className="border-b pb-2">
              https://cache.wjthinkbig.com/BLLCONTENTS/ACT/과목코드/학년/학기/단원순서/학년_학기_1_목차일련번호_1.XML
              <br />
              https://cache.wjthinkbig.com/BLLCONTENTS/ACT/SCNE/GR14/4/1/GR14_4_1_129787_1.XML
            </li>

            {displayData && displayData.length > 0 ? (
              displayData.map((row, index) => (
                <li
                  key={index}
                  className={`border-b pb-2 ${
                    row.isValid === false
                      ? "bg-red-100"
                      : row.isValid === true
                      ? "bg-green-100"
                      : ""
                  } ${
                    row.typeValue === selectedTypeFilter
                      ? "ring-2 ring-blue-400"
                      : ""
                  } ${
                    row.styleContent === selectedStyleFilter
                      ? "ring-2 ring-purple-400"
                      : ""
                  }`}
                >
                  <div className="mb-1">
                    <span className="font-medium">과목코드:</span>{" "}
                    {row.과목코드}, <span className="font-medium">학년:</span>{" "}
                    {row.학년}, <span className="font-medium">학기:</span>{" "}
                    {row.학기}, <span className="font-medium">단원순서:</span>{" "}
                    {row.단원순서}, <span className="font-medium">학년E:</span>{" "}
                    {row.학년E},{" "}
                    <span className="font-medium">목차일련번호:</span>{" "}
                    {row.목차일련번호}
                    {row.isValid !== undefined && (
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          row.isValid
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                        }`}
                      >
                        {row.isValid ? "유효함" : "접근 불가"}
                        {row.status && `(${row.status})`}
                        {row.isXml && " XML확인"}
                      </span>
                    )}
                    {row.typeValue && (
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          row.typeValue === selectedTypeFilter
                            ? "bg-blue-600 text-white font-bold"
                            : "bg-blue-500 text-white"
                        }`}
                        onClick={() => handleTypeClick(row.typeValue as string)}
                        style={{ cursor: "pointer" }}
                        title="클릭하여 이 TYPE으로 필터링"
                      >
                        TYPE: {row.typeValue}
                      </span>
                    )}
                    {row.styleContent && (
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded ${
                          row.styleContent === selectedTypeFilter
                            ? "bg-purple-600 text-white font-bold"
                            : "bg-purple-500 text-white"
                        }`}
                        style={{ cursor: "pointer" }}
                        title="클릭하여 이 STYLE으로 필터링"
                      >
                        STYLE: {row.styleContent}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (row.url) {
                          downloadXML(row.url, row);
                        }
                      }}
                      disabled={
                        !row.url || row.isValid === false || isDownloading
                      }
                      className="ml-2 px-2 py-1 text-xs rounded bg-teal-500 hover:bg-teal-700 text-white disabled:bg-gray-400"
                    >
                      다운로드
                    </button>
                  </div>
                  <a
                    href={row.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`hover:underline break-all ${
                      row.isValid === false
                        ? "text-red-600 line-through"
                        : "text-blue-600"
                    }`}
                  >
                    {row.url}
                  </a>
                </li>
              ))
            ) : (
              <li className="py-4 text-center text-gray-500">
                {selectedTypeFilter
                  ? `선택한 TYPE "${selectedTypeFilter}"에 해당하는 URL이 없습니다.`
                  : "표시할 URL이 없습니다."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
