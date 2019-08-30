/**
 * Warning: Be careful when importing files. This file and its dependencies need to be transpiled against legacy
 * browsers. By default all files are not.
 */
import { isIE11, isSafari, getBrowser } from '../helpers/browser';

const showUnsupported = () => {
    document.body.innerHTML = `
<h1>Unsupported browser</h1>

<p>You are using an unsupported browser. Please update it to the latest version or use a different browser. <a href="https://protonmail.com/support/knowledge-base/browsers-supported/">More info</a>.</p>
`;
};

const isNotSupported = () => {
    const browser = getBrowser();
    const major = parseInt(browser.major, 10);
    // Whatever other feature detection we want to do.
    return isIE11() || (isSafari() && major <= 10);
};

if (isNotSupported() || !window.supported) {
    showUnsupported();
}

/*
window.addEventListener('error', (event) => {
    if (event && ((event.error && event.error.name === 'SyntaxError') || event.message === 'Syntax error')) {
        showUnsupported();
    }
});
 */
