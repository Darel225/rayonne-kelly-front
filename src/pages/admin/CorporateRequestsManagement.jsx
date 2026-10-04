import { useState, useEffect } from 'react';
import { Eye, CheckCircle, Search, Mail, Phone, Calendar, Home, X, Building2, Briefcase } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

export default function CorporateRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/corporate-requests?page=${page}&limit=20`);
      
      if (Array.isArray(response)) {
        setRequests(response);
        setTotalPages(1); 
      } else {
        setRequests(response?.data || response || []);
        setTotalPages(response?.pagination?.total_pages || 1);
      }
      
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement des demandes Corporate.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put(`/admin/corporate-requests/${id}/status`, { status: newStatus });
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
          <h1 className="text-2xl font-serif text-ink mb-1">Offres Entreprises (B2B)</h1>
          <p className="text-sm text-ink-muted">
            Gérez les demandes de prospection et hébergement Corporate.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
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
                <th className="px-6 py-4 font-medium">Entreprise & Contact</th>
                <th className="px-6 py-4 font-medium">Besoin Global</th>
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
                    Aucune demande d'entreprise pour le moment.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink flex items-center gap-2 mb-1">
                        <Building2 className="w-3 h-3 text-gold" /> {req.company_name}
                      </div>
                      <div className="flex items-center text-xs text-ink-muted gap-1">
                        {req.contact_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 font-medium text-ink"><Briefcase className="w-3 h-3 text-gold" /> {req.employee_count}</div>
                        {req.duration && <span>Durée: {req.duration}</span>}
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
                <h3 className="font-serif text-xl text-ink flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  {selectedRequest.company_name}
                </h3>
                <p className="text-xs text-ink-muted mt-1">Reçue le {formatDate(selectedRequest.created_at)}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Coordonnées */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">Contact de l'entreprise</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Contact RH</div>
                    <div className="text-sm font-medium text-ink">{selectedRequest.contact_name}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Téléphone</div>
                    <div className="text-sm text-ink">{selectedRequest.phone}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Email Pro</div>
                    <div className="text-sm text-ink font-medium text-royal">{selectedRequest.email}</div>
                  </div>
                </div>
              </div>

              {/* Besoins */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">Détails du besoin B2B</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Collaborateurs</div>
                    <div className="text-sm text-ink font-medium">{selectedRequest.employee_count || '-'}</div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 text-xs text-ink-muted">Durée estimée</div>
                    <div className="text-sm text-ink">{selectedRequest.duration || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Message spécifique */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-ink-muted mb-3">Besoins spécifiques & Logistique</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-ink whitespace-pre-wrap leading-relaxed">
                  {selectedRequest.specific_needs || 'Aucun besoin spécifique mentionné.'}
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
