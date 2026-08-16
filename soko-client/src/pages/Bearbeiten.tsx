import ActivityForm from '../components/erstellen/ActivityForm';
import BeratungsForm from '../components/erstellen/BeratungsForm';

/**
 * Bearbeiten benutzt dieselben Formulare wie das Anlegen — sie erkennen an der
 * `:id` in der URL, dass sie laden und per PUT speichern statt anzulegen. Eine
 * zweite Formularkomponente waere eine Kopie mit doppeltem Pflegeaufwand.
 */
const Bearbeiten = ({ art }: { art: 'aktivitaet' | 'beratung' }) => (
    <div className="mx-auto flex flex-col gap-6 md:max-w-6xl md:p-8">
        {art === 'aktivitaet' ? <ActivityForm /> : <BeratungsForm />}
    </div>
);

export default Bearbeiten;
