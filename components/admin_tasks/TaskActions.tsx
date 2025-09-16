
"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreHorizontal, Trash, MapPin } from "lucide-react"

type Props = {
  taskId: string
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onShowLocation?: (id: string) => void
}

export const TaskActions = ({ taskId, onView, onEdit, onDelete, onShowLocation }: Props) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 p-0">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(taskId)}>
          <Eye className="size-4 mr-2 cursor-pointer" />
          View Details
        </DropdownMenuItem>
        
        {onShowLocation && (
          <DropdownMenuItem onClick={() => onShowLocation(taskId)}>
            <MapPin className="size-4 mr-2 cursor-pointer" />
            Show Location
          </DropdownMenuItem>
        )}

        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(taskId)}>
            <Edit className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}

        {onDelete && (
          <DropdownMenuItem onClick={() => onDelete(taskId)} className="text-destructive">
            <Trash className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}