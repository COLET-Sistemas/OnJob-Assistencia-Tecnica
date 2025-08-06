import { API_CONFIG, createHeaders, getToken } from './config';
import api from './httpClient';
import * as services from './services';

// Exportações
export { api, API_CONFIG, createHeaders, getToken, services };

// Exportação padrão
export default api;
