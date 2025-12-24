/**
 * Focus Guard - Background Service Worker
 * Minimal background script for the extension
 */

chrome.runtime.onInstalled.addListener(() => {
    console.log('Focus Guard installed');
});
