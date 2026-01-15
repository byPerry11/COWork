"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export interface CalendarEvent {
    id: string
    title: string
    date: Date
    color: string
    type: 'project-deadline' | 'meeting' | 'other'
    link?: string
}

interface CalendarWidgetProps {
    events?: CalendarEvent[]
}

export function CalendarWidget({ events = [] }: CalendarWidgetProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const router = useRouter() // Need to import useRouter

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const today = new Date()
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

    const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

    // Helper to get events for a specific day
    const getEventsForDay = (day: number) => {
        return events.filter(event => {
            const eventDate = new Date(event.date)
            return eventDate.getDate() === day &&
                eventDate.getMonth() === month &&
                eventDate.getFullYear() === year
        })
    }

    const calendarDays = []

    // Empty cells
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="p-2 min-h-[40px]" />)
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day)
        const isToday = isCurrentMonth && today.getDate() === day
        const dayEvents = getEventsForDay(day)
        const hasEvents = dayEvents.length > 0

        calendarDays.push(
            <Popover key={day}>
                <PopoverTrigger asChild>
                    <div
                        className={cn(
                            "relative p-1 min-h-[40px] flex flex-col items-center justify-start rounded-lg transition-all cursor-pointer group",
                            isToday
                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                : "hover:bg-muted/50",
                            hasEvents && !isToday && "bg-muted/10"
                        )}
                    >
                        <span className={cn(
                            "text-sm w-6 h-6 flex items-center justify-center rounded-full",
                            isToday && "bg-primary text-primary-foreground"
                        )}>
                            {day}
                        </span>

                        {/* Event Dots */}
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-1">
                            {dayEvents.slice(0, 4).map((evt, idx) => (
                                <div
                                    key={idx}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: evt.color }}
                                />
                            ))}
                            {dayEvents.length > 4 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                            )}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="center">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-sm">
                                {dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h4>
                            <span className="text-xs text-muted-foreground">{dayEvents.length} events</span>
                        </div>
                        
                        {dayEvents.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2 text-center">No events for this day</p>
                        ) : (
                            <div className="space-y-2">
                                {dayEvents.map(evt => (
                                    <div 
                                        key={evt.id} 
                                        onClick={() => evt.link && router.push(evt.link)}
                                        className={cn(
                                            "flex items-start gap-2 p-2 rounded-md transition-colors",
                                            evt.link ? "hover:bg-muted cursor-pointer" : ""
                                        )}
                                    >
                                        <div 
                                            className="w-2 h-2 mt-1.5 rounded-full shrink-0" 
                                            style={{ backgroundColor: evt.color }} 
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-none truncate">{evt.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 capitalize">{evt.type.replace('-', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        {MONTHS[month]} {year}
                    </CardTitle>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={previousMonth}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={nextMonth}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                {/* Days of week header */}
                <div className="grid grid-cols-7 mb-2">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground pb-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 auto-rows-fr">
                    {calendarDays}
                </div>
            </CardContent>
        </Card>
    )
}
