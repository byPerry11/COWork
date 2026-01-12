"use client"

import { useEffect, useState } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import Image from "next/image"

export function NotificationPermissionPrompter() {
    const { permission, subscribe, loading, isSupported } = usePushNotifications()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // If supported and permission is default (not asked yet), show prompt
        // We can check local storage to see if they deferred it recently to avoid spamming
        const hasDeferred = localStorage.getItem("notification_prompt_deferred")
        
        if (isSupported && permission === 'default' && !hasDeferred) {
            // Add a small delay so it doesn't pop up INSTANTLY on load
            const timer = setTimeout(() => setIsOpen(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [isSupported, permission])

    const handleEnable = async () => {
        const success = await subscribe()
        if (success) {
            setIsOpen(false)
        }
    }

    const handleDefer = () => {
        setIsOpen(false)
        // Defer for session or store timestamp? For now just mark deferred
        localStorage.setItem("notification_prompt_deferred", "true")
    }

    if (!isSupported || permission === 'granted' || permission === 'denied') {
        return null
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader className="flex flex-col items-center gap-4">
                    {/* Cow Image Container with dark background circle for visibility of white image */}
                    <div className="bg-primary/90 h-24 w-24 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background">
                        <Image 
                            src="/onlycow-white.png" 
                            alt="OnlyCow" 
                            width={64} 
                            height={64} 
                            className="object-contain"
                        />
                    </div>
                    
                    <DialogTitle className="text-xl">Enable Notifications?</DialogTitle>
                    <DialogDescription className="text-base">
                        Get instant updates on friend requests, project invites, and task assignments.
                        <br />
                        <span className="text-xs text-muted-foreground mt-2 block">
                            We promise not to spam you. You can turn this off anytime.
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-center mt-2">
                    <Button variant="ghost" onClick={handleDefer} className="sm:w-auto w-full">
                        Maybe Later
                    </Button>
                    <Button onClick={handleEnable} disabled={loading} className="sm:w-auto w-full gap-2">
                        <Bell className="h-4 w-4" />
                        Enable Notifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
