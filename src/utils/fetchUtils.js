/**
 * Utility functions for fetch operations
 */

/**
 * Extends the native fetch API with timeout capability
 * @param {string} url - The URL to fetch
 * @param {Object} options - Standard fetch options
 * @param {number} options.timeout - Timeout in milliseconds
 * @returns {Promise} - Promise that resolves with the fetch response or rejects on timeout
 */
export const fetchWithTimeout = (url, options = {}) => {
    const { timeout = 8000, ...fetchOptions } = options;

    return Promise.race([
        fetch(url, fetchOptions),
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request timed out after ${timeout}ms`));
            }, timeout);
        })
    ]);
};

/**
 * Handles JSON responses with appropriate error checking
 * @param {Response} response - The fetch Response object
 * @returns {Promise} - Promise that resolves with the parsed JSON data
 */
export const handleJsonResponse = async (response) => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
    }

    return response.json();
}; 