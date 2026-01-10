"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, User, FolderKanban } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SearchResult {
    type: "user" | "project"
    id: string
    title: string
    subtitle?: string
}

export function GlobalSearchBar() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const router = useRouter()
    const searchRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Search function
    useEffect(() => {
        const searchAll = async () => {
            if (query.trim().length < 2) {
                setResults([])
                setIsOpen(false)
                return
            }

            const searchResults: SearchResult[] = []

            // Search users
            const { data: users } = await supabase
                .from("profiles")
                .select("id, username, display_name")
                .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
                .limit(5)

            if (users) {
                users.forEach(user => {
                    searchResults.push({
                        type: "user",
                        id: user.id,
                        title: user.display_name || user.username,
                        subtitle: user.username
                    })
                })
            }

            // Search projects
            const { data: projects } = await supabase
                .from("projects")
                .select("id, title, status")
                .ilike("title", `%${query}%`)
                .limit(5)

            if (projects) {
                projects.forEach(project => {
                    searchResults.push({
                        type: "project",
                        id: project.id,
                        title: project.title,
                        subtitle: project.status
                    })
                })
            }

            setResults(searchResults)
            setIsOpen(searchResults.length > 0)
            setSelectedIndex(0)
        }

        const debounce = setTimeout(searchAll, 300)
        return () => clearTimeout(debounce)
    }, [query])

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % results.length)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        } else if (e.key === "Enter" && results[selectedIndex]) {
            e.preventDefault()
            handleSelect(results[selectedIndex])
        } else if (e.key === "Escape") {
            setIsOpen(false)
        }
    }

    const handleSelect = (result: SearchResult) => {
        if (result.type === "user") {
            router.push(`/users/${result.id}`)
        } else {
            router.push(`/projects/${result.id}`)
        }
        setQuery("")
        setIsOpen(false)
    }

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users or projects..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-4"
                />
            </div>

            {/* Results dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {results.map((result, index) => (
                        <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleSelect(result)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0",
                                selectedIndex === index && "bg-muted"
                            )}
                        >
                            <div className="flex-shrink-0">
                                {result.type === "user" ? (
                                    <User className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <FolderKanban className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-medium truncate">{result.title}</div>
                                {result.subtitle && (
                                    <div className="text-sm text-muted-foreground truncate">
                                        {result.subtitle}
                                    </div>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize flex-shrink-0">
                                {result.type}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
