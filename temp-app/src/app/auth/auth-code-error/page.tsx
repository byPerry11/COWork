"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, Home } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const errorCode = searchParams.get('error_code')

  return (
    <Card className="w-full max-w-md border-destructive/50 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
        <CardDescription>
          {errorDescription || "We encountered a problem signing you in."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(error || errorCode) && (
          <div className="rounded-md bg-muted p-3 text-xs font-mono">
            {error && <p><span className="font-bold">Error:</span> {error}</p>}
            {errorCode && <p><span className="font-bold">Code:</span> {errorCode}</p>}
          </div>
        )}

        <div className="text-center text-muted-foreground text-sm">
          <p>Common causes for this error:</p>
          <ul className="mt-2 list-disc pl-5 text-left space-y-1">
            <li>Google login was cancelled or permissions were declined</li>
            <li>The authentication URL has expired</li>
            <li>There is a configuration issue with the Google provider</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button asChild variant="default" className="w-full">
          <Link href="/login">
            <Home className="mr-2 h-4 w-4" />
            Return to Login
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={<div>Loading error details...</div>}>
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
