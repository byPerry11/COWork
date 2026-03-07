"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DatePickerFieldProps {
  label: string
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  description?: string
  className?: string
  disabled?: boolean
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  description,
  className,
  disabled = false,
}: DatePickerFieldProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-[0.8rem] text-muted-foreground mt-1.5">
          {description}
        </p>
      )}
    </div>
  )
}

import { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  label: string
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  description?: string
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date range",
  description,
  className,
  disabled = false,
}: DateRangePickerProps) {
  return (
    <div className={className}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal",
              !value?.from && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "PPP")} - {format(value.to, "PPP")}
                </>
              ) : (
                format(value.from, "PPP")
              )
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {description && (
        <p className="text-[0.8rem] text-muted-foreground mt-1.5">
          {description}
        </p>
      )}
    </div>
  )
}
