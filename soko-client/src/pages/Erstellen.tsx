import { useState } from 'react';
import ActivityForm from '../components/erstellen/ActivityForm';
import BeratungsForm from '../components/erstellen/BeratungsForm';

type UserChoice = 'Event erstellen' | 'Beratungsangebot erstellen';

const Erstellen = () => {
    const [userChoice, setUserChoice] = useState<UserChoice | null>(null);

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl px-4 min-h-screen mx-auto mb-8">
            {userChoice === null && (
                <div className="flex gap-4">
                    <div className="card bg-brand flex flex-col justify-center items-center w-1/2 shadow-card p-8 cursor-pointer">
                        <button
                            className="font-display text-4xl text-ink self-center"
                            onClick={() => setUserChoice('Event erstellen')}
                        >
                            Event erstellen
                        </button>
                    </div>
                    <div className="card bg-warning flex flex-col justify-center items-center w-1/2 shadow-card p-8 cursor-pointer">
                        <button
                            className="font-display text-4xl text-ink self-center"
                            onClick={() =>
                                setUserChoice('Beratungsangebot erstellen')
                            }
                        >
                            Beratungsangebot erstellen
                        </button>
                    </div>
                </div>
            )}

            {userChoice === 'Event erstellen' && <ActivityForm />}

            {userChoice === 'Beratungsangebot erstellen' && <BeratungsForm />}
        </div>
    );
};

export default Erstellen;
