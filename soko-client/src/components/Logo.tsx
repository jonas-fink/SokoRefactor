import logoLight from '../assets/ksoko-logo.png';
import logoDark from '../assets/ksoko-logo-dark-transparent.png';

// zwei <img> mit dark:-Variante statt Theme-Hook — das Theme hängt
// als .dark-Klasse am <html> (siehe index.html), das kann CSS allein.
// Höhe kommt aus dem Bild selbst (h-auto), nicht hartcodiert — sonst
// verzerrt jeder Re-Export mit anderem Seitenverhältnis das Logo.
const Logo = ({ width = 120 }: { width?: number }) => {
    const props = { width, alt: 'KSoKo — Kassel Sozial Kompass' };
    return (
        <>
            <img src={logoLight} {...props} className="h-auto dark:hidden" />
            <img
                src={logoDark}
                {...props}
                className="hidden h-auto dark:block"
            />
        </>
    );
};

export default Logo;
