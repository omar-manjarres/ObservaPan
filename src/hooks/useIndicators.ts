import { useAsync } from "./useAsync";
import { listSnapshots } from "@/services/indicatorService";
export function useIndicators() {
  return useAsync(() => listSnapshots(), []);
}
