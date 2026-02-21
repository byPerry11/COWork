"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Trash2, Smartphone, Monitor, Globe } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
// UAParser removed to fix build error
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Subscription {
  id: string
  endpoint: string
  user_agent: string | null
  created_at: string
  updated_at: string
}

export function PushDeviceList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current subscription endpoint to identify "This Device"
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription()
        if (sub) {
          setCurrentEndpoint(sub.endpoint)
        }
      }

      const response = await fetch(`/api/push/subscriptions?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, endpoint: string) => {
    try {
      setDeletingId(id)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/push/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userId: user.id })
      })

      if (response.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== id))
        toast.success("Device removed")

        // If we removed the current device, we should update the Service Worker state locally
        if (endpoint === currentEndpoint) {
          const registration = await navigator.serviceWorker.ready
          const sub = await registration.pushManager.getSubscription()
          if (sub) {
            await sub.unsubscribe()
          }
        }
      } else {
        toast.error("Failed to remove device")
      }
    } catch (error) {
      console.error('Error removing device:', error)
      toast.error("Error removing device")
    } finally {
      setDeletingId(null)
    }
  }

  const getDeviceIcon = (uaString: string) => {
    if (!uaString) return <Monitor className="h-5 w-5" />
    const ua = uaString.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
      return <Smartphone className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const getDeviceName = (uaString: string) => {
    if (!uaString) return "Unknown Device"
    if (uaString.includes('Windows')) return "Windows PC"
    if (uaString.includes('Macintosh')) return "Mac"
    if (uaString.includes('Android')) return "Android Device"
    if (uaString.includes('iPhone')) return "iPhone"
    return "Browser"
  }

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  if (subscriptions.length === 0) {
    return <div className="text-center p-4 text-muted-foreground">No active devices found.</div>
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => {
        const isCurrentDevice = sub.endpoint === currentEndpoint

        return (
          <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-full">
                {sub.user_agent ? getDeviceIcon(sub.user_agent) : <Globe className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {sub.user_agent ? getDeviceName(sub.user_agent) : "Unknown Device"}
                  </p>
                  {isCurrentDevice && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last active: {formatDistanceToNow(new Date(sub.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(sub.id, sub.endpoint)}
              disabled={deletingId === sub.id}
            >
              {deletingId === sub.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )
      })}
    </div>
  )
}
