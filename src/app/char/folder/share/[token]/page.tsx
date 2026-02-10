import { notFound } from "next/navigation";
import { getFolderByShareToken } from "@/lib/actions/share-actions";
import { SharedFolderView } from "@/lib/components/characterFolder/SharedFolderView";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const result = await getFolderByShareToken(token);
  if (!result) notFound();

  const { folder, canEdit } = result;

  return <SharedFolderView token={token} folder={folder as any} canEdit={canEdit} />;
}
