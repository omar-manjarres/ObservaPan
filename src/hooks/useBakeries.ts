import { useAsync } from "./useAsync";
import { listBakeries } from "@/services/bakeryService";
export function useBakeries() {
  return useAsync(() => listBakeries(), []);
}
