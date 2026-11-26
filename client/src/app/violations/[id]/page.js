
import ViolationDetailClient from "./ViolationDetailClient";

export const instant = false;

export default async function ViolationDetailPage({ params }) {
  const { id } = await params;

  return <ViolationDetailClient id={id} />;
}
