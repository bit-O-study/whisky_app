import type { Liquor } from "./liquor";

export type FlavorDimension = "sweet" | "smoky" | "fruity" | "spicy" | "woody" | "body";

export interface FlavorVector {
  sweet: number;
  smoky: number;
  fruity: number;
  spicy: number;
  woody: number;
  body: number;
}

export interface PreferenceRecommendation {
  liquor: Liquor;
  similarity: number;
  reason: string;
}

export interface PreferenceResult {
  type_name: string;
  flavor_vector: FlavorVector;
  recommendations: PreferenceRecommendation[];
}

export interface PreferenceQuestionOption {
  label: string;
  weights: Partial<Record<FlavorDimension, number>>;
}

export interface PreferenceQuestion {
  id: string;
  title: string;
  description?: string;
  options: PreferenceQuestionOption[];
}
