import { z } from "zod"

// Define the base schema object without refinements
const baseEmployeeObjectSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  // Password is optional by default, but will be conditionally required by superRefine for new employees
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional().or(z.literal("")),
  position: z.string().min(2, { message: "Position must be at least 2 characters." }),
  departmentId: z.string().min(1, { message: "Department is required." }),
  roleId: z.string().min(1, { message: "Role is required." }),
  hireDate: z.date().nullable().optional(),
})

// employeeFormSchema (for creation, with conditional password requirement)
export const employeeFormSchema = baseEmployeeObjectSchema.superRefine((data, ctx) => {
  // Custom validation for password: required if not editing (i.e., hireDate is null/undefined)
  if (!data.hireDate && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password is required for new employees.",
      path: ["password"],
    })
  }
})


export const employeeCreationSchema = z.object({
  userId: z.string().min(1, "User is required"),
  hireDate: z.date().nullable().optional(),
  salary: z.number().positive().optional().nullable(),
  departmentId: z.string().optional().nullable(),
})


// employeeUpdateFormSchema (for updates, all fields optional, password remains optional)
export const employeeUpdateFormSchema = baseEmployeeObjectSchema.partial()


