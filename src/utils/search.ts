export function generateSearchTerms(displayName: string, username: string): string[] {
  const terms = new Set<string>();
  const name = displayName.toLowerCase();
  const user = username.toLowerCase();

  // Prefikser av fullt navn
  for (let i = 2; i <= name.length && i <= 20; i++) {
    terms.add(name.substring(0, i));
  }

  // Prefikser av brukernavn
  for (let i = 2; i <= user.length && i <= 20; i++) {
    terms.add(user.substring(0, i));
  }

  // Prefikser av hvert ord i navnet
  name.split(/\s+/).forEach(word => {
    for (let i = 2; i <= word.length && i <= 15; i++) {
      terms.add(word.substring(0, i));
    }
  });

  return [...terms].slice(0, 50);
}
