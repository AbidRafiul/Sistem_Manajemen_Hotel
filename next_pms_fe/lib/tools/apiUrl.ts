/**
 * Helper untuk normalisasi backend API_URL
 * Memastikan bahwa path selalu memiliki akhiran /api/v1 tanpa trailing slash duplikat
 */
export const getBackendApiUrl = (): string => {
    let url = (process.env.API_URL || 'http://localhost:8000/api/v1').trim().replace(/\/+$/, '');
    if (!url.endsWith('/api/v1')) {
        url = `${url}/api/v1`;
    }
    return url;
};
