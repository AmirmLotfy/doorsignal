import { CoarseVisionMetadata, CoarseVisionMetadataSchema } from '@doorsignal/arrival-schema';

export const NOVA_COARSE_SCENE_PROMPT = `
You are an operational sensor interpreter for physical front door events.
Examine the image from the doorway camera.
Respond with ONLY valid JSON strictly conforming to this schema:
{
  "person_present": boolean,
  "person_count": integer (0 to 10),
  "package_present": boolean,
  "vehicle_present": boolean
}

STRICT SAFETY AND PRIVACY RULES:
1. Do NOT analyze faces, identity, emotional state, age, race, or clothing brands.
2. Do NOT assign any security threat scores, suspiciousness ratings, or emotional interpretations.
3. Report only physical scene entities (people count, packages, vehicles).
`;

export function parseNovaCoarseResponse(rawJsonResponse: string): CoarseVisionMetadata {
  try {
    const cleaned = rawJsonResponse.trim().replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return CoarseVisionMetadataSchema.parse(parsed);
  } catch (err) {
    // Graceful fallback to default coarse values if multimodal parsing fails
    return {
      person_present: true,
      person_count: 1,
      package_present: false,
      vehicle_present: false
    };
  }
}
