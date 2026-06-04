import React, { useEffect } from 'react';
import { createPortal } from 'react-dom'; // 🟢 Import du Portal
import { X, Shield, Eye, Lock, Database, UserCheck, FileText } from 'lucide-react';

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  // Bloquer le scroll de la page arrière-plan quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // 🟢 On enveloppe tout le JSX existant dans un Portal lié à document.body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Container de la Modal */}
      <div className="bg-white w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header de la Modal */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Shield size={20} className="text-[#004751]" />
            <div>
              <h2 className="font-black text-gray-900 text-lg leading-tight">Politique de Confidentialité</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Dakar Institute of Technology</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-gray-900 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps de la Modal (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-slate-600 leading-relaxed scrollbar-thin">
          
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3 items-start">
            <FileText size={18} className="text-[#004751] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Dernière mise à jour : Juin 2026.</span> Cette politique détaille la façon dont le Dakar Institute of Technology (DIT) collecte, stocke et traite les données issues de vos interactions avec l'IA Nora, vos projets académiques et l'utilisation globale de la plateforme de gestion des archives.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 text-base">
              <Eye size={16} className="text-[#004751]" />
              1. Collecte des Données et Renseignements
            </h3>
            <p>
              Dans le cadre de l'exploitation de la plateforme d'archives et de l'agent conversationnel Nora, nous sommes amenés à collecter deux types distincts d'informations :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
              <li><span className="font-semibold text-slate-700">Données de profil utilisateur :</span> Nom, prénom, adresse e-mail institutionnelle, filière académique, niveau d'études, rôle (Étudiant, Admin, Superadmin, Guest) et avatar de profil.</li>
              <li><span className="font-semibold text-slate-700">Données d'interactions (Nora) :</span> L'intégralité des invites textuelles (prompts) soumises, les réponses générées par le modèle, ainsi que les métadonnées de session (horodatage, taux de clics).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 text-base">
              <Database size={16} className="text-[#004751]" />
              2. Utilisation et Indexation des Échanges
            </h3>
            <p>
              Conformément à la note d'information affichée sur l'interface de chat, les requêtes formulées auprès de l'agent Nora sont automatiquement indexées de manière sécurisée. Ces données poursuivent des finalités strictement académiques et d'innovation :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
              <li>Amélioration continue et alignement des poids des modèles de langage (LLM) locaux déployés par l'établissement.</li>
              <li>Enrichissement automatique du <span className="font-bold text-[#004751]">Data Place</span> du DIT par la détection des thématiques de recherche récurrentes.</li>
              <li>Établissement de statistiques anonymisées de performance technique et d'engagement pour l'équipe d'administration.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 text-base">
              <Lock size={16} className="text-[#004751]" />
              3. Stockage, Sécurité et Rétention
            </h3>
            <p>
              Le DIT applique des mesures techniques et organisationnelles rigoureuses pour prémunir vos données contre toute fuite, altération ou accès illégitime :
            </p>
            <p className="text-xs text-slate-500">
              Toutes les conversations et données de projets sont chiffrées au repos et en transit via le protocole TLS. Les caches locaux (`localStorage`) utilisés pour fluidifier l'expérience utilisateur sont restreints au navigateur de l'interlocuteur et purgés instantanément lors de l'action de déconnexion globale du système. Les journaux de conversation destinés à l'entraînement sont anonymisés à l'aide de filtres automatiques pour supprimer toute mention de coordonnées privées.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 text-base">
              <UserCheck size={16} className="text-[#004751]" />
              4. Contrôle d'Accès basé sur les Rôles (RBAC)
            </h3>
            <p>
              L'accès aux bases de données archivées respecte une stricte hiérarchie de sécurité. Les profils de type <span className="font-semibold">Guest</span> disposent d'un accès publique bridé, interdisant la visibilité des données d'identité d'autrui ou des structures de code sensibles, préservant ainsi la propriété intellectuelle des travaux des diplômés du DIT.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-bold text-gray-900 text-base">
              <Shield size={16} className="text-[#004751]" />
              5. Droits des Utilisateurs
            </h3>
            <p>
              Conformément aux législations sur la protection des données personnelles, tout étudiant ou membre du personnel dispose d'un droit d'accès, de rectification, de limitation et de suppression des données le concernant. Pour toute réclamation ou demande d'extraction de vos logs d'activité, vous pouvez contacter l'administration à l'adresse dédiée : <span className="font-semibold text-slate-800">privacy@dit.sn</span>.
            </p>
          </section>

        </div>

        {/* Footer de la Modal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#004751] hover:bg-[#063940] text-white text-xs font-bold transition-all shadow-sm"
          >
            J'ai compris
          </button>
        </div>

      </div>
    </div>,
    document.body // 🟢 Point d'ancrage global
  );
};

export default PrivacyPolicyModal;