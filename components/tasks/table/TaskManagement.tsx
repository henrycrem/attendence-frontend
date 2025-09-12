"use client";

import { useState, useEffect } from "react";
import TasksTable from "./TasksTable";
import TaskDetails from "./TaskDetails";
import { useQuery } from "@tanstack/react-query";
import { getTaskByIdAction } from "@/actions/task-actions"; 
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/types/task";

export default function TaskManagement() {
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const {
    data: taskData,
    isLoading: isTaskLoading,
    error: taskError,
    refetch,
  } = useQuery({
    queryKey: ["task", selectedTaskId],
    queryFn: async () => {
      console.log("TaskManagement: useQuery triggered for taskId =", selectedTaskId);
      if (!selectedTaskId) {
        console.log("TaskManagement: No taskId provided");
        return null;
      }
      const response = await getTaskByIdAction(selectedTaskId);
      console.log("TaskManagement: Server action response =", response);

      if (response.success && response.data) {
        console.log("TaskManagement: Returning task data =", response.data);
        return response.data;
      }

      console.log("TaskManagement: Task load failed - message:", response.message);
      return null;
    },
    enabled: !!selectedTaskId,
    retry: false,
  });

  // Optional: Log taskData for debugging
  useEffect(() => {
    if (selectedTaskId && taskData) {
      console.log("TaskManagement: taskData received =", taskData);
    }
  }, [selectedTaskId, taskData]);

  const handleViewTask = (taskId: string) => {
    console.log("TaskManagement: handleViewTask called with taskId =", taskId);
    setSelectedTaskId(taskId);
  };

  const handleBackToList = () => {
    console.log("TaskManagement: handleBackToList called");
    setSelectedTaskId(null);
  };

  // If viewing a specific task
  if (selectedTaskId) {
    if (isTaskLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading task details...</div>
        </div>
      );
    }

    if (taskError) {
      console.error("TaskManagement: Error =", taskError);
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">
            Error loading task: {taskError.message || "Unknown error"}
            <br />
            <button onClick={handleBackToList} className="text-blue-500 hover:underline mt-2">
              Back to list
            </button>
          </div>
        </div>
      );
    }

    if (!taskData) {
      console.log("TaskManagement: No task data found for taskId =", selectedTaskId);
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">
            Task not found.
            <br />
            <button onClick={handleBackToList} className="text-blue-500 hover:underline mt-2">
              Back to list
            </button>
          </div>
        </div>
      );
    }

    console.log("TaskManagement: Rendering TaskDetails with task =", taskData);
    return <TaskDetails task={taskData} onBack={handleBackToList} />;
  }

  // Default: Show task list
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground">Manage your assigned tasks and follow-ups</p>
      </div>
      <TasksTable onViewTask={handleViewTask} />
    </div>
  );
}