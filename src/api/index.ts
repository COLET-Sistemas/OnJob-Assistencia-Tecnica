import api, {
  API_CONFIG,
  createHeaders,
  getToken,
  buildQueryString,
} from "./api";
import * as services from "./services";

// Exportações
export { api, API_CONFIG, createHeaders, getToken, buildQueryString, services };

// Exportação padrão
export default api;
