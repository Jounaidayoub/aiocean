import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { reportTool } from "@/shared/api/reports"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

interface ReportToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolId: string
  toolName: string
}

type ReportReason = "spam" | "inappropriate" | "duplicate" | "incorrect_info"

export function ReportToolDialog({ open, onOpenChange, toolId, toolName }: ReportToolDialogProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reason, setReason] = useState<ReportReason>("spam")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>You need to sign in to report tools.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onOpenChange(false); navigate("/login") }}>Sign In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await reportTool(toolId, { reason, note: note.trim() || undefined })
      toast.success("Thank you! The tool has been reported and will be reviewed by administrators.")
      setNote("")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report")
      toast.error(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {toolName}</DialogTitle>
          <DialogDescription>Let us know what's wrong with this tool listing.</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Select
              value={reason}
              onValueChange={(val) => setReason(val as ReportReason)}
            >
              <SelectTrigger id="report-reason" className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam / Advertising</SelectItem>
                <SelectItem value="inappropriate">Inappropriate / Harmful Content</SelectItem>
                <SelectItem value="duplicate">Duplicate Entry</SelectItem>
                <SelectItem value="incorrect_info">Incorrect Info / Broken Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-note">Additional details (optional)</Label>
            <Textarea
              id="report-note"
              placeholder="Provide context or links that verify your claim..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
