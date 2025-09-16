'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { updateSalesTargetsAction, getSalesUsersAction } from '@/actions/sales-targets';
import { Target, TrendingUp, DollarSign, User, Calendar, Award } from 'lucide-react';

interface SalesUser {
  id: string;
  name: string;
  email: string;
  weeklySalesTarget: number | null;
  monthlySalesTarget: number | null;
  yearlySalesTarget: number | null;
  weeklyRevenueTarget: number | null;
  monthlyRevenueTarget: number | null;
  yearlyRevenueTarget: number | null;
}

export default function SalesTargetsForm() {
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sales-users'],
    queryFn: async () => {
      const result = await getSalesUsersAction();
      if (!result.success) throw new Error(result.error);
      return result.data as SalesUser[];
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      weeklySalesTarget: number | null;
      monthlySalesTarget: number | null;
      yearlySalesTarget: number | null;
      weeklyRevenueTarget?: number | null;
      monthlyRevenueTarget?: number | null;
      yearlyRevenueTarget?: number | null;
    }) => {
      const result = await updateSalesTargetsAction(data.userId, data);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      toast.success(`✅ Targets updated for ${data.name}`);
      queryClient.invalidateQueries({ queryKey: ['sales-users'] });
      queryClient.invalidateQueries({ queryKey: ['sales-team-stats'] });
    },
    onError: (error: Error) => {
      toast.error(`❌ ${error.message}`);
    },
  });

  const handleUpdate = (userId: string, data: any) => {
    mutation.mutate({
      userId,
      ...data,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Target className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-red-800 text-lg font-medium">Loading sales users...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b-2 border-red-100">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-red-600 rounded-lg p-3 shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-red-900">Sales Targets Dashboard</h1>
              <p className="text-red-700 text-sm sm:text-base">Set and manage your team's performance goals</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-full">
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              <span className="text-red-800 font-medium">{users?.length || 0} Sales Representatives</span>
            </div>
          
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {users?.map((user) => (
            <SalesTargetForm key={user.id} user={user} onUpdate={handleUpdate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SalesTargetForm({
  user,
  onUpdate,
}: {
  user: SalesUser;
  onUpdate: (userId: string, data: any) => void;
}) {
  const [formState, setFormState] = useState({
    weeklySalesTarget: user.weeklySalesTarget?.toString() || '',
    monthlySalesTarget: user.monthlySalesTarget?.toString() || '',
    yearlySalesTarget: user.yearlySalesTarget?.toString() || '',
    weeklyRevenueTarget: user.weeklyRevenueTarget?.toString() || '',
    monthlyRevenueTarget: user.monthlyRevenueTarget?.toString() || '',
    yearlyRevenueTarget: user.yearlyRevenueTarget?.toString() || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormState({
      weeklySalesTarget: user.weeklySalesTarget?.toString() || '',
      monthlySalesTarget: user.monthlySalesTarget?.toString() || '',
      yearlySalesTarget: user.yearlySalesTarget?.toString() || '',
      weeklyRevenueTarget: user.weeklyRevenueTarget?.toString() || '',
      monthlyRevenueTarget: user.monthlyRevenueTarget?.toString() || '',
      yearlyRevenueTarget: user.yearlyRevenueTarget?.toString() || '',
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onUpdate(user.id, {
      weeklySalesTarget: formState.weeklySalesTarget === '' ? null : Number(formState.weeklySalesTarget),
      monthlySalesTarget: formState.monthlySalesTarget === '' ? null : Number(formState.monthlySalesTarget),
      yearlySalesTarget: formState.yearlySalesTarget === '' ? null : Number(formState.yearlySalesTarget),
      weeklyRevenueTarget: formState.weeklyRevenueTarget === '' ? null : Number(formState.weeklyRevenueTarget),
      monthlyRevenueTarget: formState.monthlyRevenueTarget === '' ? null : Number(formState.monthlyRevenueTarget),
      yearlyRevenueTarget: formState.yearlyRevenueTarget === '' ? null : Number(formState.yearlyRevenueTarget),
    });
    
    setIsSubmitting(false);
  };

  return (
    <Card className="bg-white shadow-lg border-2 border-red-100 hover:shadow-xl transition-all duration-300 hover:border-red-200">
      <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white bg-opacity-20 rounded-full p-1.5">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm sm:text-base font-semibold truncate">{user.name}</CardTitle>
            <p className="text-red-100 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4 sm:space-y-5">
          {/* Sales Targets Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <h3 className="text-sm sm:text-base font-semibold text-red-900">Sales Targets</h3>
            </div>
            
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`weekly-${user.id}`} className="text-red-800 font-medium text-xs sm:text-sm">
                  Weekly Target
                </Label>
                <Input
                  id={`weekly-${user.id}`}
                  name="weeklySalesTarget"
                  type="number"
                  min="0"
                  value={formState.weeklySalesTarget}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="border-2 border-red-100 focus:border-red-400 focus:ring-red-200 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`monthly-${user.id}`} className="text-red-800 font-medium text-xs sm:text-sm">
                  Monthly Target
                </Label>
                <Input
                  id={`monthly-${user.id}`}
                  name="monthlySalesTarget"
                  type="number"
                  min="0"
                  value={formState.monthlySalesTarget}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  className="border-2 border-red-100 focus:border-red-400 focus:ring-red-200 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`yearly-${user.id}`} className="text-red-800 font-medium text-xs sm:text-sm">
                  Yearly Target
                </Label>
                <Input
                  id={`yearly-${user.id}`}
                  name="yearlySalesTarget"
                  type="number"
                  min="0"
                  value={formState.yearlySalesTarget}
                  onChange={handleChange}
                  placeholder="e.g. 240"
                  className="border-2 border-red-100 focus:border-red-400 focus:ring-red-200 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
            </div>
          </div>

          <Separator className="border-red-200" />

          {/* Revenue Targets Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-red-600" />
              <h3 className="text-sm sm:text-base font-semibold text-red-900">Revenue Targets</h3>
            </div>
            
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`weeklyRev-${user.id}`} className="text-red-800 font-medium text-xs sm:text-sm">
                  Weekly Revenue ($)
                </Label>
                <Input
                  id={`weeklyRev-${user.id}`}
                  name="weeklyRevenueTarget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.weeklyRevenueTarget}
                  onChange={handleChange}
                  placeholder="e.g. 5,000"
                  className="border-2 border-red-100 focus:border-red-400 focus:ring-red-200 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`monthlyRev-${user.id}`} className="text-red-800 font-medium text-xs sm:text-sm">
                  Monthly Revenue ($)
                </Label>
                <Input
                  id={`monthlyRev-${user.id}`}
                  name="monthlyRevenueTarget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.monthlyRevenueTarget}
                  onChange={handleChange}
                  placeholder="e.g. 20,000"
                  className="border-2 border-red-100 focus:border-red-400 focus:ring-red-200 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`yearlyRev-${user.id}`} className="text-red-800 font-medium text-xs sm:text-sm">
                  Yearly Revenue ($)
                </Label>
                <Input
                  id={`yearlyRev-${user.id}`}
                  name="yearlyRevenueTarget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.yearlyRevenueTarget}
                  onChange={handleChange}
                  placeholder="e.g. 240,000"
                  className="border-2 border-red-100 focus:border-red-400 focus:ring-red-200 rounded-lg text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 sm:py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Save Targets</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}