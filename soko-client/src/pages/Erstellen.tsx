import { useState } from 'react';
import ActivityForm from '../components/erstellen/ActivityForm';
import BeratungsForm from '../components/erstellen/BeratungsForm';
import { RiArrowLeftLine } from 'react-icons/ri';
import { AiOutlinePlusCircle } from 'react-icons/ai';
import { useAuth } from '../context/auth-context';

type UserChoice = 'Event erstellen' | 'Beratungsangebot erstellen';

const Erstellen = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [userChoice, setUserChoice] = useState<UserChoice | null>(null);
    // Beratungsangebote sind admin-only — alle anderen sehen direkt das
    // Event-Formular statt einer Auswahl mit nur einer Option.
    const choice = isAdmin ? userChoice : 'Event erstellen';

    return (
        <div className="flex flex-col gap-6 md:max-w-6xl md:p-8 mx-auto">
            {choice === null && (
                <div className="flex gap-4">
                    <button
                        className="card events cursor-pointer font-bold text-3xl"
                        onClick={() => setUserChoice('Event erstellen')}
                    >
                        Event erstellen
                        <AiOutlinePlusCircle
                            size={48}
                            className="hover:text-error transition-all duration-300 ease-in"
                        />
                    </button>

                    <button
                        className="card beratung cursor-pointer font-bold text-3xl"
                        onClick={() =>
                            setUserChoice('Beratungsangebot erstellen')
                        }
                    >
                        Beratung erstellen
                        <AiOutlinePlusCircle
                            size={48}
                            className="hover:text-error transition-all duration-300 ease-in"
                        />
                    </button>
                </div>
            )}

            {choice === 'Event erstellen' && (
                <>
                    {isAdmin && (
                        <RiArrowLeftLine
                            size={32}
                            onClick={() => setUserChoice(null)}
                            className="cursor-pointer"
                        />
                    )}
                    <ActivityForm />
                </>
            )}

            {isAdmin && choice === 'Beratungsangebot erstellen' && (
                <>
                    <RiArrowLeftLine
                        size={32}
                        onClick={() => setUserChoice(null)}
                        className="cursor-pointer"
                    />
                    <BeratungsForm />
                </>
            )}
        </div>
    );
};

export default Erstellen;
