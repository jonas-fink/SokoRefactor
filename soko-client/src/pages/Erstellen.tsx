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
        <div className="flex flex-col gap-8 w-full max-w-4xl px-4 min-h-screen mx-auto mb-8">
            {choice === null && (
                <div className="flex gap-4">
                    <button
                        className="card bg-primary flex h-50 flex-col justify-center items-center w-1/2 shadow-card p-8 cursor-pointer font-display text-4xl text-ink self-center gap-4"
                        onClick={() => setUserChoice('Event erstellen')}
                    >
                        Event erstellen
                        <AiOutlinePlusCircle
                            size={48}
                            className="hover:text-primary-ink transition-all duration-300 ease-in"
                        />
                    </button>

                    <button
                        className="card bg-warning flex h-50 flex-col justify-center items-center w-1/2 shadow-card p-8 cursor-pointer font-display text-4xl text-primary-ink self-center gap-4"
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
