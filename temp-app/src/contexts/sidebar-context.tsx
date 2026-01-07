"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
    isOpen: boolean
    toggle: () => void
    open: () => void
    close: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true)

    // Close sidebar by default on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsOpen(false)
            } else {
                setIsOpen(true)
            }
        }

        // Set initial state
        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const toggle = () => setIsOpen(prev => !prev)
    const open = () => setIsOpen(true)
    const close = () => setIsOpen(false)

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
