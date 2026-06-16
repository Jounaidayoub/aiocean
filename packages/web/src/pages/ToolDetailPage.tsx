import { useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState } from "react"
import type { Tool } from "@/shared/schema"
import { getTool, recordClick } from "@/shared/api/tools"
import { toggleVote } from "@/shared/api/votes"
import { getReviews, type Review } from "@/shared/api/reviews"
import { ChevronUp, ChevronDown, Star, Bookmark, Loader2, ExternalLink, Flag } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { SaveToCollectionDialog } from "@/components/SaveToCollectionDialog"
import { ReviewDialog } from "@/components/ReviewDialog"
import { ToolLogo } from "@/components/ToolLogo"
import { ReportToolDialog } from "@/components/ReportToolDialog"

import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInTrigger,
  OpenInGoogle,
} from "@/components/ai-elements/open-in-chat";

export function ToolDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tool, setTool] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [voteCount, setVoteCount] = useState(0)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [voting, setVoting] = useState(false)
  const [usageCount, setUsageCount] = useState(0)

  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const t = await getTool(id!)
        if (!cancelled) {
          setTool(t)
          setVoteCount(t.voteCount)
          setUsageCount(t.usageCount)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tool")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!tool?.id) return
    const toolId = tool.id
    let cancelled = false

    async function load() {
      setLoadingReviews(true)
      try {
        const r = await getReviews(toolId)
        if (!cancelled) setReviews(r)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingReviews(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [tool?.id])

  const handleVisitWebsite = () => {
    if (!tool?.url) return
    window.open(tool.url, "_blank", "noopener noreferrer")
    if (!user) return
    recordClick(tool.id)
      .then((result) => setUsageCount(result.count))
      .catch(() => { })
  }

  const handleUpvote = async () => {
    if (!user) {
      navigate("/login")
      return
    }
    if (!tool?.id || voting) return
    setVoting(true)
    try {
      const result = await toggleVote(tool.id)
      setHasUpvoted(result.voted)
      setVoteCount(result.count)
    } catch {
      // ignore
    } finally {
      setVoting(false)
    }
  }

  const handleReviewSuccess = async () => {
    if (!tool?.id) return
    try {
      const [r, t] = await Promise.all([getReviews(tool.id), getTool(tool.id)])
      setReviews(r)
      setTool(t)
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h2 className="text-xl font-semibold text-destructive">Tool not found</h2>
        <p className="mt-2 text-muted-foreground">{error || "The tool you're looking for doesn't exist."}</p>
        <Button className="mt-6" onClick={() => navigate("/home")}>Browse tools</Button>
      </div>
    )
  }

  const formatCount = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString()
  }

  const queryParts = [
    `I want to learn about "${tool.name}"`,
    tool.tagline ? ` — ${tool.tagline}.` : '.',
    '\n\nHere is what I know so far:',
    `\n- Name: ${tool.name}`,
    tool.url ? `\n- Website: ${tool.url}` : '',
    tool.category ? `\n- Category: ${tool.category}` : '',
    tool.pricing ? `\n- Pricing: ${tool.pricing}` : '',
    tool.platform ? `\n- Platform: ${tool.platform}` : '',
    tool.primaryUseCase ? `\n- Best for: ${tool.primaryUseCase}` : '',
    tool.rating > 0 ? `\n- Community rating: ${tool.rating.toFixed(1)}/5 (${tool.reviewCount} reviews)` : '',
    tool.description ? `\n\nDescription from the listing:\n${tool.description}` : '',
    tool.url ? `\n\nPlease also visit their website at ${tool.url} for the latest information.` : '',
    '\n\nBased on this, give me a comprehensive overview: key features, pros/cons, pricing details, and who this tool is best suited for. Compare it to popular alternatives if possible.',
  ]
  const sampleQuery = queryParts.join('')

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-6">
          <ToolLogo name={tool.name} logo={tool.logo} url={tool.url} className="size-24 rounded-2xl text-5xl" imgClassName="p-2" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{tool.name}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{tool.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{tool.category}</Badge>
              <Badge variant="outline">{tool.pricing}</Badge>
              <Badge variant="outline">{tool.platform}</Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3">
          {tool.url && (
            <Button
              size="lg"
              className="w-full md:w-auto flex gap-2 justify-center items-center font-semibold"
              onClick={() => void handleVisitWebsite()}
            >
              <ExternalLink className="h-5 w-5" />
              <span>Visit Website</span>
            </Button>
          )}
          <Button
            size="lg"
            variant={hasUpvoted ? "default" : "secondary"}
            className="w-full md:w-auto flex gap-2 justify-center items-center font-semibold"
            onClick={() => void handleUpvote()}
            disabled={voting}
          >
            <ChevronUp className={`h-5 w-5 ${hasUpvoted ? "animate-bounce" : ""}`} />
            <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            <span className="opacity-70">({voteCount})</span>
          </Button>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="flex-1 flex gap-2 justify-center items-center font-semibold"
              onClick={() => {
                if (!user) { navigate("/login"); return }
                setSaveDialogOpen(true)
              }}
            >
              <Bookmark className="h-5 w-5" />
              <span>Save</span>
            </Button>
            <div className="flex-1 min-w-0">
              <OpenIn query={sampleQuery}>
                <OpenInTrigger
                  render={
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="w-full flex gap-2 justify-center items-center font-semibold"
                    />
                  }
                >
                  <span>Ask AI</span>
                  <ChevronDown className="h-5 w-5 opacity-70" />
                </OpenInTrigger>
                <OpenInContent>
                  <OpenInChatGPT  />
                  <OpenInClaude />
                  <OpenInGoogle />
                </OpenInContent>
              </OpenIn>
            </div>
          </div>
          <Button
            size="lg"
            variant="destructive"
            className="w-full md:w-auto flex gap-2 justify-center items-center font-semibold"
            onClick={() => {
              if (!user) { navigate("/login"); return }
              setReportDialogOpen(true)
            }}
          >
            <Flag className="h-5 w-5" />
            <span>Report Tool</span>
          </Button>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Details & Community */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <div className="text-muted-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="mb-3 mt-6 text-lg font-bold text-foreground">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 mt-5 text-base font-semibold text-foreground">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-sm font-semibold text-foreground">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1.5 pl-5">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ children, href }) => (
                    <a className="font-medium text-primary underline underline-offset-2 hover:text-primary/80" href={href} rel="noreferrer" target="_blank">
                      {children}
                    </a>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{children}</code>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-3 border-l-4 border-primary/30 pl-4 italic text-muted-foreground/80">{children}</blockquote>
                  ),
                  hr: () => <hr className="my-4 border-border" />,
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-muted/60 border-b border-border">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                  tr: ({ children }) => <tr className="transition-colors hover:bg-muted/30">{children}</tr>,
                  th: ({ children }) => <th className="px-4 py-2.5 text-left font-semibold text-foreground">{children}</th>,
                  td: ({ children }) => <td className="px-4 py-2.5 text-foreground/80">{children}</td>,
                }}
              >
                {tool.description || tool.tagline || "No description available."}
              </ReactMarkdown>
            </div>
          </section>

          <Separator />

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Reviews & Comments</h2>
              <Button variant="outline" size="sm" onClick={() => {
                if (!user) { navigate("/login"); return }
                setReviewDialogOpen(true)
              }}>
                Write a Review
              </Button>
            </div>

            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No reviews yet. Be the first to review this tool!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                            {review.author.name
                              ? review.author.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                              : "?"}
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">{review.author.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(review.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "text-muted-foreground/30"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/90">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Meta info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Community rating</span>
                <span className="font-semibold flex items-center gap-1.5">
                  {tool.rating.toFixed(1)} <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                </span>
              </div>
              {tool.externalRating != null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Official rating{tool.externalRatingSource ? ` · ${tool.externalRatingSource}` : ""}
                  </span>
                  <span className="font-semibold flex items-center gap-1.5">
                    {tool.externalRating.toFixed(1)} <Star className="h-4 w-4 fill-sky-400 text-sky-500" />
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reviews</span>
                <span className="font-semibold">{tool.reviewCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Upvotes</span>
                <span className="font-semibold">{voteCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Users</span>
                <span className="font-semibold">{formatCount(usageCount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pricing</span>
                <span className="font-semibold">{tool.pricing}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SaveToCollectionDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        toolId={tool.id}
        toolName={tool.name}
      />

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        toolId={tool.id}
        toolName={tool.name}
        onSuccess={() => void handleReviewSuccess()}
      />

      <ReportToolDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        toolId={tool.id}
        toolName={tool.name}
      />
    </div>
  )
}
