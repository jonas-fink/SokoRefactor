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
        <div className="grid grid-cols-4 min-h-screen antialiased gap-8">
            <div className="col-span-1">
                <SideBar />
            </div>
            <div className="col-span-3 pt-8">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
