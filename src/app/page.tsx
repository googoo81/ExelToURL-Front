"use client";

import { useState, ChangeEvent, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

interface ExcelRow {
  [key: string]: string | number;
}

interface ExtractedRow {
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
}

interface JobStatus {
  status: "in_progress" | "completed";
  progress: number;
  results?: Array<{
    url: string;
    isValid: boolean;
    statusCode: number;
    isXml?: boolean;
    error?: string;
  }>;
}

export default function Home() {
  const [fileData, setFileData] = useState<ExtractedRow[] | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validOnly, setValidOnly] = useState<boolean>(false);
  const [showValidOnly, setShowValidOnly] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [serverUrl, setServerUrl] = useState<string>("http://127.0.0.1:5000/");
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
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
    };
    reader.readAsArrayBuffer(file);
  };

  const copyAllUrls = () => {
    if (!fileData) return;

    const dataToUse = validOnly
      ? fileData.filter((row) => row.isValid)
      : fileData;

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

  const startUrlValidation = async () => {
    if (!fileData) return;

    setIsValidating(true);
    setValidationProgress(0);

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

  const assumeAllValid = () => {
    if (!fileData) return;
    setIsValidating(true);
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
  };

  const displayData = fileData
    ? showValidOnly
      ? fileData.filter((row) => row.isValid === true)
      : fileData
    : null;

  const validCount =
    fileData?.filter((row) => row.isValid === true).length || 0;
  const invalidCount =
    fileData?.filter((row) => row.isValid === false).length || 0;
  const uncheckedCount =
    fileData?.filter((row) => row.isValid === undefined).length || 0;

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
              {isValidating ? (
                <button
                  onClick={cancelValidation}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                >
                  검사 취소
                </button>
              ) : (
                <>
                  <button
                    onClick={startUrlValidation}
                    disabled={isValidating}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    URL 유효성 검사 (폴링)
                  </button>

                  <button
                    onClick={startXmlValidation}
                    disabled={isValidating}
                    className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded cursor-pointer disabled:bg-gray-400"
                  >
                    XML 특수 검사 (폴링)
                  </button>
                </>
              )}

              <button
                onClick={assumeAllValid}
                disabled={isValidating}
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
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
              >
                {copySuccess ? "복사 완료!" : "모든 URL 복사"}
              </button>
            </div>
          </div>

          {isValidating && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${validationProgress}%` }}
              ></div>
              <p className="text-center text-sm mt-1">
                진행률: {validationProgress}%
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
            </p>
          </div>

          <ul className="list-disc pl-5 space-y-2">
            <li className="border-b pb-2">
              https://cache.wjthinkbig.com/BLLCONTENTS/ACT/과목코드/학년/학기/단원순서/학년_학기_1_목차일련번호_1.XML{" "}
              <br />
              https://cache.wjthinkbig.com/BLLCONTENTS/ACT/SCNE/GR14/4/1/GR14_4_1_129787_1.XML
            </li>

            {displayData &&
              displayData.map((row, index) => (
                <li
                  key={index}
                  className={`border-b pb-2 ${
                    row.isValid === false
                      ? "bg-red-100"
                      : row.isValid === true
                      ? "bg-green-100"
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
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
