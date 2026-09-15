export function extractFirstName(fullName?: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const first = trimmed.split(/\s+/)[0] || '';
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function interpolateFirstName(text: string, fullNameOrFirstName?: string): string {
  if (!text) return '';
  const firstName = extractFirstName(fullNameOrFirstName);
  if (!firstName) {
    return text
      .replace(/^\{name\},\s*([a-z])/gm, (_, char) => char.toUpperCase())
      .replace(/\{name\},\s*/g, '')
      .replace(/,\s*\{name\}/g, '')
      .replace(/\{name\}/g, 'friend');
  }
  return text.replace(/\{name\}/g, firstName);
}
