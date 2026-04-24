import { useState, useMemo } from "react"
import { Header } from "./components/Header"
import { ToolGrid } from "./components/ToolGrid"
import type { Tool } from "./components/ToolCard"
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { Search, ChevronDown, X } from "lucide-react"
import TextRotate from "./components/fancy/text/text-rotate"
import { LayoutGroup, motion } from "motion/react"

const MOCK_TOOLS: Tool[] = [
  { id: "1", name: "WritePro", logo: "✍️", tagline: "AI powered writing assistant", category: "Writing", pricing: "Freemium", platform: "Web", usageCount: 15400, rating: 4.8, primaryUseCase: "Writing emails" },
  { id: "2", name: "GenImg", logo: "🎨", tagline: "Generate images from text", category: "Image Generation", pricing: "Paid", platform: "API", usageCount: 4200, rating: 4.5, primaryUseCase: "Blog assets" },
  { id: "3", name: "CodeBuddy", logo: "💻", tagline: "Your AI pair programmer", category: "Coding", pricing: "Free", platform: "Browser Extension", usageCount: 89000, rating: 4.9, primaryUseCase: "Refactoring" },
  { id: "4", name: "MeetingBot", logo: "🎙️", tagline: "Transcribe and summarize meetings", category: "Audio", pricing: "Freemium", platform: "Web", usageCount: 12000, rating: 4.2, primaryUseCase: "Meeting notes" },
  { id: "5", name: "DataSense", logo: "📊", tagline: "Analyze datasets with NLP", category: "Research", pricing: "Paid", platform: "Web", usageCount: 3100, rating: 4.7, primaryUseCase: "Data analysis" },
  { id: "6", name: "TaskMaster", logo: "✅", tagline: "AI agents for your daily tasks", category: "Productivity", pricing: "Free", platform: "Mobile", usageCount: 22000, rating: 4.6, primaryUseCase: "Task automation" },
  { id: "7", name: "SEO AI", logo: "🚀", tagline: "Optimize content for search engines", category: "Writing", pricing: "Freemium", platform: "Web", usageCount: 8500, rating: 4.3, primaryUseCase: "SEO optimization" },
  { id: "8", name: "SnippetGen", logo: "🧩", tagline: "Generate code snippets instantly", category: "Coding", pricing: "Free", platform: "Browser Extension", usageCount: 45000, rating: 4.8, primaryUseCase: "Boilerplate code" },
]

const CATEGORIES = ["Writing", "Image Generation", "Productivity", "Coding", "Research", "Audio"]

export function App() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  const filteredTools = useMemo(() => {
    return MOCK_TOOLS.filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory ? tool.category === activeCategory : true
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  const displayedCategories = filtersExpanded ? CATEGORIES : CATEGORIES.slice(0, 3)

  return (
    <div className="min-h-screen  flex flex-col font-sans text-foreground">

      <Header />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="relative z-10 flex w-full flex-col max-w-6xl items-center px-2 py-12 text-center md:py-24">
          <LayoutGroup>
            <Badge variant={"outline"} className="border-primary  text-foreground">
              Explore 1,000+ top AI apps 
            </Badge>
          
            <motion.h1 layout className="mb-6 flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-4xl font-extrabold leading-tight tracking-tight md:text-7xl">
              <motion.span layout transition={{ type: "spring", damping: 30, stiffness: 400 }}>
                Supercharge your workflow 
              </motion.span>
              <motion.span layout className="whitespace-nowrap">
                with
              </motion.span>
              <TextRotate
                texts={["AI tools", "Coding agents", "Smart assistants", "Creative tools", "Productivity apps"]}
                as="span"
                mainClassName="[box-shadow:inset_0_3.4px_1px_rgba(255,255,255,0.5)] border-primary inline-flex justify-center rounded-lg bg-primary px-2 py-0.5 font-serif text-white sm:px-2 sm:py-1 md:px-3 md:py-1"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={4000}
              />
            </motion.h1>
          </LayoutGroup>

          <p className="mb-12  max-w-3xl text-xl font-light leading-relaxed text-muted-foreground md:text-2xl">
            Find the perfect applications curated by the community to boost your productivity, creativity, and workflow.
          </p>

          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary " />
            <Input
              type="text"
              placeholder="Search tools, workflows, or use cases..."
              className="h-14 w-full rounded-2xl border-muted-foreground/20 pl-12 pr-4 text-lg shadow-sm focus-visible:ring-primary/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Filters and Grid */}
        <section className="w-full max-w-6xl px-4 pb-20">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium mr-2 text-muted-foreground">Category</span>
              {displayedCategories.map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className="rounded-full"
                >
                  {cat}
                  {activeCategory === cat && <X className="ml-1 size-3" />}
                </Button>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                {filtersExpanded ? "Less" : "+ More"}
                <ChevronDown className={`ml-1 size-3 transition-transform ${filtersExpanded ? "rotate-180" : ""}`} />
              </Button>
            </div>

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found <Badge variant="secondary" className="px-1.5">{filteredTools.length}</Badge> tools
            </div>
          </div>

          <ToolGrid tools={filteredTools} />
        </section>
      </main>
    </div>
  )
}

export default App
