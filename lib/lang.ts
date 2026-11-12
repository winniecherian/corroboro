/**
 * English-only filter. Drops text written mostly in non-Latin scripts
 * (Hindi, Tamil, Arabic, Chinese, etc.) and Latin-script text with many accented letters
 * (Spanish, German, French...). Simple and fast; no language model needed.
 */
const FOREIGN_HINTS = /(?<![\p{L}])(el|la|los|las|del|de|en|es|una|un|der|die|das|und|mit|von|zu|im|le|les|des|du|au|est|não|para|com|nicht|y|que|por|ist|hoy|precio)(?![\p{L}])/gu; // lowercase only, so names like "De Bruyne" or "Le Mans" don't count

export function isEnglish(text: string): boolean {
  const letters = text.match(/\p{L}/gu);
  if (!letters || letters.length === 0) return true; // numbers/emoji only: keep
  const ascii = letters.filter((c) => /[A-Za-z]/.test(c)).length;
  if (ascii / letters.length < 0.9) return false;
  // Several common non-English function words in a short title → likely another language
  const accented = letters.length - ascii; // é, ñ, ü...
  const hints = (text.match(FOREIGN_HINTS)?.length ?? 0) + Math.min(accented, 2);
  const words = text.split(/\s+/).length;
  return !(hints >= 2 && hints / words >= 0.25);
}
