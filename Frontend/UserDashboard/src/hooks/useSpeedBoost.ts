import { useState, useEffect } from "react";
import { speedBoostService, SpeedBoostRequest } from "@/services/api";

export const useSpeedBoost = (status?: string) => {
  const [requests, setRequests] = useState<SpeedBoostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await speedBoostService.getAll(status ? { status } : undefined);
      setRequests(data);
    } catch (err) {
      setError(err as Error);
      console.error("Error loading speed boost requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [status]);

  return {
    requests,
    loading,
    error,
    refresh: loadRequests,
  };
};
