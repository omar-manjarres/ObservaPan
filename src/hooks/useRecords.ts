import { useAsync } from "./useAsync";
import { listRecords } from "@/services/recordService";
export function useRecords() {
  return useAsync(() => listRecords(), []);
}
