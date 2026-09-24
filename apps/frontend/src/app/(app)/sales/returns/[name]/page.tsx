import { SharedDetail } from "../../delivery-notes/SharedDetail";

export default async function SalesReturnDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;
  return <SharedDetail name={name} saved={saved} expectedReturn={true} />;
}
