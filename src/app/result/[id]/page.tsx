import { ResultView } from "@/components/result-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  return <ResultView id={id} />;
}
