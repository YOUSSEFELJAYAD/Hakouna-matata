/**
 * Content Moderation Utilities
 */

const PROFANITY_LIST = [
  // Add profanity words here
];

export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lowerText.includes(word));
}

export function filterProfanity(text: string): string {
  let filtered = text;
  PROFANITY_LIST.forEach((word) => {
    const regex = new RegExp(word, "gi");
    filtered = filtered.replace(regex, "*".repeat(word.length));
  });
  return filtered;
}

export function analyzeContent(text: string): {
  length: number;
  wordCount: number;
  hasProfanity: boolean;
  hasUrls: boolean;
  hasEmails: boolean;
} {
  return {
    length: text.length,
    wordCount: text.split(/\s+/).length,
    hasProfanity: containsProfanity(text),
    hasUrls: /https?:\/\//.test(text),
    hasEmails: /\S+@\S+\.\S+/.test(text),
  };
}
