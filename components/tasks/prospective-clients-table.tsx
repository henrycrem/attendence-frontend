"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Mail, MapPin, MoreHorizontal, Eye, Edit, Calendar, Search, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getProspectiveClientsByUser } from "@/actions/tashdashboard";
import { useAuth } from "@/contexts/AuthContext";

const statusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  follow_up: "bg-orange-100 text-orange-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-red-100 text-red-800",
  URGENT: "bg-purple-100 text-purple-800",
};

const serviceTypeLabels = {
  FIBER_INTERNET: "Fiber Internet",
  WIRELESS_4G: "Wireless 4G",
  WIFI_HOTSPOT: "WiFi Hotspot",
  BUSINESS_INTERNET: "Business Internet",
  RESIDENTIAL_INTERNET: "Residential Internet",
};

interface ProspectiveClientsTableProps {
  className?: string;
  onViewClient?: (id: string) => void; // Added prop for view action
}

export function ProspectiveClientsTable({ className, onViewClient }: ProspectiveClientsTableProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: clientsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["prospectiveClients", user?.id, currentPage, itemsPerPage],
    queryFn: () => {
      if (!user?.id) throw new Error("User not authenticated");
      return getProspectiveClientsByUser(user.id, currentPage, itemsPerPage);
    },
    enabled: !!user?.id,
    refetchInterval: 2 * 60 * 1000,
  });

  console.log("ProspectiveClientsTable: clientsResponse=", clientsResponse); // Debug log

  const clients = clientsResponse?.success ? clientsResponse.data.clients || [] : [];
  const totalCount = clientsResponse?.success ? clientsResponse.data.total || 0 : 0;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Invalid date string in table:", dateString);
        return "N/A";
      }
      return format(date, "MMM dd, yyyy");
    } catch (error) {
      console.error("formatDate error in table:", error, "dateString:", dateString);
      return "N/A";
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];

    const filtered = clients.filter((client: any) => {
      const matchesSearch =
        (client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (client.phone?.includes(searchTerm) || false) ||
        (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (client.address?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (client.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || client.priority === priorityFilter;
      const matchesService = serviceFilter === "all" || client.serviceInterest === serviceFilter;
      const matchesNeighborhood =
        neighborhoodFilter === "all" || client.neighborhood?.toLowerCase() === neighborhoodFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority && matchesService && matchesNeighborhood;
    });

    filtered.sort((a: any, b: any) => {
      let aValue: any = a[sortBy as keyof typeof a] || "";
      let bValue: any = b[sortBy as keyof typeof b] || "";

      if (sortBy === "createdAt" || sortBy === "nextFollowUpDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [clients, searchTerm, statusFilter, priorityFilter, serviceFilter, neighborhoodFilter, sortBy, sortOrder]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setServiceFilter("all");
    setNeighborhoodFilter("all");
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Prospective Clients</CardTitle>
          <CardDescription>Loading your client data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading clients...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !clientsResponse?.success) {
    console.error("ProspectiveClientsTable: Error=", error || clientsResponse?.error);
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Prospective Clients</CardTitle>
          <CardDescription>Failed to load client data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">
                {error?.message || clientsResponse?.error || "Failed to load client data"}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredAndSortedClients.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Prospective Clients</CardTitle>
          <CardDescription>No clients found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No prospective clients match your filters.</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>My Prospective Clients</CardTitle>
        <CardDescription>Manage and track all your prospective clients and their engagement status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search clients by name, phone, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="FIBER_INTERNET">Fiber Internet</SelectItem>
                <SelectItem value="WIRELESS_4G">Wireless 4G</SelectItem>
                <SelectItem value="WIFI_HOTSPOT">WiFi Hotspot</SelectItem>
                <SelectItem value="BUSINESS_INTERNET">Business Internet</SelectItem>
                <SelectItem value="RESIDENTIAL_INTERNET">Residential Internet</SelectItem>
              </SelectContent>
            </Select>

            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="sinkor">Sinkor</SelectItem>
                <SelectItem value="congo town">Congo Town</SelectItem>
                <SelectItem value="paynesville">Paynesville</SelectItem>
                <SelectItem value="new kru town">New Kru Town</SelectItem>
                <SelectItem value="monrovia central">Monrovia Central</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedClients.length} of {totalCount} clients
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("fullName")}>
                  Client Name {sortBy === "fullName" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Service Interest</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
                  Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("priority")}>
                  Priority {sortBy === "priority" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("expectedRevenue")}>
                  Expected Revenue {sortBy === "expectedRevenue" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("createdAt")}>
                  Created {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.map((client: any) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.creator?.name || "Unknown"} • {client._count?.tasks || 0} tasks
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{client.phone || "N/A"}</span>
                      </div>
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{client.neighborhood || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{client.address || "N/A"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">
                        {serviceTypeLabels[client.serviceInterest as keyof typeof serviceTypeLabels] ||
                          client.serviceInterest || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">{client.bandwidthPlan || "N/A"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[client.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                      {client.status?.replace("_", " ").toUpperCase() || "NEW"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityColors[client.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-800"}>
                      {client.priority || "MEDIUM"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(client.expectedRevenue)}</p>
                      <p className="text-xs text-muted-foreground">{client.conversionProbability || 0}% probability</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{formatDate(client.createdAt)}</p>
                      {client.nextFollowUpDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Follow up: {formatDate(client.nextFollowUpDate)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="flex items-center gap-2"
                          onClick={() => onViewClient?.(client.id)}
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Call Client
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Send Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}