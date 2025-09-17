import { usePathname, useSelectedLayoutSegments } from "next/navigation";

export default function useBreadcrumb() {
  const SEP = "/";
  const segmentsAll = usePathname().split(SEP);
  const segmentsAfter = useSelectedLayoutSegments();
  const segments = segmentsAll.slice(0, segmentsAll.length - segmentsAfter.length);
  const href = segments.join(SEP) || SEP;
  const isActive = segmentsAfter.length === 0;
  return [href, isActive];
}
