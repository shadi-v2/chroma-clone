import Image from "next/image";
import Link from "next/link";
import { Clock, MessageCircle, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { findArticleById, getRelatedArticles } from "@/lib/db/articles";
import { findCommentsByArticleId } from "@/lib/db/comments";

import ArticleActions from "@/components/article/ArticleActions";
import CommentForm from "@/components/article/CommentForm";
import ReadingProgressBar from "@/components/article/ReadingProgressBar";

import type { ArticleComment, PublicArticle } from "@/types/article";
import { RenderContent } from "@/components/rich-text-editor/RenderDescription";
import AgeBadge from "@/components/AgeBadge";
import MagazineArticle from "@/components/MagazineArticle";

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  await connectDB();

  const { id } = await params;

  const article = await findArticleById(id);

  if (!article || article.deletedAt) {
    notFound();
  }

  const categoryId =
    typeof article.category === "object"
      ? article.category?.id || article.category?._id || ""
      : article.category;

  const [comments, relatedArticles] = await Promise.all([
    findCommentsByArticleId(id),
    getRelatedArticles(id, categoryId, 3),
  ]);

  const serializedArticle: PublicArticle = JSON.parse(JSON.stringify(article));

  const serializedComments: ArticleComment[] = JSON.parse(
    JSON.stringify(comments),
  );

  const serializedRelated: PublicArticle[] = JSON.parse(
    JSON.stringify(relatedArticles),
  );

  return (
    <div className="bg-cream-50 min-h-screen pb-32 px-4 sm:px-8">
      {/* Scroll Reading Progress Bar */}
      <ReadingProgressBar />

      {/* TOP BREADCRUMB & BACK LINK */}
      <div className="container mx-auto px-4 pt-6 md:pt-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-950/50 hover:text-emerald-950 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Magazine</span>
        </Link>
      </div>

      <header className="relative pt-6 pb-8 md:pt-10 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 max-w-4xl text-center space-y-5">
          <div className="flex justify-center items-center gap-3 sm:gap-4 flex-wrap">
            <span className="px-4 py-1.5 bg-emerald-950 text-cream-50 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-xs">
              {serializedArticle.category?.name}
            </span>

            {serializedArticle.author?.dateOfBirth && (
              <AgeBadge
                dateOfBirth={serializedArticle.author.dateOfBirth}
                age={serializedArticle.author.age}
                showCategoryName
              />
            )}

            <div className="flex items-center gap-1.5 text-emerald-950/50 text-[11px] font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>{serializedArticle.readTime}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight sm:leading-none text-emerald-950 tracking-tight">
            {serializedArticle.title}
          </h1>

          {serializedArticle.excerpt && (
            <p className="text-base sm:text-lg md:text-xl text-emerald-950/70 font-light italic max-w-3xl mx-auto leading-relaxed">
              &quot;{serializedArticle.excerpt}&quot;
            </p>
          )}
        </div>
      </header>

      {/* FEATURED THUMBNAIL */}
      <div className="container mx-auto px-4 relative z-20 max-w-5xl mb-12">
        <div className="mx-auto rounded-3xl sm:rounded-[2.5rem] overflow-hidden aspect-16/8 relative shadow-2xl border border-emerald-950/10">
          <Image
            src={serializedArticle.thumbnail || "/placeholder.jpg"}
            alt={serializedArticle.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-12 lg:gap-16">
            {/* CONTRIBUTOR SIDEBAR */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="space-y-6 bg-white/70 backdrop-blur-md p-6 rounded-3xl border border-emerald-950/8 shadow-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40 mb-3">
                    Contributor
                  </p>

                  <Link
                    href={`/profile/${serializedArticle.author._id || serializedArticle.author.id}`}
                    className="flex items-center gap-3.5 group hover:bg-emerald-950/5 rounded-2xl p-2 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-emerald-950/5 relative shrink-0 border border-emerald-950/10 shadow-xs">
                      {serializedArticle.author.avatar ? (
                        <Image
                          src={serializedArticle.author.avatar}
                          alt={serializedArticle.author.firstName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-emerald-950 font-serif">
                          {serializedArticle.author.firstName[0]?.toUpperCase() ||
                            "?"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-sm text-emerald-950 truncate group-hover:text-emerald-800 transition-colors">
                        {serializedArticle.author.firstName}{" "}
                        {serializedArticle.author.surname}
                      </p>

                      {serializedArticle.author?.dateOfBirth && (
                        <div className="mt-1">
                          <AgeBadge
                            dateOfBirth={serializedArticle.author.dateOfBirth}
                            age={serializedArticle.author.age}
                          />
                        </div>
                      )}

                      <p className="text-[11px] text-emerald-950/50 truncate mt-1 font-medium">
                        {serializedArticle.author.school || "Writer Collective"}
                      </p>
                    </div>
                  </Link>
                </div>

                <hr className="border-emerald-950/5" />

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40 mb-2">
                    Reading Time
                  </p>

                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950/80">
                    <Clock className="w-3.5 h-3.5 text-emerald-800" />
                    <span>{serializedArticle.readTime} estimate</span>
                  </div>
                </div>

                <hr className="border-emerald-950/5" />

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-950/40 mb-2">
                    Genre / Realm
                  </p>

                  <span className="text-xs font-semibold text-emerald-950 bg-emerald-950/5 px-2.5 py-1 rounded-full inline-block">
                    {serializedArticle.category?.name}
                  </span>
                </div>
              </div>
            </aside>

            {/* MAIN ARTICLE BODY & ACTIONS */}
            <article className="min-w-0">
              <MagazineArticle>
                <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:text-emerald-950/90 prose-headings:text-emerald-950/95 prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-blockquote:border-l-emerald-800 prose-blockquote:italic prose-blockquote:font-serif prose-blockquote:text-emerald-950/80">
                  <RenderContent json={JSON.parse(serializedArticle.content)} />
                </div>
              </MagazineArticle>

              <ArticleActions article={serializedArticle} />
            </article>
          </div>

          {/* COMMENTS SECTION */}
          <div className="mt-24 space-y-8 bg-white/60 backdrop-blur-md p-8 sm:p-12 rounded-3xl sm:rounded-[2.5rem] border border-emerald-950/8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-950/5">
              <h3 className="text-2xl font-serif font-bold text-emerald-950">
                Responses & Reflections ({serializedComments.length})
              </h3>
            </div>

            <CommentForm
              articleId={serializedArticle._id || serializedArticle.id || ""}
            />

            <div className="space-y-6 pt-4">
              {serializedComments.map((comment) => (
                <div
                  key={comment._id}
                  className="flex gap-4 sm:gap-5 p-5 bg-cream-50/70 rounded-2xl border border-emerald-950/5"
                >
                  {comment.author.avatar ? (
                    <Image
                      src={comment.author.avatar}
                      alt={comment.author.firstName}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-emerald-950/10"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-950 text-cream-50 flex items-center justify-center font-bold text-xs shrink-0">
                      {comment.author.firstName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-emerald-950 text-sm">
                        {comment.author.firstName} {comment.author.surname}
                      </h4>
                      {comment.createdAt && (
                        <span className="text-[10px] text-emerald-950/40">
                          • {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-emerald-950/80 text-sm leading-relaxed max-w-2xl">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {serializedComments.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-10 h-10 text-emerald-950/15 mx-auto mb-3" />
                  <p className="text-emerald-950/50 text-sm">
                    No reflections yet. Be the first to share your thoughts on
                    this piece.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RELATED READS */}
          {serializedRelated.length > 0 && (
            <div className="mt-24 pt-12 border-t border-emerald-950/10">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-950 mb-8">
                Continue the Literary Journey
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {serializedRelated.map((rel) => (
                  <Link
                    key={rel._id || rel.id}
                    href={`/article/${rel._id || rel.id}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-emerald-950/8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="relative aspect-16/10 overflow-hidden">
                      <Image
                        src={rel.thumbnail || "/placeholder.jpg"}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-800 mb-2">
                        {typeof rel.category === "object"
                          ? rel.category?.name
                          : rel.category}
                      </span>
                      <h4 className="font-serif font-bold text-emerald-950 text-base group-hover:text-emerald-800 transition-colors leading-snug line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
