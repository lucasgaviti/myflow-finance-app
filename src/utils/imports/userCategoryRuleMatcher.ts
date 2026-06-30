import type {
  CategoryRule,
} from '../../types/categoryRule';

import type {
  CategorySuggestion,
} from './categoryMatcher';

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasStrongMatch({
  description,
  keyword,
}: {
  description: string;
  keyword: string;
}) {
  if (!keyword) {
    return false;
  }

  if (description === keyword) {
    return true;
  }

  if (description.includes(keyword)) {
    return true;
  }

  const keywordWords =
    keyword.split(' ').filter(Boolean);

  if (keywordWords.length >= 2) {
    return keywordWords.every((word) =>
      description.includes(word),
    );
  }

  return false;
}

export function suggestCategoryFromUserRules({
  description,
  rules,
}: {
  description: string;

  rules: CategoryRule[];
}): CategorySuggestion | null {
  const normalizedDescription =
    normalizeText(description);

  const sortedRules =
    [...rules].sort(
      (a, b) =>
        normalizeText(b.keyword).length -
        normalizeText(a.keyword).length,
    );

  for (const rule of sortedRules) {
    const normalizedKeyword =
      normalizeText(rule.keyword);

    if (
      hasStrongMatch({
        description:
          normalizedDescription,

        keyword:
          normalizedKeyword,
      })
    ) {
      return {
        category:
          rule.category,

        confidence:
          'high',

        matchedKeyword:
          rule.keyword,
      };
    }
  }

  return null;
}