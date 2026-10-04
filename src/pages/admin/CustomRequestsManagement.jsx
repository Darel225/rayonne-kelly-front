import { useState, useEffect } from 'react';
import { Eye, CheckCircle, Search, Mail, Phone, Calendar, Home, X } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export default function CustomRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/custom-requests?page=${page}&limit=20`);
      
      // L'intercepteur (api.js) renvoie directement response.data.data s'il existe.
      // Donc 'response' est soit le tableau directement, soit l'objet complet.
      if (Array.isArray(response)) {
        setRequests(response);
        // On perd la pagination à cause de l'intercepteur, on force à 1 page.
        setTotalPages(1); 
      } else {
        // Au cas où l'intercepteur ne s'est pas déclenché (par ex data est null)
        setRequests(response?.data || response || []);
        setTotalPages(response?.pagination?.total_pages || 1);
      }
      
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des demandes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/custom-requests/${id}/status`, { status: newStatus });
      toast.success('Statut mis à jour avec succès');
      setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium tracking-wide uppercase bg-blue-50 text-blue-600 border border-blue-100">Nouveau</span>;
      case 'contacted':
        return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium tracking-wide uppercase bg-amber-50 text-amber-600 border border-amber-100">Contacté</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium tracking-wide uppercase bg-gray-100 text-gray-600 border border-gray-200">Clôturé</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-ink mb-1">Recherches sur-mesure</h1>
          <p className="text-sm text-ink-muted">
            Gérez les demandes hors catalogue de vos clients VIP.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:border-gold outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Client & Contact</th>
                <th className="px-6 py-4 font-medium">Critères</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-ink-muted">
                    Chargement des demandes...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-ink-muted">
                    Aucune demande sur-mesure pour le moment.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink mb-1">{req.full_name}</div>
                      <div className="flex items-center text-xs text-ink-muted gap-1">
                        <Phone className="w-3 h-3" /> {req.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        {req.property_type && <div className="flex items-center gap-1"><Home className="w-3 h-3 text-gold" /> {req.property_type}</div>}
                        {req.budget && <span className="font-medium">{req.budget}</span>}
                        {req.preferred_location && <span> - {req.preferred_location}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-muted">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedRequest(req)} className="p-2 text-ink-muted hover:text-royal hover:bg-royal/5 rounded transition-colors" title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination logic here if totalPages > 1 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="text-xs text-ink hover:text-royal disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-xs text-ink-muted">Page {page} sur {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="text-xs text-ink hover:text-royal disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-serif text-xl text-ink">Détails de la demande</h3>
                <p className="text-xs text-ink-muted mt-1">Reçue le {formatDate(selectedRequest.created_at)}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Coordonnées */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">Coordonnées Client</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Nom</div>
                    <div className="text-sm font-medium text-ink">{selectedRequest.full_name}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">WhatsApp</div>
                    <div className="text-sm text-ink">{selectedRequest.phone}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Email</div>
                    <div className="text-sm text-ink">{selectedRequest.email || 'Non renseigné'}</div>
                  </div>
                </div>
              </div>

              {/* Critères */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">Critères de recherche</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Type de bien</div>
                    <div className="text-sm text-ink">{selectedRequest.property_type || '-'}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Quartier</div>
                    <div className="text-sm text-ink">{selectedRequest.preferred_location || '-'}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Budget</div>
                    <div className="text-sm text-ink font-medium">{selectedRequest.budget || '-'}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Durée / Date</div>
                    <div className="text-sm text-ink">{selectedRequest.duration || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-ink whitespace-pre-wrap">
                  {selectedRequest.criteria || 'Aucun message.'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-xl">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-muted">Statut actuel :</span>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <div className="flex items-center gap-2">
                {selectedRequest.status !== 'contacted' && (
                  <button 
                    onClick={() => updateStatus(selectedRequest.id, 'contacted')}
                    className="px-4 py-2 text-xs font-medium bg-white border border-gray-200 text-ink rounded hover:bg-gray-50 transition-colors"
                  >
                    Marquer "Contacté"
                  </button>
                )}
                {selectedRequest.status !== 'closed' && (
                  <button 
                    onClick={() => updateStatus(selectedRequest.id, 'closed')}
                    className="px-4 py-2 text-xs font-medium bg-night text-white rounded hover:bg-night-light transition-colors"
                  >
                    Clôturer la demande
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
