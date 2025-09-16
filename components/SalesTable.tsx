

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationLink,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";

// ✅ Remove the status property from the interface
interface SalesRecord {
  id: string;
  title: string;
  clientName: string;
  actualRevenue: number;
  potentialRevenue: number;
  startTime: string;
  completedAt: string | null;
  isCompleted: boolean;
  conversionAchieved: boolean;
  taskType: string;
  salesRep: string;
}

interface SalesTableProps {
  salesData: SalesRecord[]; // ✅ No status property required
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  period: string;
}

export default function SalesTable({
  salesData,
  currentPage,
  totalPages,
  onPageChange,
  period,
}: SalesTableProps) {
  const itemsPerPage = 5;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = salesData.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  // ✅ Remove statusBadge function or update it to use isCompleted and conversionAchieved
  const getStatusBadge = (record: SalesRecord) => {
    if (record.conversionAchieved) {
      return (
        <Badge  className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Converted
        </Badge>
      );
    } else if (record.isCompleted) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-yellow-300 text-yellow-700">
          <AlertTriangle className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    }
  };

  const getRevenueBadge = (actual: number, potential: number) => {
    const percentage = potential > 0 ? (actual / potential) * 100 : 0;
    
    if (percentage >= 100) {
      return (
        <Badge  className="bg-green-100 text-green-800">
          {formatCurrency(actual)} (100%)
        </Badge>
      );
    } else if (percentage >= 75) {
      return (
        <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
          {formatCurrency(actual)} ({Math.round(percentage)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {formatCurrency(actual)} ({Math.round(percentage)}%)
        </Badge>
      );
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Sales Performance Table
        </CardTitle>
        <CardDescription>
          {period === "daily" ? "Today's" : 
           period === "weekly" ? "This week's" : 
           period === "yearly" ? "This year's" : "This month's"} 
          detailed sales records
        </CardDescription>
      </CardHeader>
      <CardContent>
        {salesData.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 text-gray-400 mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-16 h-16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Sales Records Found</h3>
            <p className="text-gray-600">No sales activities recorded for the selected period.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[200px] font-semibold text-gray-800">Client/Task</TableHead>
                    <TableHead className="text-right font-semibold text-gray-800">Revenue</TableHead>
                    <TableHead className="text-center font-semibold text-gray-800">Type</TableHead>
                    <TableHead className="text-center font-semibold text-gray-800">Status</TableHead>
                    <TableHead className="text-center font-semibold text-gray-800">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((record) => (
                    <TableRow 
                      key={record.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">{record.title}</div>
                          <div className="text-xs text-gray-600">{record.clientName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {getRevenueBadge(record.actualRevenue, record.potentialRevenue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {record.taskType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(record)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {record.completedAt ? formatDate(record.completedAt) : formatDate(record.startTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* First page */}
                    <PaginationItem>
                      <PaginationLink 
                        onClick={() => onPageChange(1)}
                        isActive={currentPage === 1}
                        className={currentPage === 1 ? "bg-blue-600 text-white" : ""}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {currentPage > 2 && currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => onPageChange(currentPage - 1)}
                        >
                          {currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {currentPage > 1 && currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => onPageChange(currentPage)}
                          isActive={true}
                          className="bg-blue-600 text-white"
                        >
                          {currentPage}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {currentPage < totalPages - 1 && currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => onPageChange(currentPage + 1)}
                        >
                          {currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink 
                          onClick={() => onPageChange(totalPages)}
                          isActive={currentPage === totalPages}
                          className={currentPage === totalPages ? "bg-blue-600 text-white" : ""}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                <div className="mt-4 text-sm text-gray-600 text-center">
                  Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, salesData.length)} of {salesData.length} sales records
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}