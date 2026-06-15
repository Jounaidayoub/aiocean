import { useState } from "react"
import { Globe } from "lucide-react"

/** Build an ordered list of logo URLs to try, best first. */
function getLogoSources(logo?: string | null, url?: string | null): string[] {
  const sources: string[] = []
  if (logo) sources.push(logo)
  if (url) {
    try {
      const host = new URL(url).hostname
      sources.push(`https://logo.clearbit.com/${host}`)
      sources.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`)
    } catch {
      // invalid URL — skip derived sources
    }
  }
  return sources
}

interface ToolLogoProps {
  name: string
  logo?: string | null
  url?: string | null
  /** Container size/shape classes, e.g. "size-12 text-2xl rounded-lg". */
  className?: string
  /** Inner image classes, e.g. "p-1.5". */
  imgClassName?: string
  /** If true, render the image or icon directly without the border/bg container. */
  raw?: boolean
}

/**
 * Shows a tool's logo with graceful fallback:
 * explicit logo_url -> Clearbit logo -> Google favicon -> Globe placeholder icon.
 */
export function ToolLogo({ name, logo, url, className, imgClassName, raw = false }: ToolLogoProps) {
  const sources = getLogoSources(logo, url)
  const [idx, setIdx] = useState(0)
  const src = sources[idx]
  const hasImage = idx < sources.length

  if (raw) {
    if (!hasImage) {
      return <Globe className={className ?? "size-4 text-muted-foreground/60"} />
    }
    return (
      <img
        src={src}
        alt={name}
        className={className ?? "size-4 object-contain"}
        onError={() => setIdx((i) => i + 1)}
      />
    )
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-muted font-medium shadow-sm ${
        className ?? "size-12 rounded-lg text-2xl"
      }`}
    >
      {!hasImage && <Globe className="size-1/2 text-muted-foreground/60" />}
      {src && (
        <img
          src={src}
          alt={name}
          className={`absolute inset-0 size-full bg-muted object-contain ${imgClassName ?? "p-1.5"}`}
          onError={() => setIdx((i) => i + 1)}
        />
      )}
    </div>
  )
}
