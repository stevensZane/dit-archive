// import React, { useState, useEffect } from 'react';
// import { UserPlus, Database, Send, CheckCircle2, Users, RefreshCw, Shield } from 'lucide-react';
// import api from '../api/axios';

// const AdminConfig = () => {
//     const [adminForm, setAdminForm] = useState({ 
//         email: '', 
//         password: '', 
//         first_name: '', 
//         last_name: '', 
//         role: 'admin' 
//     });
//     const [metaStatus, setMetaStatus] = useState(null);
//     const [onlineUsers, setOnlineUsers] = useState([]); // Liste vide par défaut
//     const [loading, setLoading] = useState(false);

//     const handleCreateAdmin = async (e) => {
//         e.preventDefault();
        
//         try {
//             // 2. Utilise EXACTEMENT le même nom ici
//             console.log("Tentative avec :", adminForm);
//             const response = await api.post('/admin/users', adminForm);
            
//             alert("Nouvel administrateur créé !");
//             setAdminForm({ email: '', password: '', first_name: '', last_name: '', role: 'admin' });
//         } catch (err) {
//             console.error("Détails d'erreur :", err.response?.data);
//             alert(err.response?.data?.detail || "Erreur lors de la création.");
//         }
//     };

//     // --- À AJOUTER ---
//     const fetchOnlineUsers = async () => {
//         try {
//             setLoading(true);
//             const response = await api.get('/admin/online-users');
//             setOnlineUsers(response.data);
//         } catch (err) {
//             console.error("Erreur users:", err);
//             setOnlineUsers([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchOnlineUsers();
//         // Optionnel : rafraîchir toutes les 30 secondes
//         const interval = setInterval(fetchOnlineUsers, 30000);
//         return () => clearInterval(interval);
//     }, []);
//     // -----------------

//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
//             {/* FORMULAIRE CRÉATION ADMIN */}
//             <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
//                 <div className="flex items-center gap-3 mb-6">
//                     <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><UserPlus size={20} /></div>
//                     <h2 className="text-xl font-black text-slate-900">Nouvel Admin</h2>
//                 </div>
                
//                 <form onSubmit={handleCreateAdmin} className="space-y-4">
//                     <div className="grid grid-cols-2 gap-4">
//                         <input type="text" placeholder="Prénom" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.first_name} onChange={e => setAdminForm({...adminForm, first_name: e.target.value})} />
//                         <input type="text" placeholder="Nom" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.last_name} onChange={e => setAdminForm({...adminForm, last_name: e.target.value})} />
//                     </div>
//                     <input type="email" placeholder="Email DIT (@dit.sn)" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
//                     <input type="password" placeholder="Mot de passe" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
//                     <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600" value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})}>
//                         <option value="admin">Administrateur</option>
//                         <option value="superadmin">Super Admin</option>
//                         <option value="guest">Guest</option>
//                     </select>
//                     <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Créer le compte</button>
//                 </form>
//             </div>

//             {/* LIVE ACTIVITY MONITOR */}
//             <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
//                 <div className="relative z-10">
//                     <div className="flex items-center justify-between mb-6">
//                         <div className="flex items-center gap-3">
//                             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
//                                 <Users size={20} />
//                             </div>
//                             <div>
//                                 <h2 className="text-xl font-black text-slate-900">Activité Live</h2>
//                                 <div className="flex items-center gap-1.5">
//                                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Système Synchrone</span>
//                                 </div>
//                             </div>
//                         </div>
//                         <button onClick={fetchOnlineUsers} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
//                             <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
//                         </button>
//                     </div>

//                     <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
//                         {onlineUsers.length > 0 ? (
//                             onlineUsers.map((user) => (
//                                 <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
//                                     <div className="flex items-center gap-3">
//                                         <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
//                                             {user.first_name[0]}{user.last_name[0]}
//                                         </div>
//                                         <div>
//                                             <p className="text-sm font-bold text-slate-900">{user.first_name} {user.last_name}</p>
//                                             <p className="text-[10px] text-slate-400 font-medium">{user.role}</p>
//                                         </div>
//                                     </div>
//                                     <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-lg">En ligne</span>
//                                 </div>
//                             ))
//                         ) : (
//                             <div className="text-center py-10">
//                                 <p className="text-xs text-slate-400 font-medium">Aucun utilisateur actif pour le moment</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AdminConfig;

import React, { useState, useEffect } from 'react'; // AJOUTÉ : useEffect
import { UserPlus, Database, Send, CheckCircle2, Users, RefreshCw, Shield } from 'lucide-react';
import api from '../api/axios';

const AdminConfig = () => {
    const [adminForm, setAdminForm] = useState({ 
        email: '', 
        password: '', 
        first_name: '', 
        last_name: '', 
        role: 'admin' 
    });
    const [metaStatus, setMetaStatus] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]); 
    const [loading, setLoading] = useState(false);

    // --- FONCTION DE RÉCUPÉRATION ---
    const fetchOnlineUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/online-users');
            setOnlineUsers(response.data);
        } catch (err) {
            console.error("Erreur users:", err);
            setOnlineUsers([]); 
        } finally {
            setLoading(false);
        }
    };

    // --- CHARGEMENT AU DÉMARRAGE ---
    useEffect(() => {
        fetchOnlineUsers();
    }, []);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', adminForm);
            alert("Nouvel administrateur créé !");
            setAdminForm({ email: '', password: '', first_name: '', last_name: '', role: 'admin' });
            fetchOnlineUsers(); // Rafraîchir la liste après création
        } catch (err) {
            alert(err.response?.data?.detail || "Erreur lors de la création.");
        }
    };

    const initMetadata = async () => {
        if (!window.confirm("Initialiser les données de base ?")) return;
        try {
            await api.post('/admin/init-metadata', {
                technologies: ["React", "FastAPI"],
                programs: ["Génie Logiciel"],
                academic_years: ["2023-2024"]
            });
            setMetaStatus("Données initialisées !");
        } catch (err) { setMetaStatus("Erreur d'initialisation."); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FORMULAIRE (Ton code actuel est bon) */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><UserPlus size={20} /></div>
                    <h2 className="text-xl font-black text-slate-900">Nouvel Admin</h2>
                </div>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Prénom" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.first_name} onChange={e => setAdminForm({...adminForm, first_name: e.target.value})} />
                        <input type="text" placeholder="Nom" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.last_name} onChange={e => setAdminForm({...adminForm, last_name: e.target.value})} />
                    </div>
                    <input type="email" placeholder="Email" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} />
                    <input type="password" placeholder="Mot de passe" className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                    <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-600" value={adminForm.role} onChange={e => setAdminForm({...adminForm, role: e.target.value})}>
                        <option value="admin">Administrateur</option>
                        <option value="superadmin">Super Admin</option>
                    </select>
                    <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">Créer le compte</button>
                </form>
            </div>

            {/* LIVE ACTIVITY MONITOR (Ton code est bon ici aussi) */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={20} /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Membres de l'équipe</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Vue d'ensemble</p>
                            </div>
                        </div>
                        <button onClick={fetchOnlineUsers} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {onlineUsers.length > 0 ? (
                            onlineUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                            {user.first_name[0]}{user.last_name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{user.first_name} {user.last_name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium italic">{user.role}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-lg">Actif</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-10 text-xs text-slate-400">Chargement des membres...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminConfig;