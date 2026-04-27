export type DetectedLanguage =
  | "GREEK"
  | "ENGLISH"
  | "MIXED"
  | "GREEKLISH"
  | "UNKNOWN";

export type LanguageDetection = {
  language: DetectedLanguage;
  confidence: number;
  greekCharacters: number;
  latinCharacters: number;
  greeklishSignals: string[];
  englishSignals: string[];
};

export type TextAnalysis = {
  rawText: string;
  displayText: string;
  normalizedText: string;
  searchText: string;
  greeklishText: string | null;
  detection: LanguageDetection;
};

export type ExtractedDateTime = {
  raw: string;
  normalized: string;
  kind: "DATE" | "TIME" | "RELATIVE";
};

export type ExtractedEntities = {
  names: string[];
  phones: string[];
  emails: string[];
  dateTimes: ExtractedDateTime[];
  locations: string[];
};
