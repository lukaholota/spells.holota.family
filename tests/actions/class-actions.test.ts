import { afterAll, describe, expect, it } from "vitest";
import { Classes } from "@prisma/client";
import { getSubclassesByClassId } from "@/lib/actions/class-actions";
import { classByName } from "../helpers/seed-lookup";
import { disconnectDatabase } from "../user-data";

afterAll(disconnectDatabase);

describe("getSubclassesByClassId", () => {
  it("returns Fighter subclasses in ascending ID order with modal metadata and features", async () => {
    const fighter = await classByName(Classes.FIGHTER_2014);

    const subclasses = await getSubclassesByClassId(fighter.classId);

    expect(subclasses.length).toBeGreaterThan(0);
    expect(subclasses.map((subclass) => subclass.subclassId)).toEqual(
      [...subclasses].map((subclass) => subclass.subclassId).sort((left, right) => left - right),
    );
    expect(subclasses[0]).toMatchObject({
      subclassId: expect.any(Number),
      name: expect.any(String),
      features: expect.arrayContaining([
        expect.objectContaining({
          levelGranted: expect.any(Number),
          feature: expect.objectContaining({ featureId: expect.any(Number), name: expect.any(String) }),
        }),
      ]),
    });
  });
});
