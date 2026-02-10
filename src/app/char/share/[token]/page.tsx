import { getCharacterFeaturesGroupedByShareToken } from "@/lib/actions/pers";
import { getPersByShareToken } from "@/lib/actions/share-actions";
import { notFound } from "next/navigation";
import CharacterSheet from "@/lib/components/characterSheet/CharacterSheet";
import { PersWithRelations } from "@/lib/actions/pers";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { pers, canEdit } = await getPersByShareToken(token);
  if (!pers) notFound();

  const groupedFeatures = await getCharacterFeaturesGroupedByShareToken(token);

  return (
    <CharacterSheet
      pers={pers as PersWithRelations}
      groupedFeatures={groupedFeatures}
      isPublicView={true}
      editShareToken={canEdit ? token : undefined}
    />
  );
}
