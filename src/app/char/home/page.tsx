import { getUserPersHomeData } from "@/lib/actions/pers";
import { CharHomeClient } from "@/app/char/home/CharHomeClient";

export default async function Page() {
  const { perses, folders } = await getUserPersHomeData();
  const visibleFolderIds = new Set(folders.map((folder) => folder.folderId));

  const items = perses.map((pers) => ({
    persId: pers.persId,
    name: pers.name,
    level: pers.level,
    currentHp: pers.currentHp,
    maxHp: pers.maxHp,
    raceName: pers.race.name,
    className: pers.class.name,
    backgroundName: pers.background.name,
    folderId: pers.folderId && visibleFolderIds.has(pers.folderId) ? pers.folderId : null,
    isPinned: pers.isPinned,
    classNames: [
      pers.class?.name,
      ...(pers.multiclasses ?? []).map((mc) => mc.class?.name).filter(Boolean),
    ].filter(Boolean),
    subclassNames: [
      pers.subclass?.name,
      ...(pers.multiclasses ?? []).map((mc) => mc.subclass?.name).filter(Boolean),
    ].filter(Boolean),
  }));

  return <CharHomeClient perses={items} folders={folders} />;
}
