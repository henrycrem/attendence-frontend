"use client"

import { QueryProvider } from "../providers/query-provider"
import { Toaster } from "@/components/ui/sonner"
import { Provider } from "react-redux"
import { store } from "../store"
import { AuthProvider } from "../contexts/AuthContext"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <QueryProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              style: {
                borderRadius: "10px",
                background: "#5ea717",
                color: "#fff",
              },
              success: {
                duration: 3000,
                style: {
                  background: "#10b981",
                  color: "#fff",
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: "#ef4444",
                  color: "#fff",
                },
              },
            }}
          />
          {children}
        </QueryProvider>
      </AuthProvider>
    </Provider>
  )
}
