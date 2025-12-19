/**
 * Централизованный API сервис
 */
class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        // Формируем URL: если baseUrl относительный, используем текущий протокол
        let url = `${this.baseUrl}${endpoint}`;
        
        // Если baseUrl относительный (начинается с '/'), формируем абсолютный URL с текущим протоколом
        if (this.baseUrl.startsWith('/')) {
            // Принудительно используем HTTPS, если страница открыта по HTTPS
            const protocol = window.location.protocol === 'https:' ? 'https:' : window.location.protocol;
            const origin = `${protocol}//${window.location.host}`;
            url = `${origin}${this.baseUrl}${endpoint}`;
        }
        
        // Если где-то сформировался URL с http://, принудительно заменяем на https://
        if (url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
        }
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Если ответ не JSON, возвращаем текстовое сообщение
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(text || `HTTP error! status: ${response.status}`);
                }
                return { success: true, message: text };
            }
            
            // Проверяем статус ответа
            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw new Error(`Не удалось выполнить запрос: ${error.message}`);
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Создаем экземпляр API сервиса
const api = new ApiService(CONFIG.API_BASE_URL);

