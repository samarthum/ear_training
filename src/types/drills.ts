export type IntervalDirection = "asc" | "desc" | "harm";

export type PromptPayload =
  | {
      kind: "INTERVAL";
      key: string; // e.g., "C"
      mode: "major";
      interval: string; // e.g., "m3"
      direction: IntervalDirection;
    }
  | {
      kind: "CHORD";
      key: string;
      quality: "maj" | "min" | "dim" | "aug";
      inversion: 0 | 1 | 2;
    }
  | {
      kind: "PROGRESSION";
      key: string;
      steps: Array<"I" | "ii" | "IV" | "V" | "vi">;
    };


