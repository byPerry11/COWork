import { FloatingNav } from "@/components/floating-nav"

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <FloatingNav />
            <div className="md:pl-24 w-full">
                {children}
            </div>
        </>
    )
}
