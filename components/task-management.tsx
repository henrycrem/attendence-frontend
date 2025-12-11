"use client";

import { useState, useEffect } from 'react';
import TasksTable from '@/components/admin_tasks/TasksTable';
import TaskDetails from '@/components/admin_tasks/TaskDetails';
import { useQuery } from '@tanstack/react-query';
import { getAdminTaskByIdAction } from '@/actions/dashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function TaskManagement() {
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { data: taskData, isLoading: isTaskLoading, error: taskError } = useQuery({
    queryKey: ['task', selectedTaskId],
    queryFn: async () => {
      if (!selectedTaskId || !user?.id) {
        console.log('No taskId or userId, returning null');
        return null;
      }
      const response = await getAdminTaskByIdAction(user.id, selectedTaskId);
      console.log('Task query response:', response);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch task');
      }
      if (!response.data) {
        throw new Error('No task data returned');
      }
      return response.data;
    },
    enabled: !!selectedTaskId && !!user?.id,
  });

  // Update selectedTask when taskData changes
  useEffect(() => {
    if (selectedTaskId && taskData && !isTaskLoading) {
      console.log('Setting selectedTask:', taskData);
      setSelectedTask(taskData);
    } else if (!taskData && !isTaskLoading && selectedTaskId) {
      console.log('No task data found for taskId:', selectedTaskId);
      setSelectedTask(null);
    }
  }, [taskData, isTaskLoading, selectedTaskId]);

  const handleViewTask = (taskId: string) => {
    console.log('Viewing task with ID:', taskId);
    setSelectedTaskId(taskId);
    setSelectedTask(null);
  };

  const handleBackToList = () => {
    console.log('Returning to task list');
    setSelectedTaskId(null);
    setSelectedTask(null);
  };

  if (selectedTaskId) {
    if (isTaskLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading task details...</div>
        </div>
      );
    }
    if (taskError) {
      console.error('Task details error:', taskError);
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-destructive">
            Error loading task details: {taskError.message}
            <button onClick={handleBackToList} className="text-blue-500 hover:underline ml-2">
              Back to list
            </button>
          </div>
        </div>
      );
    }
    if (selectedTask) {
      return <TaskDetails task={selectedTask} onBack={handleBackToList} />;
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">
          Task not found.{" "}
          <button onClick={handleBackToList} className="text-blue-500 hover:underline">
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks Management</h1>
        <p className="text-muted-foreground">Manage your tasks and track progress</p>
      </div>
      <TasksTable onViewTask={handleViewTask} />
    </div>
  );
}