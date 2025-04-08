import { useState, useEffect } from "react";
import axios from "axios";
import { JobStatus, JobType } from "@/types";

export default function useJobPolling(serverUrl: string) {
  const [progress, setProgress] = useState<number>(0);
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

  const pollJobStatus = (
    jobId: string,
    jobType: JobType = "validation",
    callbacks: {
      onComplete?: (jobStatus: JobStatus) => void;
      onError?: (error: unknown) => void;
      onProgress?: (progress: number) => void;
    } = {}
  ) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await axios.get<JobStatus>(
          `${serverUrl}/job-status/${jobId}`
        );
        const jobStatus = response.data;

        setProgress(jobStatus.progress);
        callbacks.onProgress?.(jobStatus.progress);

        if (jobStatus.status === "completed") {
          clearInterval(interval);
          setPollingInterval(null);
          callbacks.onComplete?.(jobStatus);
        }
      } catch (error) {
        console.error(`Error polling ${jobType} status:`, error);
        clearInterval(interval);
        setPollingInterval(null);
        callbacks.onError?.(error);
      }
    }, 1000);

    setPollingInterval(interval);
  };

  const cancelPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  return {
    progress,
    pollJobStatus,
    cancelPolling,
    isPolling: !!pollingInterval,
  };
}
