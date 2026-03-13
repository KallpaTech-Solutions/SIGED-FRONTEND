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
  const MAX_SIZE = 50 * 1024 * 1024; 

  for (const file of fileList) {
    if (file.size > MAX_SIZE) {
      alert(`El archivo ${file.name} es demasiado grande (Máx 50MB).`);
      return [];
    }
    // El nombre "files" debe ser igual al parámetro del controlador
    formData.append("files", file); 
  }

  try {
    const token = localStorage.getItem("token");

    const { data } = await api.post("/Media/upload-noticia", formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        // 🔥 TRUCO: Eliminamos explícitamente el Content-Type por si axiosConfig lo tiene por defecto
        'Content-Type': undefined 
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        const percent = Math.round((event.loaded * 100) / event.total);
        onProgress(percent);
      },
    });

    return data.urls || [];
  }catch (error) {
    console.error("Error en uploadMediaFiles:", error.response?.data || error.message);
    
    const mensaje = error.response?.data?.message || "Error al conectar con el servidor de medios.";
    alert(`Error: ${mensaje}`);
    
    throw error;
  }
}