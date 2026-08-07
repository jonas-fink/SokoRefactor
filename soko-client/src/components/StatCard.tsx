import { useCountUp } from '../hooks/useCountUp';

interface StateCardProps {
    title: string;
    count: number;
    description?: string;
    className?: string;
}
const StatCard = ({
    title,
    count,
    description,
    className = '',
}: StateCardProps) => {
    const animatedCount = useCountUp(count, 1800);

    return (
        <div className={`stat-card ${className}`}>
            <h3 className="text-sm font-medium text-ink">{title}</h3>
            <div className="mt-2 flex items-baseline gap-1">
                <span className="stat-value text-4xl font-bold tracking-tight font-mono">
                    {animatedCount}
                </span>
            </div>
            {description && (
                <p className="mt-2 text-xs text-ink-soft">{description}</p>
            )}
        </div>
    );
};

export default StatCard;
