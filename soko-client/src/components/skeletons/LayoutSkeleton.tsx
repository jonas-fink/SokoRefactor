const SideBarSkeleton = () => (
    <div className="flex flex-col p-8 gap-8 bg-surface min-h-screen animate-pulse">
        <div className="flex items-center gap-2">
            <div className="w-22 h-22 rounded-full bg-elevated" />
            <div className="h-6 w-20 rounded bg-elevated" />
        </div>
        <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-elevated" />
            ))}
        </div>
    </div>
);

const LayoutSkeleton = () => {
    return (
        <div className="grid grid-cols-4 min-h-screen antialiased gap-8">
            <div className="col-span-1">
                <SideBarSkeleton />
            </div>
            <div className="col-span-3 pt-8 animate-pulse">
                <div className="h-8 w-1/3 rounded bg-elevated mb-6" />
                <div className="grid grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-video rounded-xl bg-elevated"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LayoutSkeleton;
