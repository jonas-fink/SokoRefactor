import { Outlet } from 'react-router';
import { useEffect } from 'react';

const AppLayout = () => {
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () =>
            document.documentElement.classList.toggle('dark', mq.matches);
        apply();
        mq.addEventListener('change', apply);
        return () => mq.removeEventListener('change', apply);
    }, []);

    return (
        <div className="flex justify-center items-center min-h-screen font-sans antialiased">
            <div className="flex flex-col gap-8 justify-center items-center">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
