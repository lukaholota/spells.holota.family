import { useCallback, useEffect, useMemo, useState } from "react";
import { femaleFantasyNames, femaleNames, maleFantasyNames, maleNames } from "@/lib/refs/names";
import { femalePatronymics, malePatronymics } from "@/lib/refs/patronymics";
import {
  fantasySurnamesFemale,
  fantasySurnamesMale,
  femaleSurnames,
  maleSurnames,
} from "@/lib/refs/surnames";

type GenderKey = "male" | "female";

type NameGeneratorOptions = {
  gender?: "any" | GenderKey;
  sources?: {
    traditional?: boolean;
    fantasy?: boolean;
  };
  parts?: {
    name?: boolean;
    surname?: boolean;
    patronymic?: boolean;
  };
};

function getRandomIndex(max: number) {
  if (max <= 0) return 0;
  try {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  } catch {
    return Math.floor(Math.random() * max);
  }
}

function pickOne<T>(list: readonly T[]) {
  if (!list.length) return undefined;
  return list[getRandomIndex(list.length)];
}

function pickGender(preferred?: "any" | GenderKey): GenderKey {
  if (preferred === "male" || preferred === "female") return preferred;
  return getRandomIndex(2) === 0 ? "male" : "female";
}

function buildPartsOrder(options: { name: boolean; surname: boolean; patronymic: boolean }) {
  const { name, surname, patronymic } = options;

  if (surname && name && patronymic) return ["surname", "name", "patronymic"] as const;
  if (name && surname) return ["name", "surname"] as const;
  if (name && patronymic) return ["name", "patronymic"] as const;
  if (surname && patronymic) return ["surname", "patronymic"] as const;
  if (surname) return ["surname"] as const;
  if (patronymic) return ["patronymic"] as const;
  return ["name"] as const;
}

export function useFantasyNameGenerator(options?: NameGeneratorOptions) {
  const pools = useMemo(() => {
    return {
      male: {
        names: {
          traditional: maleNames,
          fantasy: maleFantasyNames,
        },
        surnames: {
          traditional: maleSurnames,
          fantasy: fantasySurnamesMale,
        },
        patronymics: malePatronymics,
      },
      female: {
        names: {
          traditional: femaleNames,
          fantasy: femaleFantasyNames,
        },
        surnames: {
          traditional: femaleSurnames,
          fantasy: fantasySurnamesFemale,
        },
        patronymics: femalePatronymics,
      },
    } as const;
  }, []);

  const generateRandomName = useCallback(() => {
    const gender = pickGender(options?.gender);
    const pool = pools[gender];

    const allowTraditional = options?.sources?.traditional ?? true;
    const allowFantasy = options?.sources?.fantasy ?? true;
    const useTraditional = allowTraditional || !allowFantasy;
    const useFantasy = allowFantasy || !allowTraditional;

    const includeName = options?.parts?.name ?? true;
    const includeSurname = options?.parts?.surname ?? true;
    const includePatronymic = options?.parts?.patronymic ?? false;

    const namePool = [
      ...(useTraditional ? pool.names.traditional : []),
      ...(useFantasy ? pool.names.fantasy : []),
    ];
    const surnamePool = [
      ...(useTraditional ? pool.surnames.traditional : []),
      ...(useFantasy ? pool.surnames.fantasy : []),
    ];

    const name = pickOne(namePool) ?? "";
    const surname = pickOne(surnamePool) ?? "";
    const patronymic = pickOne(pool.patronymics) ?? "";

    const chosen = buildPartsOrder({
      name: includeName,
      surname: includeSurname,
      patronymic: includePatronymic,
    });

    const resolved = chosen
      .map((part) => {
        if (part === "name") return name;
        if (part === "surname") return surname;
        return patronymic;
      })
      .filter(Boolean)
      .join(" ");

    return resolved || name;
  }, [options?.gender, options?.parts?.name, options?.parts?.surname, options?.parts?.patronymic, options?.sources?.fantasy, options?.sources?.traditional, pools]);

  const [currentName, setCurrentName] = useState<string>(() => generateRandomName());

  const generateName = useCallback(() => {
    const next = generateRandomName();
    setCurrentName(next);
    return next;
  }, [generateRandomName]);

  useEffect(() => {
    if (!currentName) generateName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentName(generateRandomName());
  }, [generateRandomName]);

  return { currentName, generateName };
}
