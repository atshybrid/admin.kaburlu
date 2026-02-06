import { useEffect, useRef } from "react";
import Image from "next/image";

type ArticleImage = {
  url: string;
  caption?: string;
};

type ArticlePart = {
  type: "para" | "subhead";
  text: string;
};

type Props = {
  data: {
    title: string;
    sub_title?: string;
    highlights?: string[];
    dateline?: string;
    images?: ArticleImage[];
    article: ArticlePart[];
  };
};

export default function ClassicThreeColumnArticleBlock({ data }: Props) {
  const { title, sub_title, highlights, dateline, images = [], article } = data;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const adjustTitleSize = () => {
      const titleEl = titleRef.current;
      if (!titleEl) return;

      const maxWidth = 7 * 96; // 7 inches = 672px (96 DPI)
      const minSize = 25;
      const maxSize = 38;
      let currentSize = maxSize;

      titleEl.style.fontSize = `${currentSize}px`;
      titleEl.style.whiteSpace = "nowrap";

      // Reduce font size until it fits in one line
      while (titleEl.scrollWidth > maxWidth && currentSize > minSize) {
        currentSize -= 0.5;
        titleEl.style.fontSize = `${currentSize}px`;
      }

      // If still too long at minSize, allow wrapping
      if (titleEl.scrollWidth > maxWidth) {
        titleEl.style.whiteSpace = "normal";
      }
    };

    const adjustSubtitleSize = () => {
      const subtitleEl = subtitleRef.current;
      if (!subtitleEl) return;

      const maxWidth = 7 * 96; // 7 inches = 672px (96 DPI)
      const minSize = 14;
      const maxSize = 20;
      let currentSize = maxSize;

      subtitleEl.style.fontSize = `${currentSize}px`;
      subtitleEl.style.whiteSpace = "nowrap";

      // Reduce font size until it fits in one line
      while (subtitleEl.scrollWidth > maxWidth && currentSize > minSize) {
        currentSize -= 0.5;
        subtitleEl.style.fontSize = `${currentSize}px`;
      }

      // If still too long at minSize, allow wrapping
      if (subtitleEl.scrollWidth > maxWidth) {
        subtitleEl.style.whiteSpace = "normal";
      }
    };

    adjustTitleSize();
    adjustSubtitleSize();

    const handleResize = () => {
      adjustTitleSize();
      adjustSubtitleSize();
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [title, sub_title]);

  return (
    <div className="epaper-block">
      {/* TITLE */}
      <h1 className="epaper-title" ref={titleRef}>{title}</h1>

      {/* SUB TITLE */}
      {sub_title && <h2 className="epaper-subtitle" ref={subtitleRef}>{sub_title}</h2>}

      {/* ONE MULTI-COLUMN ARTICLE CONTAINER */}
      <div className="article-columns">
        
        {/* Highlight box - will anchor at top of column 1 */}
        {highlights && highlights.length > 0 && (
          <div className="highlight-box">
            <ul>
              {highlights.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Article text + anchored images (inline in the flow) */}
        <div className="article-text">
          {dateline && <span className="dateline-inline">{dateline} </span>}

          {(() => {
            let seenParas = 0;
            const out: React.ReactNode[] = [];

            for (let i = 0; i < article.length; i += 1) {
              const part = article[i];

              if (part.type === "subhead") {
                out.push(<h3 key={`subhead-${i}`}>{part.text}</h3>);
              } else {
                out.push(<p key={`para-${i}`}>{part.text}</p>);
                seenParas += 1;
              }

              if (seenParas === 1 && images[0]) {
                out.push(
                  <figure key="image-1" className="article-image article-image--break">
                    <Image
                      src={images[0].url}
                      alt={images[0].caption || "Article image"}
                      width={400}
                      height={225}
                      className="article-image-img"
                    />
                    {images[0].caption && (
                      <figcaption className="caption">{images[0].caption}</figcaption>
                    )}
                  </figure>
                );
              }

              if (seenParas === 2 && images[1]) {
                out.push(
                  <figure key="image-2" className="article-image article-image--break">
                    <Image
                      src={images[1].url}
                      alt={images[1].caption || "Article image"}
                      width={400}
                      height={225}
                      className="article-image-img"
                    />
                    {images[1].caption && (
                      <figcaption className="caption">{images[1].caption}</figcaption>
                    )}
                  </figure>
                );
              }
            }

            return out;
          })()}
        </div>

      </div>
    </div>
  );
}
