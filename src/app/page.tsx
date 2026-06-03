import { PriceExplorer } from "@/components/PriceExplorer";
import { SubmissionFloater } from "@/components/SubmissionFloater";

export default function Home() {
  return (
    <>
      <PriceExplorer restoreStateFromUrl />
      <SubmissionFloater />
    </>
  );
}
