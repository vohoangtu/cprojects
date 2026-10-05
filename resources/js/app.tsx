import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

const appName = 'MCMS - SDLC Governance';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob<any>('./Pages/**/*.tsx')),
    setup({ el, App, props }: any) {
        if (el) {
            const root = createRoot(el);
            root.render(<App {...props} />);
        }
    },
    progress: {
        color: '#0066ff',
        showSpinner: true,
    },
});
