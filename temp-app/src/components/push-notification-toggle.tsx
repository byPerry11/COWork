"use client"

import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { Loader2 } from "lucide-react"

export function PushNotificationToggle() {
  const {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  const getStatusBadge = () => {
    if (permission === 'denied') {
      return <Badge variant="destructive">Blocked</Badge>
    }
    if (isSubscribed) {
      return <Badge variant="default" className="bg-green-500">Enabled</Badge>
    }
    return <Badge variant="secondary">Disabled</Badge>
  }

  const getStatusDescription = () => {
    if (permission === 'denied') {
      return "You've blocked notifications. Please enable them in your browser settings."
    }
    if (isSubscribed) {
      return "You'll receive real-time notifications for friend requests, project invites, and more."
    }
    return "Enable notifications to stay updated on friend requests, project invites, and checkpoint updates."
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Push Notifications</CardTitle>
            {getStatusBadge()}
          </div>
          <Button
            variant={isSubscribed ? "outline" : "default"}
            size="sm"
            onClick={handleToggle}
            disabled={loading || permission === 'denied'}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isSubscribed ? (
              <BellOff className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            {isSubscribed ? "Disable" : "Enable"}
          </Button>
        </div>
        <CardDescription>
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>
      {permission === 'denied' && (
        <CardContent>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">How to enable:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions list</li>
              <li>Change it from "Block" to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
