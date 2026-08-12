import { useState, useEffect } from 'react';

export const useCountUp = (targetValue: number, duration: number = 1500) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (targetValue === 0) {
            setCount(0);
            return;
        }
        let startTimestamp: number | null = null;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min(
                (timestamp - startTimestamp) / duration,
                1,
            );

            const easeOutQuad = 1 - Math.pow(1 - progress, 3);

            setCount(Math.floor(easeOutQuad * targetValue));

            if (progress < 1) {
                // Handle nachziehen, sonst cancelt das Cleanup nur den ersten
                // Frame und die Rekursion laeuft nach Unmount weiter.
                frame = window.requestAnimationFrame(step);
            } else {
                setCount(targetValue);
            }
        };

        let frame = window.requestAnimationFrame(step);

        return () => window.cancelAnimationFrame(frame);
    }, [targetValue, duration]);

    return count;
};
