export type CreateStep =
  | "consent"
  | "photos"
  | "questions"
  | "generating-preview"
  | "preview"
  | "generating-full"
  | "book";

export type ChildData = {
  name: string;
  age_band: "4-6" | "7-9";
  interests: string[];
  favorites: string[];
  fears_to_avoid: string[];
};

export type ResumableJob = {
  id: string;
  type: string;
  status: string;
};

export type GenerationProgress = {
  completed_count: number;
  total_count: number;
};

export type BookBeat = {
  generated_text?: string;
  generated_image_url: string;
};
