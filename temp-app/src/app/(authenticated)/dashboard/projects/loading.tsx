import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectsLoading() {
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-background">
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-24 md:pb-6">
                    {/* Header Area */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Skeleton className="h-9 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Skeleton className="h-10 w-full md:w-[150px]" />
                        </div>
                    </div>

                    {/* Projects Listing Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-[220px] w-full rounded-xl" />
                        ))}
                    </div>

                     {/* Stats Area */}
                     <div className="mt-8 space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-xl" />
                            ))}
                        </div>
                     </div>
                </div>
            </main>
        </div>
    )
}
