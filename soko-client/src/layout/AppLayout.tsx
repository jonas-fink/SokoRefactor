import { Outlet } from 'react-router';
import { useEffect } from 'react';
import SideBar from '../components/layout/SideBar';

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
        <div className="flex flex-col min-h-screen antialiased md:grid md:grid-cols-4 md:gap-8">
            <div className="order-2 sticky bottom-0 z-10 md:order-1 md:col-span-1 md:top-0 md:h-screen">
                <SideBar />
            </div>
            <div className="order-1 flex-1 px-4 pt-8 md:order-2 md:col-span-3 md:pr-8 md:pl-0">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
