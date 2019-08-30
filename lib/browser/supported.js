/**
 * This file is included in the main bundle. Its main purpose is to find out if the main bundle could execute,
 * or if it errored out due to a Syntax Error since the main bundle is only compiled against a specific list
 * of browsers.
 * The unsupported.js script is included as another script tag and relies on this variable.
 */
window.supported = true;
