"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isSameDay, format } from "date-fns"

interface ProjectCalendarProps {
    startDate: Date
    endDate?: Date
    className?: string
}

export function ProjectCalendar({ startDate, endDate, className }: ProjectCalendarProps) {
    // Create an array of modifier dates for highlighting
    const modifiers = {
        start: startDate,
        end: endDate || undefined,
        projectRange: endDate ? { from: startDate, to: endDate } : undefined
    }

    // Styles for modifiers
    const modifiersStyles = {
        start: { color: 'white', backgroundColor: '#22c55e' }, // Green
        end: { color: 'white', backgroundColor: '#ef4444' },   // Red
        projectRange: { color: 'inherit', backgroundColor: 'var(--accent)' }
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                    Project Timeline
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col items-center">
                <Calendar
                    mode="single"
                    selected={new Date()} // Highlight today slightly
                    defaultMonth={startDate}
                    modifiers={{
                        start: startDate,
                        ...(endDate ? { end: endDate } : {})
                    }}
                    modifiersClassNames={{
                        start: "bg-green-500 text-white hover:bg-green-600 rounded-md",
                        end: "bg-red-500 text-white hover:bg-red-600 rounded-md"
                    }}
                    className="rounded-md border shadow-sm w-full flex justify-center p-2"
                />

                <div className="flex flex-col gap-2 mt-4 w-full text-xs text-muted-foreground px-2">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Start: {format(startDate, "PP")}
                        </span>
                    </div>
                    {endDate && (
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                End: {format(endDate, "PP")}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
