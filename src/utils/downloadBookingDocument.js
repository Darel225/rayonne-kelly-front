import api from '../services/api';

export const downloadBookingDocument = async (id, reference, type) => {
  try {
    const response = await api.get(`/bookings/${id}/document`, { 
      responseType: 'blob' 
    });

    const blob = new Blob([response], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    // type is either 'validated' (Confirmation) or 'completed' (Facture)
    const prefix = type === 'completed' ? 'Facture' : 'Confirmation';
    link.download = `${prefix}-${reference}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (err) {
    let errorMessage = "Une erreur est survenue lors du téléchargement.";
    
    // Parse Blob error response
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const errorData = JSON.parse(text);
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseErr) {
        // Fallback to standard HTTP status messages if parsing fails
        if (err.response.status === 403) errorMessage = "Accès non autorisé au document.";
        if (err.response.status === 404) errorMessage = "Document introuvable.";
      }
    } else if (err.response) {
      if (err.response.status === 403) errorMessage = "Accès non autorisé au document.";
      if (err.response.status === 404) errorMessage = "Document introuvable.";
      if (err.response.data?.error) errorMessage = err.response.data.error;
      else if (err.response.data?.message) errorMessage = err.response.data.message;
    }
    
    return { success: false, message: errorMessage, status: err.response?.status };
  }
};
