import * as Sentry from '@sentry/browser';

const isLocalhost = () => document.location.origin.includes('localhost:');

function main({ SENTRY_DSN, COMMIT_RELEASE, APP_VERSION }) {
    // No need to configure it if we don't load the DSN
    if (!SENTRY_DSN || isLocalhost()) {
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        release: COMMIT_RELEASE,
        environment: document.location.origin
    });

    Sentry.configureScope((scope) => {
        scope.setTag('appVersion', APP_VERSION);
    });
}

export const traceError = (e) => !isLocalhost() && Sentry.captureException(e);

export default main;
