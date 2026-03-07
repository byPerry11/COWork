"use client"

import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Sin conexión</h1>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Parece que no tienes conexión a internet. Verifica tu conexión e
        intenta de nuevo.
      </p>
      <Button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  )
}
