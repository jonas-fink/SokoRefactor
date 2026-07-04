import React from 'react';
import { NavLink } from 'react-router';
import mainLogo from '../../assets/logo.png';
import { AiOutlineCompass, AiOutlineNotification } from 'react-icons/ai';
import { MdOutlineMap, MdOutlineBookmark } from 'react-icons/md';

const SideBar = () => {
    const navClass = ({
        isActive,
    }: {
        isActive: boolean;
    }) => `flex items-center gap-[11px] px-3 py-[11px] rounded-xl text-md  ${
        isActive
            ? 'font-semibold bg-[#e6f0ea] text-[#1F6B4F]'
            : 'text-[#4A554E]'
    }
`;
    return (
        <div className="flex flex-col p-8 gap-8 bg-surface min-h-screen">
            <div className="flex items-center">
                <img src={mainLogo} width={88} height={88} />
                <h1 className="text-2xl">Soko</h1>
            </div>
            <div className="flex flex-col gap-2 justify-start">
                <NavLink to="/" className={navClass}>
                    <AiOutlineCompass size={24} /> Entdecken
                </NavLink>
                <NavLink to="/beratung" className={navClass}>
                    <AiOutlineNotification size={24} /> Beratung & Hilfe
                </NavLink>
                <NavLink to="/karte" className={navClass}>
                    <MdOutlineMap size={24} /> Karte
                </NavLink>
                <NavLink to="/library" className={navClass}>
                    <MdOutlineBookmark size={24} />
                    Gespeichert
                </NavLink>
            </div>
        </div>
    );
};

export default SideBar;
