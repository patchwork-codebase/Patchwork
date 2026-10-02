const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 
  'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 
  'they', 'this', 'to', 'was', 'will', 'with', 'we', 'i', 'you', 'he', 'she', 'how', 'what', 'why',
  'where', 'when', 'who', 'so', 'can', 'just', 'like', 'some', 'my', 'your', 'our', 'from', 'about',
  'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'nor', 'too', 'very',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'should', 'could', 'ought',
  'i\'m', 'you\'re', 'he\'s', 'she\'s', 'it\'s', 'we\'re', 'they\'re', 'i\'ve', 'you\'ve', 'we\'ve', 'they\'ve',
  'i\'d', 'you\'d', 'he\'d', 'she\'d', 'we\'d', 'they\'d', 'i\'ll', 'you\'ll', 'he\'ll', 'she\'ll', 'we\'ll', 'they\'ll',
  'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t', 'doesn\'t', 'don\'t', 'didn\'t',
  'won\'t', 'wouldn\'t', 'shan\'t', 'shouldn\'t', 'can\'t', 'cannot', 'couldn\'t', 'mustn\'t', 'let\'s', 'that\'s',
  'who\'s', 'what\'s', 'here\'s', 'there\'s', 'when\'s', 'where\'s', 'why\'s', 'how\'s', 'a', 'an', 'the',
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
]);

export function extractKeywords(text: string, maxKeywords: number = 3): string[] {
  if (!text) return [];

  // Convert to lowercase and remove non-alphanumeric characters (keep basic spaces/dashes)
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  
  // Split into words
  const words = cleanText.split(/\s+/).filter(word => word.length > 2);
  
  // Count frequencies of non-stop words
  const frequencies: Record<string, number> = {};
  
  for (const word of words) {
    if (!STOP_WORDS.has(word) && !/^\d+$/.test(word)) { // ignore pure numbers
      frequencies[word] = (frequencies[word] || 0) + 1;
    }
  }
  
  // Sort by frequency, then alphabetically
  const sortedWords = Object.keys(frequencies).sort((a, b) => {
    if (frequencies[b] === frequencies[a]) {
      return a.localeCompare(b);
    }
    return frequencies[b] - frequencies[a];
  });
  
  return sortedWords.slice(0, maxKeywords);
}
