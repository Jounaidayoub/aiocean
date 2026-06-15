import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  Search,
  Loader2,
  CheckCircle,
  FileText,
  ArrowRight,
  Users,
  Settings,
  Flag,
  Plus,
  Edit,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getAdminSettings, updateAdminSettings } from "@/shared/api/settings"
import { getAdminSubmissions, type Submission } from "@/shared/api/submissions"
import { getAdminUsers, updateAdminUser, deleteAdminUser } from "@/shared/api/users"
import { getAdminTools, createAdminTool, updateAdminTool, deleteAdminTool, getAdminModels, getCategories, type Tool, type Category } from "@/shared/api/tools"
import { getAdminReports, dismissAdminReport, type AdminReport } from "@/shared/api/reports"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

const getModelProviderName = (modelId: string | undefined, provider: string | undefined) => {
  if (!modelId) return provider || "openrouter"
  const cleanProvider = (provider || "openrouter").toLowerCase()
  if (cleanProvider === "google") return "google"
  if (cleanProvider === "openai") return "openai"
  // If openrouter, modelId is like "google/gemini-2.5" or "openai/gpt-4o"
  if (modelId.includes("/")) {
    const creator = modelId.split("/")[0].toLowerCase()
    // clean up creator name, e.g. "meta-llama" -> "meta"
    if (creator.includes("meta")) return "meta"
    if (creator.includes("anthropic")) return "anthropic"
    if (creator.includes("mistral")) return "mistral"
    if (creator.includes("cohere")) return "cohere"
    if (creator.includes("nvidia")) return "nvidia"
    if (creator.includes("microsoft")) return "microsoft"
    return creator
  }
  return cleanProvider
}

