"use client";

import { usePersFormStore } from "@/lib/stores/persFormStore";
import { languagesSchema } from "@/lib/zod/schemas/persCreateSchema";
import { useStepForm } from "@/hooks/useStepForm";
import { ClassI, BackgroundI, RaceI, SubraceI } from "@/lib/types/model-types";
import { Feat } from "@prisma/client";
import { useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { LanguageTranslations } from "@/lib/refs/translation";
import clsx from "clsx";

const EMPTY_LANGUAGES: string[] = [];

interface Props {
  race: RaceI;
  selectedClass: ClassI;
  subclass?: any;
  background: BackgroundI;
  selectedSubrace?: SubraceI | null;
  activeFeatures: any[];
  feat?: Feat | undefined;
  backgroundFeat?: Feat | undefined;
  existingLanguages?: string[];
  forcedLanguagesToChooseCount?: number;
  isOptional?: boolean;
  formId: string;
  onNextDisabledChange?: (disabled: boolean) => void;
}

export const LanguagesForm = ({
  race,
  selectedClass,
  subclass,
  background,
  selectedSubrace,
  activeFeatures,
  feat,
  backgroundFeat,
  existingLanguages,
  forcedLanguagesToChooseCount,
  isOptional = false,
  formId,
  onNextDisabledChange,
}: Props) => {
  const { formData, updateFormData, nextStep } = usePersFormStore();

  const { form, onSubmit } = useStepForm(languagesSchema, (data) => {
    updateFormData({ languagesSchema: data });
    nextStep();
  });

  const fixedLanguages = useMemo(() => {
    const langs = new Set<string>();
    (race.languages || []).forEach((l) => langs.add(l));
    (selectedClass.languages || []).forEach((l) => langs.add(l));
    if (subclass?.languages) subclass.languages.forEach((l: any) => langs.add(l));
    if (selectedSubrace?.additionalLanguages) selectedSubrace.additionalLanguages.forEach((l: any) => langs.add(l));
    if ((background as any).languages) (background as any).languages.forEach((l: any) => langs.add(l));
    if (feat?.grantedLanguages) feat.grantedLanguages.forEach((l: any) => langs.add(String(l)));
    if (backgroundFeat?.grantedLanguages) backgroundFeat.grantedLanguages.forEach((l: any) => langs.add(String(l)));
    activeFeatures.forEach((f) => {
      (f?.givesLanguages || []).forEach((l: any) => langs.add(String(l)));
    });
    existingLanguages?.forEach((l) => langs.add(l));

    return Array.from(langs);
  }, [race, selectedClass, subclass, selectedSubrace, background, feat, backgroundFeat, activeFeatures, existingLanguages]);

  const languagesToChooseCount = useMemo(() => {
    if (typeof forcedLanguagesToChooseCount === "number") {
      return forcedLanguagesToChooseCount;
    }
    let count = (race.languagesToChooseCount || 0) + (selectedClass.languagesToChooseCount || 0);
    if (subclass?.languagesToChooseCount) count += subclass.languagesToChooseCount;
    if (selectedSubrace?.languagesToChooseCount) count += selectedSubrace.languagesToChooseCount;
    if (background.languagesToChooseCount) count += background.languagesToChooseCount;
    if (feat?.grantedLanguageCount) count += feat.grantedLanguageCount;
    if (backgroundFeat?.grantedLanguageCount) count += backgroundFeat.grantedLanguageCount;

    activeFeatures.forEach((f) => {
      count += f.languagesToChooseCount || 0;
    });

    // Race choice options directly
    if (formData.raceChoiceSelections) {
       Object.values(formData.raceChoiceSelections).forEach((id: any) => {
         const opt = race.raceChoiceOptions?.find((o) => o.optionId === id);
          if (opt && (opt as any).languagesToChooseCount) {
             count += (opt as any).languagesToChooseCount;
          }
       });
    }

    return count;
  }, [race, selectedClass, subclass, selectedSubrace, background, feat, backgroundFeat, activeFeatures, formData.raceChoiceSelections, forcedLanguagesToChooseCount]);

  const selectedLanguages = form.watch("languages") ?? EMPTY_LANGUAGES;

  useEffect(() => {
    if (isOptional) {
      onNextDisabledChange?.(false);
      return;
    }

    onNextDisabledChange?.(selectedLanguages.length !== languagesToChooseCount);
  }, [isOptional, selectedLanguages.length, languagesToChooseCount, onNextDisabledChange]);

  useEffect(() => {
    updateFormData({ languagesSchema: { languages: selectedLanguages } });
  }, [selectedLanguages, updateFormData]);

  const toggleLanguage = (lang: string) => {
    const current = form.getValues("languages") || [];
    if (current.includes(lang)) {
      const next = current.filter((l) => l !== lang);
      form.setValue("languages", next);
      updateFormData({ languagesSchema: { languages: next } });
    } else if (current.length < languagesToChooseCount) {
      const next = [...current, lang];
      form.setValue("languages", next);
      updateFormData({ languagesSchema: { languages: next } });
    }
  };

  const availableLanguages = Object.keys(LanguageTranslations).filter(
    (l) => !fixedLanguages.includes(l)
  );

  if (languagesToChooseCount === 0) {
      // Should not happen if step is shown, but safety first
      return null;
  }

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <h3 className="text-xl font-bold text-slate-100 mb-2">Вибір мов</h3>
        <p className="text-slate-400">
          Ви можете обрати ще {languagesToChooseCount - selectedLanguages.length} з {languagesToChooseCount} мов.
        </p>
        {isOptional ? (
          <p className="mt-2 text-sm text-slate-500">Цей крок можна пропустити.</p>
        ) : null}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {fixedLanguages.map((lang) => (
          <div
            key={lang}
            className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 opacity-60"
          >
            <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center bg-slate-700">
              <Check className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-slate-300">{LanguageTranslations[lang] || lang}</span>
          </div>
        ))}

        {availableLanguages.map((lang) => {
          const isSelected = selectedLanguages.includes(lang);
          const canSelect = isSelected || selectedLanguages.length < languagesToChooseCount;

          return (
            <button
              key={lang}
              type="button"
              disabled={!canSelect}
              onClick={() => toggleLanguage(lang)}
              className={clsx(
                "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                isSelected
                  ? "bg-amber-500/10 border-amber-500/50 text-amber-200"
                  : canSelect
                  ? "bg-slate-800/50 border-slate-700 hover:border-slate-500 text-slate-300"
                  : "bg-slate-900/20 border-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  isSelected ? "bg-amber-500 border-amber-500" : "border-slate-600 bg-slate-700"
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span>{LanguageTranslations[lang] || lang}</span>
            </button>
          );
        })}
      </div>

      <form id={formId} onSubmit={onSubmit} className="hidden" />
    </div>
  );
};
