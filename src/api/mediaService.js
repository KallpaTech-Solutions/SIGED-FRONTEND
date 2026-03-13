import api from "./axiosConfig";

/**
 * Sube múltiples archivos (fotos/videos) al servidor.
 * @param {FileList|File[]} files - Lista de archivos del input.
 * @param {(percent:number)=>void} [onProgress] - Callback de progreso (0-100).
 * @returns {Promise<string[]>} - Array de URLs devueltas por el backend.
 */
export async function uploadMediaFiles(files, onProgress) {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) return [];

  const formData = new FormData();
  
  // Límite de 50MB coincidiendo con tu Supabase
  const MAX_SIZE = 50 * 1024 * 1024; 

  for (const file of fileList) {
    if (file.size > MAX_SIZE) {
      alert(`El archivo ${file.name} es demasiado grande. El máximo permitido es 50MB.`);
      return [];
    }
    // IMPORTANTE: El backend espera la clave "files"
    formData.append("files", file);
  }

  try {
    const token = localStorage.getItem("token");

    const { data } = await api.post("/Media/upload-noticia", formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // IMPORTANTE: No definas 'Content-Type', Axios lo hace por ti con el boundary
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      },
    });

    // Tu controlador devuelve { urls: ["url1", "url2"] }
    return data.urls || [];
  } catch (error) {
    console.error("Error en uploadMediaFiles:", error.response?.data || error.message);
    
    const mensaje = error.response?.data?.message || "Error al conectar con el servidor de medios.";
    alert(`Error: ${mensaje}`);
    
    throw error;
  }
}