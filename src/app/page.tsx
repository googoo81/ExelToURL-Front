"use client";

import { useState, ChangeEvent, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { ExcelRow, ExtractedRow, JobStatus } from "@/types";
import React from "react";

export default function Home() {
  const [fileData, setFileData] = useState<ExtractedRow[] | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [validOnly, setValidOnly] = useState<boolean>(false);
  const [showValidOnly, setShowValidOnly] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [serverUrl, setServerUrl] = useState<string>("http://127.0.0.1:5000/");
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [typeAnalysisResult, setTypeAnalysisResult] = useState<Record<
    string,
    number
  > | null>(null);
  const [styleAnalysisResult, setStyleAnalysisResult] = useState<Record<
    string,
    number
  > | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(
    null
  );
  const [selectedStyleFilter, setSelectedStyleFilter] = useState<string | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (!result || typeof result === "string") return;

      const data = new Uint8Array(result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const originalData = XLSX.utils.sheet_to_json(sheet, {
        header: "A",
      }) as ExcelRow[];

      const filteredOriginalData = originalData.filter((row: ExcelRow) => {
        return row["Z"] !== "중복" && row["U"] === "Y";
      });

      const extractedData = filteredOriginalData
        .slice(1)
        .map((row) => {
          const typedRow = row as Record<string, string | number>;
          const rowEntries = Object.entries(typedRow);

          if (rowEntries.length === 0) return null;
          const grade = String(rowEntries[3]?.[1] || "");
          const term = String(rowEntries[4]?.[1] || "");

          let gradeE: string;
          switch (grade) {
            case "예비초":
              gradeE = "GR10";
              break;
            case "1학년":
              gradeE = "GR11";
              break;
            case "2학년":
              gradeE = "GR12";
              break;
            case "3학년":
              gradeE = "GR13";
              break;
            case "4학년":
              gradeE = "GR14";
              break;
            case "5학년":
              gradeE = "GR15";
              break;
            case "6학년":
              gradeE = "GR16";
              break;
            default:
              gradeE = grade;
          }

          let termE: string;
          switch (term) {
            case "여름방학":
              termE = "3";
              break;
            case "겨울방학":
              termE = "4";
              break;
            default:
              termE = term.slice(0, 1);
              break;
          }

          const extractedValues: ExtractedRow = {
            과목코드: rowEntries[1]?.[1],
            학년: grade.slice(0, 1),
            학기: termE,
            단원순서: rowEntries[5]?.[1],
            목차일련번호: rowEntries[6]?.[1],
            학년E: gradeE,
            url: null,
          };

          const resultURL = `https://cache.wjthinkbig.com/BLLCONTENTS/ACT/${extractedValues.과목코드}/${extractedValues.학년E}/${extractedValues.학기}/${extractedValues.단원순서}/${extractedValues.학년E}_${extractedValues.학기}_1_${extractedValues.목차일련번호}_1.XML`;
          extractedValues.url = resultURL;

          return extractedValues;
        })
        .filter((row): row is ExtractedRow => row !== null);

      console.log(extractedData);
      setFileData(extractedData);
      setSelectedTypeFilter(null);
      setSelectedStyleFilter(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const getFilteredData = () => {
    if (!fileData) return [];

    let filteredData = [...fileData];

    if (validOnly) {
      filteredData = filteredData.filter((row) => row.isValid);
    }

    if (selectedTypeFilter) {
      filteredData = filteredData.filter(
        (row) => row.typeValue === selectedTypeFilter
      );
    }

    if (selectedStyleFilter) {
      filteredData = filteredData.filter(
        (row) => row.styleContent === selectedStyleFilter
      );
    }

    return filteredData;
  };

  const copyAllUrls = () => {
    if (!fileData) return;

    const dataToUse = getFilteredData();

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

  const pollJobStatus = (jobId: string) => {
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
          setIsValidating(false);

          if (jobStatus.results && fileData) {
            const updatedData = [...fileData];

            jobStatus.results.forEach((result) => {
              const matchingRow = updatedData.find(
                (row) => row.url === result.url
              );
              if (matchingRow) {
                matchingRow.isValid = result.isValid;
                matchingRow.status = result.statusCode;
                matchingRow.isXml = result.isXml;
                matchingRow.typeValue = result.type_value;
                matchingRow.styleContent = result.style_content;
              }
            });

            setFileData(updatedData);
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        clearInterval(interval);
        setPollingInterval(null);
        setIsValidating(false);
      }
    }, 1000);

    setPollingInterval(interval);
  };

  const pollTypeAnalysisStatus = (jobId: string) => {
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
          setIsAnalyzing(false);

          if (jobStatus.type_counts) {
            setTypeAnalysisResult(jobStatus.type_counts);
          }

          if (jobStatus.style_counts) {
            setStyleAnalysisResult(jobStatus.style_counts);
          }

          if (jobStatus.results && fileData) {
            const updatedData = [...fileData];

            jobStatus.results.forEach((result) => {
              const matchingRow = updatedData.find(
                (row) => row.url === result.url
              );
              if (matchingRow) {
                if (result.type_value) {
                  matchingRow.typeValue = result.type_value;
                }
                if (result.style_content) {
                  matchingRow.styleContent = result.style_content;
                }
              }
            });

            setFileData(updatedData);
          }
        }
      } catch (error) {
        console.error("Error polling analysis status:", error);
        clearInterval(interval);
        setPollingInterval(null);
        setIsAnalyzing(false);
      }
    }, 1000);

    setPollingInterval(interval);
  };

  const startUrlValidation = async () => {
    if (!fileData) return;

    setIsValidating(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);

    try {
      const urls = fileData.map((row) => row.url).filter(Boolean) as string[];
      const response = await axios.post(`${serverUrl}/start-validation`, {
        urls,
      });
      const jobId = response.data.job_id;
      pollJobStatus(jobId);
    } catch (error) {
      console.error("Error starting validation:", error);
      setIsValidating(false);
    }
  };

  const startXmlValidation = async () => {
    if (!fileData) return;

    setIsValidating(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);

    try {
      const urls = fileData.map((row) => row.url).filter(Boolean) as string[];
      const response = await axios.post(`${serverUrl}/start-xml-validation`, {
        urls,
      });
      const jobId = response.data.job_id;
      pollJobStatus(jobId);
    } catch (error) {
      console.error("Error starting XML validation:", error);
      setIsValidating(false);
    }
  };

  const startTypeAnalysis = async () => {
    if (!fileData) return;

    setIsAnalyzing(true);
    setValidationProgress(0);
    setSelectedTypeFilter(null);
    setSelectedStyleFilter(null);

    try {
      const validUrls = fileData
        .filter((row) => row.isValid === true)
        .map((row) => row.url)
        .filter(Boolean) as string[];

      if (validUrls.length === 0) {
        alert(
          "분석할 유효한 URL이 없습니다. 먼저 URL 유효성 검사를 실행해주세요."
        );
        setIsAnalyzing(false);
        return;
      }

      const response = await axios.post(`${serverUrl}/analyze-xml-types`, {
        urls: validUrls,
      });

      const jobId = response.data.job_id;
      pollTypeAnalysisStatus(jobId);
    } catch (error) {
      console.error("Error starting XML type analysis:", error);
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

  const handleTypeClick = (typeValue: string) => {
    if (selectedTypeFilter === typeValue) {
      setSelectedTypeFilter(null);
    } else {
      setSelectedTypeFilter(typeValue);
      setSelectedStyleFilter(null);
    }
  };

  const handleStyleClick = (styleValue: string) => {
    if (selectedStyleFilter === styleValue) {
      setSelectedStyleFilter(null);
    } else {
      setSelectedStyleFilter(styleValue);
      setSelectedTypeFilter(null);
    }
  };

  const displayData = React.useMemo(() => {
    if (!fileData) return null;

    let filtered = [...fileData];

    if (showValidOnly) {
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
  }, [fileData, showValidOnly, selectedTypeFilter, selectedStyleFilter]);

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

  const filteredCount = getFilteredData().length;

  const TypeAnalysisResults = ({
    typeAnalysisResult,
  }: {
    typeAnalysisResult: Record<string, number> | null;
  }) => {
    if (!typeAnalysisResult) return null;

    const entries = Object.entries(typeAnalysisResult);
    if (entries.length === 0) return <p>분석 결과가 없습니다.</p>;

    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    return (
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-bold mb-3">
          XML &lt;TYPE&gt; 태그 분석 결과
        </h3>
        <p className="mb-2">총 분석된 XML 파일: {total}개</p>

        {selectedTypeFilter && (
          <div className="mb-4 p-2 bg-blue-100 rounded flex items-center justify-between">
            <p>
              <span className="font-bold">
                &quot;{selectedTypeFilter}&quot;
              </span>{" "}
              TYPE 필터 적용 중 ({selectedTypeCount}개 URL)
            </p>
            <button
              onClick={() => setSelectedTypeFilter(null)}
              className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
            >
              필터 해제
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">TYPE 값</th>
                <th className="border p-2 text-center">갯수</th>
                <th className="border p-2 text-center">비율</th>
                <th className="border p-2 text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {entries
                .sort((a, b) => b[1] - a[1])
                .map(([typeValue, count]) => (
                  <tr
                    key={typeValue || "없음"}
                    className={`hover:bg-gray-100 ${
                      selectedTypeFilter === typeValue ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="border p-2 font-medium">
                      {typeValue || (
                        <span className="text-gray-500 italic">없음</span>
                      )}
                    </td>
                    <td className="border p-2 text-center">{count}</td>
                    <td className="border p-2 text-center">
                      {((count / total) * 100).toFixed(1)}%
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleTypeClick(typeValue)}
                        className={`py-1 px-3 rounded text-sm ${
                          selectedTypeFilter === typeValue
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {selectedTypeFilter === typeValue
                          ? "필터 해제"
                          : "URL 보기"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const StyleAnalysisResults = ({
    styleAnalysisResult,
  }: {
    styleAnalysisResult: Record<string, number> | null;
  }) => {
    if (!styleAnalysisResult) return null;

    const entries = Object.entries(styleAnalysisResult);
    if (entries.length === 0) return <p>STYLE 분석 결과가 없습니다.</p>;

    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    return (
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-bold mb-3">
          XML &lt;STYLE&gt; 태그 분석 결과
        </h3>
        <p className="mb-2">총 분석된 XML 파일: {total}개</p>

        {selectedStyleFilter && (
          <div className="mb-4 p-2 bg-purple-100 rounded flex items-center justify-between">
            <p>
              <span className="font-bold">
                &quot;{selectedStyleFilter}&quot;
              </span>{" "}
              STYLE 필터 적용 중 ({selectedStyleCount}개 URL)
            </p>
            <button
              onClick={() => setSelectedStyleFilter(null)}
              className="bg-purple-500 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm"
            >
              필터 해제
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">STYLE 값</th>
                <th className="border p-2 text-center">갯수</th>
                <th className="border p-2 text-center">비율</th>
                <th className="border p-2 text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {entries
                .sort((a, b) => b[1] - a[1])
                .map(([styleValue, count]) => (
                  <tr
                    key={styleValue || "없음"}
                    className={`hover:bg-gray-100 ${
                      selectedStyleFilter === styleValue ? "bg-purple-50" : ""
                    }`}
                  >
                    <td className="border p-2 font-medium">
                      {styleValue || (
                        <span className="text-gray-500 italic">없음</span>
                      )}
                    </td>
                    <td className="border p-2 text-center">{count}</td>
                    <td className="border p-2 text-center">
                      {((count / total) * 100).toFixed(1)}%
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleStyleClick(styleValue)}
                        className={`py-1 px-3 rounded text-sm ${
                          selectedStyleFilter === styleValue
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {selectedStyleFilter === styleValue
                          ? "필터 해제"
                          : "URL 보기"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const downloadXML = async (url: string, filename: string) => {
    try {
      const response = await axios.get(`${serverUrl}/download-xml`, {
        params: { url },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/xml" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename || "download.xml");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (error) {
      console.error("Error downloading XML:", error);
      alert("XML 다운로드 중 오류가 발생했습니다.");
      return false;
    }
  };

  const downloadSelectedXMLs = async (useZip = true) => {
    const dataToDownload = getFilteredData();
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
        const response = await axios.post(
          `${serverUrl}/create-zip`,
          { urls },
          { responseType: "blob" }
        );

        const blob = new Blob([response.data], { type: "application/zip" });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", "xml_files.zip");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        alert(`${urls.length}개의 XML 파일이 ZIP으로 다운로드되었습니다.`);
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

        const filename = row.url.split("/").pop() || `file_${i}.xml`;

        const success = await downloadXML(row.url, filename);
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

      <div className="mb-4">
        <button
          onClick={() => setShowServerConfig(!showServerConfig)}
          className="mb-2 bg-gray-500 hover:bg-gray-700 text-white py-1 px-3 rounded text-sm"
        >
          {showServerConfig ? "서버 설정 닫기" : "서버 설정 보기"}
        </button>

        {showServerConfig && (
          <div className="p-3 border rounded bg-gray-50">
            <div className="flex gap-2 items-center">
              <label className="font-medium">Flask 서버 URL:</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="border rounded p-1 flex-grow"
                placeholder="http://127.0.0.1:5000/"
              />
            </div>
          </div>
        )}
      </div>

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
                    onClick={startUrlValidation}
                    disabled={isValidating || isAnalyzing}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    URL 유효성 검사
                  </button>

                  <button
                    onClick={startXmlValidation}
                    disabled={isValidating || isAnalyzing}
                    className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    XML 특수 검사
                  </button>

                  <button
                    onClick={startTypeAnalysis}
                    disabled={isValidating || isAnalyzing}
                    className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    &lt;TYPE&gt; 및 &lt;STYLE&gt; 태그 분석
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
                <label htmlFor="validOnly">유효한 URL만 복사</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showValidOnly"
                  checked={showValidOnly}
                  onChange={(e) => setShowValidOnly(e.target.checked)}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="showValidOnly"
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
                        ? `필터링된 URL 복사 (${filteredCount}개)`
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
                  : `ZIP으로 다운로드 (${filteredCount}개)`}
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
              {showValidOnly && (
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

          {typeAnalysisResult && (
            <TypeAnalysisResults typeAnalysisResult={typeAnalysisResult} />
          )}

          {styleAnalysisResult && (
            <StyleAnalysisResults styleAnalysisResult={styleAnalysisResult} />
          )}

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
                          const filename =
                            row.url.split("/").pop() || "file.xml";
                          downloadXML(row.url, filename);
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
