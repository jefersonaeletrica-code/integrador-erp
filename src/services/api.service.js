import axios from 'axios';
import https from 'https';

export const axiosInstance = axios.create({
    timeout: 30000, // Timeout de 30 segundos
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Ignora erros de certificado SSL
});