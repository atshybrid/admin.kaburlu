type Article = {
  id?: number;
  title: string;
  sub_title?: string;
  priority?: string;
  word_count?: number;
  highlights?: string[];
  images?: any[];
  article?: any[];
};

export function decideArticleBlock(article: Article): string {
  // Lead/breaking news gets special treatment
  if (article.priority === "lead" || article.priority === "breaking") {
    return "LeadArticleBlock";
  }

  // Long-form articles get 3-column layout
  if (article.word_count && article.word_count > 350) {
    return "ClassicThreeColumnArticleBlock";
  }

  // Short briefs
  if (article.word_count && article.word_count < 120) {
    return "BriefArticleBlock";
  }

  // Default to classic 3-column
  return "ClassicThreeColumnArticleBlock";
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
