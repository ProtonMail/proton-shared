// eslint-disable-next-line import/no-unresolved
import unsupportedBrowser from 'design-system/assets/img/shared/unsupported-browser.svg';

const showUnsupported = () => {
    const isProtonVPN = (document.location.origin || document.location.href).indexOf('protonvpn') !== -1;
    const kbUrl = isProtonVPN
        ? 'https://protonvpn.com/support/browsers-supported/'
        : 'https://protonmail.com/support/knowledge-base/browsers-supported/';

    document.body.innerHTML = `
        <div class="w50 p2 mt2 center big automobile">
            <div class="aligncenter">
                <h1>Unsupported browser</h1>
                <p>
                    You are using an unsupported browser. Please update it to the latest version or use a different browser.
                </p>
                <a class="primary-link bold" target="_blank" rel="noopener noreferrer" href="${kbUrl}">More info</a>
            </div>
            <div class="mt2 aligncenter">
                <img src=${unsupportedBrowser} alt="Unsupported browser"/>
            </div>
        </div>
    `;

    document.title = 'Unsupported browser';
};

if (!window.protonSupportedBrowser) {
    showUnsupported();
}
