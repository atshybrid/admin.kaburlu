/**
 * Article block assignment rules
 *
 * Block codes match the actual component file names:
 *   BLOCK-02A  → ArticleBlock2in1col   (2-inch, 1 col)
 *   BLOCK-03A  → ArticleBlock3in1col   (3-inch, 1 col)
 *   BLOCK-04A  → ArticleBlock4in2col   (4-inch, single col – Style 1)
 *   BLOCK-06A  → ArticleBlock6in2col   (6-inch, 2 col)
 *   BLOCK-08A  → ArticleBlock6in2col   (8-inch, 3 col — blockCode BLOCK-08A)
 *   BLOCK-09A  → ArticleBlock9in3col   (9-inch, 3 col)
 *   BLOCK-12A  → ArticleBlock12in4col  (12-inch, 4 col)
 */

type Article = {
  id?: number;
  title: string;
  sub_title?: string;
  subtitle?: string;
  priority?: string;
  word_count?: number;
  wordCount?: number;
  highlights?: string[];
  images?: any[];
  article?: any[];
};

/**
 * BLOCK-03A (3in Style1): ~4in max height — long copy belongs in BLOCK-04A+.
 * Band: 35–119 words (fits ~4in cap with highlights + float image risk).
 */
export const BLOCK_03A_IDEAL_WORDS_MAX = 119;
export const BLOCK_03A_IDEAL_WORDS_MIN = 35;

export function isArticleSuitedForBlock03A(article: Article): boolean {
  const w = Number(article.word_count ?? article.wordCount ?? 0);
  return w >= BLOCK_03A_IDEAL_WORDS_MIN && w <= BLOCK_03A_IDEAL_WORDS_MAX;
}

function articleWordCount(article: Article): number {
  return Number(article.word_count ?? article.wordCount ?? 0);
}

function articleCharCount(article: Article, wordCount: number): number {
  const n = Number((article as { char_count?: number; charCount?: number }).char_count
    ?? (article as { charCount?: number }).charCount);
  if (Number.isFinite(n) && n > 0) return Math.round(n);
  const body = String((article as { content?: string; body?: string }).content
    ?? (article as { body?: string }).body ?? "");
  const title = String(article.title || "");
  const combined = `${title} ${body}`.trim();
  if (combined) return combined.length;
  if (wordCount > 0) return Math.round(wordCount * 5.8);
  return 0;
}

function articleImageCount(article: Article): number {
  const media = Array.isArray(article.images) ? article.images : [];
  if (media.length > 0) return Math.min(media.length, 4);
  return 0;
}

/** Returns the block code to use for the given article. */
export function decideArticleBlock(article: Article): string {
  const w = articleWordCount(article);
  const c = articleCharCount(article, w);
  const img = articleImageCount(article);

  if (article.priority === "lead" || article.priority === "breaking") {
    return "BLOCK-12A";
  }

  if (w > 350) {
    return "BLOCK-12A";
  }

  if (w >= 220) {
    return "BLOCK-08A";
  }

  // Over BLOCK-04A band → 06A or 08A
  if (w > 199 || c > 3400) {
    if (w >= 180 || c >= 4200 || (img >= 1 && w >= 140)) return "BLOCK-08A";
    return "BLOCK-06A";
  }

  if (w >= 120) {
    return "BLOCK-04A";
  }

  return "BLOCK-04A";
}

export function shouldShowHighlights(article: Article): boolean {
  return !!(article.highlights && article.highlights.length > 0);
}

export function getImageLayout(imageCount: number): string {
  if (imageCount === 0) return "no-images";
  if (imageCount === 1) return "single-image";
  if (imageCount === 2) return "dual-images";
  return "multiple-images";
}