export function AdminPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("overview")

  // Statistics
  const [users, setUsers] = useState<any[]>([])
  const [tools, setTools] = useState<Tool[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [models, setModels] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [isLoading, setIsLoading] = useState(true)

  // Submissions search/filter
  const [submissionSearch, setSubmissionSearch] = useState("")
  const [submissionFilter, setSubmissionFilter] = useState("all")

  // Users search
  const [userSearch, setUserSearch] = useState("")

  // Tools search/filter
  const [toolSearch, setToolSearch] = useState("")
  const [toolCategoryFilter, setToolCategoryFilter] = useState("all")

  // Modals & Dialogs States
  const [toolModalOpen, setToolModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [deletingToolId, setDeletingToolId] = useState<string | null>(null)
  
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Tool Form State
  const [toolForm, setToolForm] = useState({
    name: "",
    url: "",
    short_description: "",
    description: "",
    pricing_model: "Free",
    status: "inactive",
    category_id: "",
    logo_url: "",
  })

  // User Form State
  const [userForm, setUserForm] = useState({
    role: "user",
  })

  // Settings State
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)

  // Load all admin data
  const loadAdminData = async () => {
    setIsLoading(true)
    try {
      const [
        usersData,
        toolsData,
        subsData,
        reportsData,
        settingsData,
        modelsData,
        catsData,
      ] = await Promise.all([
        getAdminUsers(),
        getAdminTools().then((res) => res.tools),
        getAdminSubmissions(),
        getAdminReports(),
        getAdminSettings(),
        getAdminModels().catch(() => []),
        getCategories().catch(() => []),
      ])

      setUsers(usersData)
      setTools(toolsData)
      setSubmissions(subsData)
      setReports(reportsData)
      setSettings(settingsData)
      setModels(modelsData)
      setCategories(catsData)
    } catch (err) {
      console.error("Failed to load admin data:", err)
      toast.error("Failed to load some dashboard sections. Check permissions.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  // Filter Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesFilter = submissionFilter === "all" || sub.status === submissionFilter
      const matchesSearch =
        sub.tool_name.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        (sub.submitter_name || "").toLowerCase().includes(submissionSearch.toLowerCase()) ||
        (sub.submitter_email || "").toLowerCase().includes(submissionSearch.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [submissions, submissionFilter, submissionSearch])

  // Filter Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return (
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      )
    })
  }, [users, userSearch])

  // Filter Tools
  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const categoryMatch =
        toolCategoryFilter === "all" ||
        t.category.toLowerCase() === toolCategoryFilter.toLowerCase()
      const searchMatch =
        t.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
        t.tagline.toLowerCase().includes(toolSearch.toLowerCase())
      return categoryMatch && searchMatch
    })
  }, [tools, toolCategoryFilter, toolSearch])

  // Stats Counters
  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      totalTools: tools.length,
      activeTools: tools.filter((t) => t.status === "active").length,
      pendingReviews: submissions.filter((s) => s.status === "pending").length,
      activeReports: reports.length,
    }
  }, [users, tools, submissions, reports])

  // Tool Form submit handler (Add/Edit)
  const handleToolSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toolForm.name) {
      toast.error("Tool name is required")
      return
    }

    try {
      if (editingTool) {
        await updateAdminTool(editingTool.id, toolForm)
        toast.success("Tool updated successfully")
      } else {
        await createAdminTool(toolForm)
        toast.success("Tool created successfully")
      }
      setToolModalOpen(false)
      setEditingTool(null)
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save tool")
    }
  }

  // Open Edit Tool Form
  const openEditTool = (tool: Tool) => {
    setEditingTool(tool)
    const matchingCat = categories.find((c) => c.name.toLowerCase() === tool.category.toLowerCase())
    setToolForm({
      name: tool.name,
      url: tool.url || "",
      short_description: tool.tagline || "",
      description: tool.description || "",
      pricing_model: tool.pricing || "Free",
      status: tool.status || "inactive",
      category_id: matchingCat ? matchingCat.id : "",
      logo_url: tool.logo || "",
    })
    setToolModalOpen(true)
  }

  // Open Add Tool Form
  const openAddTool = () => {
    setEditingTool(null)
    setToolForm({
      name: "",
      url: "",
      short_description: "",
      description: "",
      pricing_model: "Free",
      status: "inactive",
      category_id: categories[0]?.id || "",
      logo_url: "",
    })
    setToolModalOpen(true)
  }

  // Handle delete tool confirm
  const handleConfirmDeleteTool = async () => {
    if (!deletingToolId) return
    try {
      await deleteAdminTool(deletingToolId)
      toast.success("Tool deleted from database")
      setDeletingToolId(null)
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete tool")
    }
  }

  // Handle Quick Toggle Tool Status
  const handleToggleToolStatus = async (tool: Tool) => {
    const nextStatus = tool.status === "active" ? "inactive" : "active"
    try {
      await updateAdminTool(tool.id, { status: nextStatus })
      toast.success(`Tool ${tool.name} status changed to ${nextStatus}`)
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status")
    }
  }

  // Open Edit User modal
  const openEditUser = (u: any) => {
    setEditingUser(u)
    setUserForm({ role: u.role || "user" })
    setUserModalOpen(true)
  }

  // Handle User Edit Submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    try {
      await updateAdminUser(editingUser.id, userForm)
      toast.success("User role updated successfully")
      setUserModalOpen(false)
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update user")
    }
  }

  // Handle delete user confirm
  const handleConfirmDeleteUser = async () => {
    if (!deletingUserId) return
    if (deletingUserId === currentUser?.id) {
      toast.error("You cannot delete your own admin account")
      return
    }
    try {
      await deleteAdminUser(deletingUserId)
      toast.success("User removed successfully")
      setDeletingUserId(null)
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user")
    }
  }

  // Handle dismiss report
  const handleDismissReport = async (reportId: string) => {
    try {
      await dismissAdminReport(reportId)
      toast.success("Flag dismissed")
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to dismiss report")
    }
  }

  // Handle deactivate flagged tool
  const handleDeactivateFlaggedTool = async (toolId: string, reportId: string) => {
    try {
      await updateAdminTool(toolId, { status: "inactive" })
      await dismissAdminReport(reportId)
      toast.success("Tool deactivated and flag dismissed")
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate tool")
    }
  }

  // Settings Save Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingSettings(true)
    try {
      await updateAdminSettings(settings)
      toast.success("System configurations saved successfully")
      loadAdminData()
    } catch (err: any) {
      toast.error(err.message || "Failed to save configurations")
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  // Helper: Filter models based on selected settings provider
  const filteredModelsForProvider = useMemo(() => {
    const selectedProvider = settings.agent_provider || "openrouter"
    if (selectedProvider === "openrouter") {
      return models
    }
    // Filter models belonging to google or openai
    return models.filter((m) => {
      const creator = (m.creator_id || "").toLowerCase()
      if (selectedProvider === "google") return creator.includes("google")
      if (selectedProvider === "openai") return creator.includes("openai")
      return false
    })
  }, [models, settings.agent_provider])

  if (isLoading && users.length === 0) {
    return (
      <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm font-medium">Gathering administrative dashboard data...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Administration Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global controls for tools directory, users management, flagging moderation, and reviewer agent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadAdminData()}>
            Refresh Data
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sliders className="size-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <FileText className="size-4" /> Submissions
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Sparkles className="size-4" /> Tool Registry
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="size-4" /> User Base
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 col-span-2 md:col-span-1">
            <Settings className="size-4" /> Agent Settings
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard title="Total Registered Users" value={stats.totalUsers} subtitle="All time" icon={<Users className="size-5 text-muted-foreground" />} />
            <StatCard title="Tool Registry Size" value={stats.totalTools} subtitle="Total listings" icon={<Sparkles className="size-5 text-muted-foreground" />} />
            <StatCard title="Active Publications" value={stats.activeTools} subtitle={`${((stats.activeTools/stats.totalTools)||0*100).toFixed(0)}% of total`} icon={<CheckCircle className="size-5 text-muted-foreground" />} />
            <StatCard title="Pending Submissions" value={stats.pendingReviews} subtitle="Awaiting audit" icon={<FileText className="size-5 text-muted-foreground" />} />
            <StatCard title="Flagged Reports" value={stats.activeReports} subtitle="Requires moderation" icon={<Flag className="size-5 text-muted-foreground" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border border-border/75">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Flag className="size-4 text-muted-foreground" /> Flagged & Reported Tools Queue
                </CardTitle>
                <CardDescription>
                  List of tools reported by users as spam, duplicate, or broken.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg">
                    <CheckCircle className="size-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">Clean Moderation Queue</p>
                    <p className="text-xs text-muted-foreground mt-1">No tools are flagged for review at this time.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/80">
                          <th className="py-2.5 px-3 rounded-l-md">Flagged Tool</th>
                          <th className="py-2.5 px-3">Reporter</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Details / Notes</th>
                          <th className="py-2.5 px-3 text-right rounded-r-md">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {reports.map((report) => (
                          <tr key={report.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-2 px-3 font-semibold text-foreground">
                              {report.tool_name || "Unknown Tool"}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">{report.user_name}</span>
                                <span className="text-xs">{report.user_email}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline" className="capitalize">
                                {report.reason.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-xs max-w-xs truncate">
                              {report.note || <span className="italic">No details provided</span>}
                            </td>
                            <td className="py-2 px-3 text-right flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeactivateFlaggedTool(report.tool_id, report.id)}
                              >
                                Deactivate Tool
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs font-semibold"
                                onClick={() => handleDismissReport(report.id)}
                              >
                                Dismiss
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border/75">
              <CardHeader>
                <CardTitle className="text-base font-semibold">System Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">AI Automation</span>
                  <Badge variant={settings.agent_auto_request_changes === "true" ? "default" : "secondary"}>
                    {settings.agent_auto_request_changes === "true" ? "Fully Automated" : "Manual review"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Reviewer Provider</span>
                  <span className="text-sm font-semibold capitalize">{settings.agent_provider || "openrouter"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Reviewer Model</span>
                  <span className="text-sm font-mono text-xs max-w-[150px] truncate">{settings.agent_model || "nemotron-3-super"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Pending Audits</span>
                  <span className="text-sm font-semibold text-amber-500">{stats.pendingReviews} submission(s)</span>
                </div>
                <Separator />
                <Button className="w-full flex gap-1.5" variant="secondary" onClick={() => setActiveTab("settings")}>
                  Configure Agent Reviewer <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: SUBMISSIONS */}
        <TabsContent value="submissions" className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Submissions Dashboard</h2>
              <p className="text-xs text-muted-foreground">Review tools submitted by users.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Select value={submissionFilter} onValueChange={(val) => setSubmissionFilter(val || "all")}>
                <SelectTrigger className="h-9 w-[130px] text-xs">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="changes_requested">Changes</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="shadow-sm border border-border/75">
            <CardContent className="p-6">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No submissions found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting search filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/80">
                        <th className="py-2.5 px-3 rounded-l-md">Tool Name</th>
                        <th className="py-2.5 px-3">Submitter</th>
                        <th className="py-2.5 px-3">Audit Status</th>
                        <th className="py-2.5 px-3">Submitted Date</th>
                        <th className="py-2.5 px-3">Registry Action</th>
                        <th className="py-2.5 px-3 text-right rounded-r-md">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-muted/50 transition-colors group">
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {sub.tool_name}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{sub.submitter_name || "Submitter"}</span>
                              <span className="text-xs">{sub.submitter_email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              className={
                                sub.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-200"
                                  : sub.status === "rejected"
                                  ? "bg-rose-500/10 text-rose-500 border-rose-200"
                                  : sub.status === "changes_requested"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-200"
                                  : "bg-sky-500/10 text-sky-500 border-sky-200"
                              }
                              variant="outline"
                            >
                              {sub.status.replace("_", " ")}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs capitalize">
                            {sub.tool_status === "active" ? "Add / Publish" : "Hide"}
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 flex gap-1 items-center"
                              onClick={() => navigate(`/dashboard/submissions/${sub.id}`)}
                            >
                              Review <ArrowRight className="size-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: TOOL REGISTRY */}
        <TabsContent value="tools" className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Tool Registry Catalog</h2>
              <p className="text-xs text-muted-foreground">Manage and curate tool directory entries.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => openAddTool()} className="flex items-center gap-1.5">
                <Plus className="size-4" /> Add Tool Entry
              </Button>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search tool names, taglines..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Select value={toolCategoryFilter} onValueChange={(val) => setToolCategoryFilter(val || "all")}>
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="shadow-sm border border-border/75">
            <CardContent className="p-6">
              {filteredTools.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No tools matched filters</p>
                  <p className="text-xs text-muted-foreground mt-1">Try relaxing filters or add a new entry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/80">
                        <th className="py-2.5 px-3 rounded-l-md">Name</th>
                        <th className="py-2.5 px-3">Tagline</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Pricing</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right rounded-r-md">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredTools.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/50 transition-colors group">
                          <td className="py-2 px-3 font-semibold text-foreground flex items-center gap-2">
                            {t.logo ? (
                              <img src={t.logo} alt="" className="size-6 rounded object-cover" />
                            ) : (
                              <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                {t.name[0]}
                              </div>
                            )}
                            {t.name}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-xs max-w-xs truncate">
                            {t.tagline}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant="secondary" className="text-[10px]">
                              {t.category}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-xs font-medium">
                            {t.pricing}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleToggleToolStatus(t)}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                t.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-200 hover:bg-emerald-500/20"
                                  : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                              }`}
                            >
                              {t.status === "active" ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-4 pl-4 text-right flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0"
                              onClick={() => openEditTool(t)}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletingToolId(t.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: USER BASE */}
        <TabsContent value="users" className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">User Registrations Queue</h2>
              <p className="text-xs text-muted-foreground">Manage user accounts and roles.</p>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search names, emails..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <Card className="shadow-sm border border-border/75">
            <CardContent className="p-6">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="size-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/80">
                        <th className="py-2.5 px-3 rounded-l-md">User</th>
                        <th className="py-2.5 px-3">Email Address</th>
                        <th className="py-2.5 px-3">System Role</th>
                        <th className="py-2.5 px-3 text-right rounded-r-md">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-2">
                            {u.pfp_url ? (
                              <img src={u.pfp_url} alt="" className="size-7 rounded-full object-cover" />
                            ) : (
                              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {u.name[0].toUpperCase()}
                              </div>
                            )}
                            {u.name}
                            {u.id === currentUser?.id && (
                              <span className="text-[10px] bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded font-bold border border-sky-200">
                                You
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-xs">
                            {u.email}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-4 pl-4 text-right flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0"
                              onClick={() => openEditUser(u)}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeletingUserId(u.id)}
                              disabled={u.id === currentUser?.id}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: AGENT SETTINGS */}
        <TabsContent value="settings" className="animate-fade-in">
          <Card className="shadow-sm border border-border/75">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-muted-foreground" /> AI Reviewer Agent Configuration
              </CardTitle>
              <CardDescription>
                Customize how the automated review agent is powered, select LLM parameters, and override prompt instructions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Left Column: Model and Parameters */}
                  <div className="space-y-6">
                    {/* 1. Provider Select */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="agent_provider">LLM Integration Provider</Label>
                        <img
                          src={`https://models.dev/logos/${(settings.agent_provider || "openrouter").toLowerCase()}.svg`}
                          alt=""
                          className="h-4.5 object-contain shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <Select
                        value={settings.agent_provider || "openrouter"}
                        onValueChange={(val) => {
                          const providerValue = val || "openrouter";
                          setSettings((prev) => ({
                            ...prev,
                            agent_provider: providerValue,
                            // reset model to default of that provider
                            agent_model: providerValue === "google" ? "gemini-1.5-flash" : providerValue === "openai" ? "gpt-4o-mini" : "nvidia/nemotron-3-super-120b-a12b:free"
                          }))
                        }}
                      >
                        <SelectTrigger id="agent_provider" className="w-full">
                          <SelectValue placeholder="Select LLM Provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openrouter">
                            <div className="flex items-center gap-2">
                              <img
                                src="https://models.dev/logos/openrouter.svg"
                                alt=""
                                className="size-4 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span>OpenRouter API</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="google">
                            <div className="flex items-center gap-2">
                              <img
                                src="https://models.dev/logos/google.svg"
                                alt=""
                                className="size-4 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span>Google Gemini SDK</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="openai">
                            <div className="flex items-center gap-2">
                              <img
                                src="https://models.dev/logos/openai.svg"
                                alt=""
                                className="size-4 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span>OpenAI SDK</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Define the SDK client initialized for running agent verification loops.
                      </p>
                    </div>

                    {/* 2. Model Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="agent_model">Provider Model Selection</Label>
                        {settings.agent_model && (
                          <img
                            src={`https://models.dev/logos/${getModelProviderName(settings.agent_model, settings.agent_provider).toLowerCase()}.svg`}
                            alt=""
                            className="h-4.5 object-contain shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            value={settings.agent_model || ""}
                            onValueChange={(val) => setSettings((prev) => ({ ...prev, agent_model: val || "" }))}
                          >
                            <SelectTrigger id="agent_model" className="w-full font-mono text-xs">
                              <SelectValue placeholder="Select Model ID" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredModelsForProvider.map((m) => {
                                const creator = getModelProviderName(m.id, settings.agent_provider)
                                return (
                                  <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={`https://models.dev/logos/${creator.toLowerCase()}.svg`}
                                        alt=""
                                        className="size-3.5 object-contain shrink-0"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                      <span>{m.name} ({m.id})</span>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-1/3">
                          <Input
                            placeholder="Or custom ID string..."
                            value={settings.agent_model || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, agent_model: e.target.value }))}
                            className="font-mono text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select from cached `models.dev` catalog matching the provider, or write a custom model identifier.
                      </p>
                    </div>

                    {/* 3. Temperature Selection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="agent_temperature">Model Temperature</Label>
                        <span className="text-xs font-semibold font-mono text-muted-foreground">{settings.agent_temperature || "0.0"}</span>
                      </div>
                      <Input
                        id="agent_temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.agent_temperature || "0.0"}
                        onChange={(e) => setSettings((prev) => ({ ...prev, agent_temperature: e.target.value }))}
                        className="h-8 cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower values (e.g. 0.0) lead to deterministic fact-checking. Higher values allow creative suggestions.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Secrets and Prompts */}
                  <div className="space-y-6">
                    {/* 4. API Keys Override */}
                    <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <Lock className="size-3.5" /> API Keys Configuration Override
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                          className="h-7 text-[10px]"
                        >
                          {showApiKeys ? <><EyeOff className="size-3 mr-1" /> Obscure</> : <><Eye className="size-3 mr-1" /> Reveal Keys</>}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="openrouter_api_key" className="text-xs">OpenRouter API Key Override</Label>
                            <img src="https://models.dev/logos/openrouter.svg" alt="" className="h-3.5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <Input
                            id="openrouter_api_key"
                            type={showApiKeys ? "text" : "password"}
                            placeholder={settings.openrouter_api_key ? "••••••••••••••••••••••••" : "Falls back to server .env config"}
                            value={settings.openrouter_api_key || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, openrouter_api_key: e.target.value }))}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="google_api_key" className="text-xs">Google Gemini API Key Override</Label>
                            <img src="https://models.dev/logos/google.svg" alt="" className="h-3.5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <Input
                            id="google_api_key"
                            type={showApiKeys ? "text" : "password"}
                            placeholder={settings.google_api_key ? "••••••••••••••••••••••••" : "Falls back to server .env config"}
                            value={settings.google_api_key || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, google_api_key: e.target.value }))}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="openai_api_key" className="text-xs">OpenAI API Key Override</Label>
                            <img src="https://models.dev/logos/openai.svg" alt="" className="h-3.5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <Input
                            id="openai_api_key"
                            type={showApiKeys ? "text" : "password"}
                            placeholder={settings.openai_api_key ? "••••••••••••••••••••••••" : "Falls back to server .env config"}
                            value={settings.openai_api_key || ""}
                            onChange={(e) => setSettings((prev) => ({ ...prev, openai_api_key: e.target.value }))}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        For security, keys stored in the database override server .env variables. Leave blank to keep using env settings.
                      </p>
                    </div>

                    {/* 5. Prompt customization */}
                    <div className="space-y-2">
                      <Label htmlFor="agent_system_prompt">Reviewer System Prompt Override</Label>
                      <Textarea
                        id="agent_system_prompt"
                        placeholder="Describe how the AI should verify submissions, check links, evaluate taglines, etc..."
                        value={settings.agent_system_prompt || ""}
                        onChange={(e) => setSettings((prev) => ({ ...prev, agent_system_prompt: e.target.value }))}
                        rows={8}
                        className="font-mono text-xs leading-relaxed"
                      />
                      <p className="text-xs text-muted-foreground">
                        Custom instructions template governing the AI review behavior. Leave blank to use defaults.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                  <Button type="submit" disabled={isUpdatingSettings} className="w-full sm:w-auto font-semibold">
                    {isUpdatingSettings && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                    Save Agent Configurations
                  </Button>
                </DialogFooter>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: ADD / EDIT TOOL ENTRY */}
      <Dialog open={toolModalOpen} onOpenChange={setToolModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTool ? "Edit Tool Registry Listing" : "Add New Registry Listing"}</DialogTitle>
            <DialogDescription>
              Directly curate directory registry metadata fields.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleToolSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tool-name">Tool Name</Label>
                <Input
                  id="tool-name"
                  value={toolForm.name}
                  onChange={(e) => setToolForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tool-url">Website URL</Label>
                <Input
                  id="tool-url"
                  placeholder="https://example.com"
                  value={toolForm.url}
                  onChange={(e) => setToolForm((prev) => ({ ...prev, url: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tool-tagline">Short Tagline Description</Label>
              <Input
                id="tool-tagline"
                placeholder="A brief tagline showing what the tool does..."
                value={toolForm.short_description}
                onChange={(e) => setToolForm((prev) => ({ ...prev, short_description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tool-desc">Full Markdown Description</Label>
              <Textarea
                id="tool-desc"
                placeholder="Write full summary details..."
                value={toolForm.description}
                onChange={(e) => setToolForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tool-pricing">Pricing Model</Label>
                <Select
                  value={toolForm.pricing_model}
                  onValueChange={(val) => setToolForm((prev) => ({ ...prev, pricing_model: val || "Free" }))}
                >
                  <SelectTrigger id="tool-pricing">
                    <SelectValue placeholder="Pricing model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Freemium">Freemium</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tool-cat">Category</Label>
                <Select
                  value={toolForm.category_id}
                  onValueChange={(val) => setToolForm((prev) => ({ ...prev, category_id: val || "" }))}
                >
                  <SelectTrigger id="tool-cat">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tool-logo">Logo Icon URL</Label>
                <Input
                  id="tool-logo"
                  placeholder="https://..."
                  value={toolForm.logo_url}
                  onChange={(e) => setToolForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tool-status">Initial Status</Label>
                <Select
                  value={toolForm.status}
                  onValueChange={(val) => setToolForm((prev) => ({ ...prev, status: val || "inactive" }))}
                >
                  <SelectTrigger id="tool-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Visible)</SelectItem>
                    <SelectItem value="inactive">Inactive (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setToolModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTool ? "Save Updates" : "Create Listing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: EDIT USER ROLE */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Profile Permissions</DialogTitle>
            <DialogDescription>
              Assign roles for account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUserSubmit} className="space-y-4">
            {editingUser && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                {editingUser.pfp_url ? (
                  <img src={editingUser.pfp_url} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {editingUser.name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{editingUser.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{editingUser.email}</div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="user-role">System Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(val) => setUserForm({ role: val || "user" })}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Ordinary Member)</SelectItem>
                  <SelectItem value="admin">Administrator (System Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Permission
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: CONFIRM DELETE TOOL */}
      <Dialog open={deletingToolId !== null} onOpenChange={(open) => !open && setDeletingToolId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Registry Listing</DialogTitle>
            <DialogDescription>
              Warning: This action is irreversible. It will delete this tool and all related votes, reviews, reports, and agent audits from the SQLite database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingToolId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDeleteTool()}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: CONFIRM DELETE USER */}
      <Dialog open={deletingUserId !== null} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove User Account</DialogTitle>
            <DialogDescription>
              Warning: This will purge this user account and cascade delete all associated collections, oauth credentials, submissions, reviews, and votes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUserId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDeleteUser()}>
              Confirm Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <Card className="shadow-sm border border-border/75">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted border border-border/40 shrink-0">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
