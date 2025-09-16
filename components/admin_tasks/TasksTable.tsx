"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '@/components/DataTableComponents/DataTable';
import { createTaskColumns } from './task-columns';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getAdminAllTasksAction } from '@/actions/dashboard';

type Props = {
  onViewTask?: (id: string) => void;
  onShowLocation?: (id: string) => void;
};

export default function TasksTable({ onViewTask, onShowLocation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('🔍 Fetching tasks for user:', user.id);
      console.log('🔍 User role:', user.role?.roleName);

      const response = await getAdminAllTasksAction(user.id, user.role?.roleName || '', 1, 100);

      console.log('📊 API Response:', response);
      console.log('📊 Tasks data:', response?.data?.tasks);
      console.log('📊 Task count:', response?.data?.tasks?.length);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch tasks');
      }

      return response;
    },
    enabled: !!user?.id,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
  });

  const tasks = data?.success ? data.data?.tasks || [] : [];

  console.log('📋 Final tasks array:', tasks);
  console.log('📋 Task count:', tasks.length);

  const columns = createTaskColumns(
    onViewTask || ((id) => setSelectedTaskId(id)),
    (id) => console.log('Edit task:', id),
    (id) => console.log('Delete task:', id),
    onShowLocation || ((id) => console.log('Show location for task:', id))
  );

  const handleDelete = (rows: any[]) => {
    console.log('Deleting tasks:', rows.map((row) => row.original.id));
    queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] });
  };

  useEffect(() => {
    if (!isLoading && data) {
      console.log('✅ Data loaded successfully:', {
        success: data.success,
        taskCount: data.data?.tasks?.length || 0,
        hasTasks: data.data?.tasks?.length > 0,
      });
    }
  }, [isLoading, data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading your tasks...</div>
      </div>
    );
  }

  if (error) {
    console.error('TasksTable: Error=', error);
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
            <Link href="/dashboard/tasks/new">
              <Button size="sm" className="w-full lg:w-auto bg-primary text-primary-foreground cursor-pointer">
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
    <div className="max-w-screen-2xl mx-auto w-full pb-10 px-6">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-600 py-3 mb-3">
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
          My Tasks ({tasks.length})
        </h2>
        <div className="flex flex-col lg:flex-row gap-y-2 items-center gap-x-2">
          <Link href="/dashboard/tasks/new">
            <Button size="sm" className="w-full lg:w-auto bg-primary text-primary-foreground cursor-pointer">
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
  );
}