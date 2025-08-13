import { z } from "zod";

export const IntervalPromptSchema = z.object({
	kind: z.literal("INTERVAL"),
	key: z.string().min(1),
	mode: z.literal("major"),
	interval: z.string().min(1),
	direction: z.enum(["asc", "desc", "harm"]),
});

// Extend with CHORD/PROGRESSION when implemented
export const PromptPayloadSchema = z.discriminatedUnion("kind", [IntervalPromptSchema]);

export const AttemptPostSchema = z.object({
	drillId: z.string().min(1),
	prompt: PromptPayloadSchema,
	answer: z.record(z.any()),
	isCorrect: z.boolean(),
	latencyMs: z.number().int().nonnegative(),
});

export type AttemptPostInput = z.infer<typeof AttemptPostSchema>;


