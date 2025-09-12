"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, UserPlus, ArrowLeft } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createProspectiveClientAction } from "@/actions/prospective-client" 
import { useAuth } from "@/contexts/AuthContext" 
import { toast } from "sonner" 
export default function CreateProspectiveClientPage() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    serviceInterest: "",
    bandwidthPlan: "",
    monthlyBudget: "",
    currentProvider: "",
    contractEndDate: "",
    installationSite: "",
    notes: "",
    priority: "medium",
    source: "field_visit",
  })

  const createMutation = useMutation({
    mutationFn: createProspectiveClientAction,
    onSuccess: (data) => {
      if (data.success) {
        toast.success( "Prospective client created successfully!",
        )
        queryClient.invalidateQueries({ queryKey: ["prospective-clients"] })
        router.push("/dashboard")
      } else {
        toast.error( "Failed to create prospective client",
       )
      }
    },
    onError: (error) => {
      toast.error( "Failed to create prospective client",
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) {
      toast.error("You must be logged in to create a prospective client",
      )
      return
    }

    createMutation.mutate({
      ...formData,
      monthlyBudget: formData.monthlyBudget ? Number.parseFloat(formData.monthlyBudget) : undefined,
      contractEndDate: formData.contractEndDate || undefined,
      createdBy: user.id,
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Prospective Client</h1>
          <p className="text-muted-foreground">Add a new potential customer to your pipeline</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Client Information
          </CardTitle>
          <CardDescription>
            Fill in the details for the prospective client. Required fields are marked with *
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter client's full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+231-777-123-456"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood *</Label>
                <Select
                  value={formData.neighborhood}
                  onValueChange={(value) => handleInputChange("neighborhood", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select neighborhood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sinkor">Sinkor</SelectItem>
                    <SelectItem value="congo_town">Congo Town</SelectItem>
                    <SelectItem value="paynesville">Paynesville</SelectItem>
                    <SelectItem value="new_kru_town">New Kru Town</SelectItem>
                    <SelectItem value="monrovia_central">Monrovia Central</SelectItem>
                    <SelectItem value="west_point">West Point</SelectItem>
                    <SelectItem value="clara_town">Clara Town</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter complete address including landmarks"
                required
              />
            </div>

            {/* Service Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Service Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceInterest">Service Interest *</Label>
                  <Select
                    value={formData.serviceInterest}
                    onValueChange={(value) => handleInputChange("serviceInterest", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_internet">Home Internet</SelectItem>
                      <SelectItem value="business_internet">Business Internet</SelectItem>
                      <SelectItem value="mobile_data">Mobile Data</SelectItem>
                      <SelectItem value="voice_calls">Voice Calls</SelectItem>
                      <SelectItem value="bundle_package">Bundle Package</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bandwidthPlan">Bandwidth Plan</Label>
                  <Select
                    value={formData.bandwidthPlan}
                    onValueChange={(value) => handleInputChange("bandwidthPlan", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bandwidth" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5mbps">5 Mbps - Basic</SelectItem>
                      <SelectItem value="10mbps">10 Mbps - Standard</SelectItem>
                      <SelectItem value="25mbps">25 Mbps - Premium</SelectItem>
                      <SelectItem value="50mbps">50 Mbps - Business</SelectItem>
                      <SelectItem value="100mbps">100 Mbps - Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyBudget">Monthly Budget (USD)</Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    value={formData.monthlyBudget}
                    onChange={(e) => handleInputChange("monthlyBudget", e.target.value)}
                    placeholder="50"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentProvider">Current Provider</Label>
                  <Input
                    id="currentProvider"
                    value={formData.currentProvider}
                    onChange={(e) => handleInputChange("currentProvider", e.target.value)}
                    placeholder="e.g., Orange, MTN, Lonestar"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Lead Source</Label>
                  <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field_visit">Field Visit</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="contractEndDate">Current Contract End Date</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => handleInputChange("contractEndDate", e.target.value)}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="installationSite">Installation Site Details</Label>
                <Textarea
                  id="installationSite"
                  value={formData.installationSite}
                  onChange={(e) => handleInputChange("installationSite", e.target.value)}
                  placeholder="Describe the installation location, accessibility, etc."
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional information about the client or requirements"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !formData.fullName ||
                  !formData.phone ||
                  !formData.address ||
                  !formData.neighborhood ||
                  !formData.serviceInterest
                }
                className="bg-primary text-primary-foreground"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Client
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
