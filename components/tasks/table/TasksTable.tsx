"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getTasksByUserAction } from "@/actions/task-actions";
import DataTable from "@/components/DataTableComponents/DataTable";
import { createTaskColumns } from "./task-columns";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { EditTaskDialog } from "../EditTaskDialog"; 
import type { Task } from "@/types/task";

export default function TasksTable({ onViewTask }: { onViewTask?: (id: string) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ✅ State to track which task is being edited
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const {
     data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const response = await getTasksByUserAction({
        userId: user.id,
        page: 1,
        limit: 100,
      });
      if (!response.success) throw new Error(response.message || "Failed to load tasks");
      return response;
    },
    enabled: !!user?.id,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
  });

  const tasks = data?.data?.tasks || [];

  // ✅ Handle Edit Click — open dialog with selected task
  const handleEditTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setEditingTask(task);
    }
  };

  // ✅ Columns with edit handler passed in
  const columns = createTaskColumns(
    onViewTask || ((id) => console.log("View task:", id)),
    handleEditTask, // 👈 Pass edit handler
    (id) => console.log("Delete task:", id) // You can wire up delete later
  );

  // ✅ Called when edit dialog saves successfully
  const handleEditSuccess = () => {
    setEditingTask(null); // Close dialog
    queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] }); // Refresh data
    toast.success("Task updated successfully!");
  };

  // ✅ Handle delete (placeholder)
  const handleDelete = (rows: any[]) => {
    console.log("Deleting tasks:", rows.map((row) => row.original.id));
    queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading your tasks...</div>
      </div>
    );
  }

  if (error) {
    console.error("TasksTable: Error =", error);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error loading your tasks: {error.message}</div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="max-w-screen-2xl mx-auto w-full pb-10 px-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-3 mb-3">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
            My Tasks
          </h2>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Link href="/dashboard/tasks/create">
              <Button size="sm" className="w-full lg:w-auto bg-primary text-primary-foreground">
                <Plus className="size-4 mr-2" />
                Add New Task
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
        <div className="text-center text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <div className="text-lg">No tasks found</div>
            <div className="text-sm text-gray-400">
              Try adding a new task or refreshing the list
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-screen-2xl mx-auto w-full pb-10 px-6">
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-3 mb-3">
          <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
            My Tasks
          </h2>
          <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
            <Link href="/dashboard/tasks/create">
              <Button size="sm" className="w-full lg:w-auto bg-primary text-primary-foreground">
                <Plus className="size-4 mr-2" />
                Add New Task
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        <div>
          <DataTable columns={columns} data={tasks} onDelete={handleDelete} />
        </div>
      </div>

      {/* ✅ Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null); // Close dialog
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}