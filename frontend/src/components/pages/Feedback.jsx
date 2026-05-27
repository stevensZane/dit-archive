import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, Lightbulb, HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import Navbar from '../navigations/Navbar';
import api from '../api/axios';

const Feedback = () => {
  const [formData, setFormData] = useState({ type: 'suggestion', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // PRE-PREPARED FOR BACKEND: Envoi de la donnée au serveur
      // Ta table contiendra : id, user_id (via token JWT), type, message, created_at
      await api.post('/feedbacks', formData);

      setIsSuccess(true);
      setFormData({ type: 'suggestion', message: '' });
    } catch (err) {
      console.error("Erreur lors de l'envoi du feedback:", err);
      setError("Impossible d'envoyer le feedback pour le moment. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        
        {/* Header de la page */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Améliorons <span className="text-[#004751]">Nora</span> & l'Archive
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Un bug graphique ? Une idée d'outil statistique pour le Data Place ? Votre retour d'expérience construit la plateforme.
          </p>
        </div>

        {/* Formulaire / Message Success */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm">
          {isSuccess ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-gray-900">Merci pour votre retour !</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Votre message a été envoyé avec succès à l'équipe technique du DIT.
                </p>
              </div>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-4 px-4 py-2 text-xs font-bold text-[#004751] bg-[#004751]/5 hover:bg-[#004751]/10 rounded-xl transition-colors"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Type de feedback */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Type de message</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'bug', label: 'Bogue / Bug', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50' },
                    { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-emerald-500 bg-emerald-50' },
                    { id: 'autre', label: 'Autre demande', icon: HelpCircle, color: 'text-slate-500 bg-slate-100' }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = formData.type === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: item.id })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
                          isSelected 
                            ? 'border-[#004751] bg-[#004751]/5 ring-2 ring-[#004751]/10' 
                            : 'border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                          <Icon size={16} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Votre description
                </label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  placeholder="Décrivez précisément votre bogue ou proposez votre idée de fonctionnalité..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 font-medium placeholder-slate-400 focus:bg-white focus:ring-4 focus:ring-[#004751]/5 focus:border-[#004751]/20 transition-all duration-300 resize-none"
                />
              </div>

              {/* Erreur si l'appel API échoue */}
              {error && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.message.trim()}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm text-white transition-all shadow-md ${
                  formData.message.trim() && !isSubmitting
                    ? 'bg-[#004751] hover:bg-[#00363d] shadow-[#004751]/10'
                    : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                }`}
              >
                {isSubmitting ? "Envoi en cours..." : "Soumettre l'avis"}
                {!isSubmitting && <Send size={14} />}
              </button>

            </form>
          )}
        </div>

      </main>
    </div>
  );
};

export default Feedback;