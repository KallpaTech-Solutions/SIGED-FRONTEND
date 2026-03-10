const config = {
    // Solo cambias esta línea al desplegar a la nube de la UNAS
    API_URL: import.meta.env.VITE_API_URL 
};

console.log("Configuración cargada:", config.API_URL);
export default config;