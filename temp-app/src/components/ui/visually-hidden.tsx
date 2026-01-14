"use client"

import * as React from "react"

/**
 * VisuallyHidden component for accessibility
 * Hides content visually but keeps it available for screen readers
 */
function VisuallyHidden({
    children,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
    return (
        <span
            {...props}
            style={{
                position: "absolute",
                border: 0,
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: "hidden",
                clip: "rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                wordWrap: "normal",
                ...props.style,
            }}
        >
            {children}
        </span>
    )
}

export { VisuallyHidden }
