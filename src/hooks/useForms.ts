import { useAsync } from "./useAsync";
import { listForms, listActiveForms } from "@/services/formService";
export function useForms(activeOnly = false) {
  return useAsync(() => (activeOnly ? listActiveForms() : listForms()), [activeOnly]);
}
