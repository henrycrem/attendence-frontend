"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateTaskAction } from "@/actions/task-actions"; 
import type { Task } from "@/types/task";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onSuccess }: EditTaskDialogProps) {
  const [isCompleted, setIsCompleted] = useState(task.isCompleted);
  const [outcome, setOutcome] = useState<string | undefined>(task.outcome || undefined);
  const [actualRevenue, setActualRevenue] = useState<string>(task.actualRevenue?.toString() || "");
  const [conversionAchieved, setConversionAchieved] = useState(task.conversionAchieved);
  const [notes, setNotes] = useState<string>(task.notes || "");
  const [endTime, setEndTime] = useState<string>(
    task.endTime ? new Date(task.endTime).toISOString().slice(0, 16) : ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setIsCompleted(task.isCompleted);
    setOutcome(task.outcome || undefined);
    setActualRevenue(task.actualRevenue?.toString() || "");
    setConversionAchieved(task.conversionAchieved);
    setNotes(task.notes || "");
    setEndTime(task.endTime ? new Date(task.endTime).toISOString().slice(0, 16) : "");
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse actualRevenue
      let parsedActualRevenue: number | null = null;
      if (actualRevenue.trim()) {
        const num = parseFloat(actualRevenue);
        if (isNaN(num)) {
          toast.error("Please enter a valid number for actual revenue.");
          return;
        }
        parsedActualRevenue = num;
      }

      // Prepare update payload
      const updateData = {
        id: task.id,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
        outcome: outcome || null,
        actualRevenue: parsedActualRevenue,
        conversionAchieved,
        notes,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      };

      const result = await updateTaskAction(updateData);

      if (result.success) {
        toast.success("Task updated successfully!");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || "Failed to update task.");
      }
    } catch (error: any) {
      console.error("Update task failed:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task: {task.title}</DialogTitle>
          <DialogDescription>Update task completion, outcome, revenue, and notes.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Task Completion */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="isCompleted"
              checked={isCompleted}
              onCheckedChange={(checked) => setIsCompleted(checked as boolean)}
            />
            <Label htmlFor="isCompleted" className="text-sm font-medium">
              Mark as Completed
            </Label>
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Select value={outcome || ""} onValueChange={(value) => setOutcome(value || undefined)}>
              <SelectTrigger id="outcome">
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERESTED">Interested</SelectItem>
                <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                <SelectItem value="NEEDS_FOLLOW_UP">Needs Follow Up</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actual Revenue */}
          <div className="space-y-2">
            <Label htmlFor="actualRevenue">Actual Revenue (USD)</Label>
            <Input
              id="actualRevenue"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g., 150.00"
              value={actualRevenue}
              onChange={(e) => setActualRevenue(e.target.value)}
            />
          </div>

          {/* Conversion Achieved */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="conversionAchieved"
              checked={conversionAchieved}
              onCheckedChange={(checked) => setConversionAchieved(checked as boolean)}
            />
            <Label htmlFor="conversionAchieved" className="text-sm font-medium">
              Conversion Achieved
            </Label>
          </div>

          {/* End Time (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time (Optional)</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this task..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Warning if marking completed without outcome */}
          {isCompleted && !outcome && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>
                You’ve marked this task as completed but haven’t selected an outcome. Consider selecting
                one (e.g., “Converted” or “Cancelled”) for accurate reporting.
              </span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}