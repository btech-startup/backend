export interface ChatSanitizeResult {
  isViolation: boolean;
  violationType?: string;
  sanitizedMessage: string;
  originalMessage: string;
}

const wordToDigitMap: Record<string, string> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

export const sanitizeChatMessage = (text: string): ChatSanitizeResult => {
  let cleaned = text;

  // Pipeline 1: Standard 10-Digit Regex Filter
  const phoneRegex = /(?:\+91|0)?[6-9]\d{9}/g;
  if (phoneRegex.test(cleaned)) {
    return {
      isViolation: true,
      violationType: 'PHONE_NUMBER_DETECTED',
      originalMessage: text,
      sanitizedMessage: cleaned.replace(phoneRegex, '[PHONE BLOCKED]'),
    };
  }

  // Pipeline 2: Word-Spelled Digits Normalization & Check
  const words = cleaned.toLowerCase().split(/\s+/);
  let spelledCount = 0;
  let normalizedWords = words.map((w) => {
    if (wordToDigitMap[w]) {
      spelledCount++;
      return wordToDigitMap[w];
    }
    return w;
  });

  if (spelledCount >= 7) {
    return {
      isViolation: true,
      violationType: 'SPELLED_DIGITS_DETECTED',
      originalMessage: text,
      sanitizedMessage: '[SPELLED NUMBER BLOCKED]',
    };
  }

  // Pipeline 3: Financial Handles (UPI Suffixes)
  const upiRegex = /@[a-zA-Z0-9_-]{2,}/g;
  if (upiRegex.test(cleaned)) {
    return {
      isViolation: true,
      violationType: 'UPI_HANDLE_DETECTED',
      originalMessage: text,
      sanitizedMessage: cleaned.replace(upiRegex, '[UPI BLOCKED]'),
    };
  }

  // Pipeline 4: External Links & URLs
  const urlRegex = /(https?:\/\/[^\s]+|wa\.me|[a-zA-Z0-9-]+\.(?:com|in|net|org|me|ly))/gi;
  if (urlRegex.test(cleaned)) {
    return {
      isViolation: true,
      violationType: 'EXTERNAL_URL_DETECTED',
      originalMessage: text,
      sanitizedMessage: cleaned.replace(urlRegex, '[LINK BLOCKED]'),
    };
  }

  return {
    isViolation: false,
    originalMessage: text,
    sanitizedMessage: text,
  };
};
