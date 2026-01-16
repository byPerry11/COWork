import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, Home } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            We encountered a problem signing you in with Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm">
          <p>This could happen if:</p>
          <ul className="mt-2 list-disc pl-5 text-left space-y-1">
            <li>Review permissions were declined or expired</li>
            <li>The login session timed out</li>
            <li>There was a configuration mismatch</li>
          </ul>
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
    </div>
  )
}
