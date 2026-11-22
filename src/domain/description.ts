import type { AbilityName, AbilityScore } from "./ability.js";
import type { Sex } from "./name.js";
import type { Dice } from "./ports/dice.js";
import {
  type DescriptionFeature,
  descriptionTables,
  type ImpliedAbility,
} from "./tables/descriptions.js";

export interface Feature {
  category: string;
  feature: string;
}

const categoryDieSides = 10;
const featureDieSides = 20;
const featureCount = 2;

const impliedAbilityNames: Record<ImpliedAbility, AbilityName> = {
  STR: "strength",
  AGI: "agility",
  STA: "stamina",
  INT: "intelligence",
};

function isAllowed(
  feature: DescriptionFeature,
  abilities: Record<AbilityName, AbilityScore>,
): boolean {
  if (feature.implies === undefined) return true;
  const modifier =
    abilities[impliedAbilityNames[feature.implies.slice(0, 3) as ImpliedAbility]].modifier;
  return feature.implies.endsWith("+") ? modifier >= 1 : modifier <= -1;
}

function pickAllowed(
  features: readonly DescriptionFeature[],
  rolled: number,
  abilities: Record<AbilityName, AbilityScore>,
): DescriptionFeature | undefined {
  for (let step = 0; step < features.length; step++) {
    const feature = features[(rolled - 1 + step) % features.length];
    if (feature !== undefined && isAllowed(feature, abilities)) return feature;
  }
  return undefined;
}

export function rollFeatures(
  dice: Dice,
  sex: Sex,
  abilities: Record<AbilityName, AbilityScore>,
): Feature[] {
  const categories = descriptionTables[sex];
  const chosen: number[] = [];
  const features: Feature[] = [];
  for (let i = 0; i < featureCount; i++) {
    let category = dice.roll(categoryDieSides);
    while (chosen.includes(category)) category = dice.roll(categoryDieSides);
    chosen.push(category);
    const entry = categories[category - 1];
    const rolled = dice.roll(featureDieSides);
    const feature = entry && pickAllowed(entry.features, rolled, abilities);
    if (entry === undefined || feature === undefined) throw new Error("description table is short");
    features.push({ category: entry.name, feature: feature.text });
  }
  return features;
}
