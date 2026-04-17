// import { useState, useEffect } from 'react';
// import api from '../api/axios';

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     first_name: '',
//     last_name: '',
//     email: '',
//     password: '',
//     academic_year_id: '',
//     program_id: '',
//     level: ''
//   });

//   const [years, setYears] = useState([]);
//   const [programs, setPrograms] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [password, setPassword] = useState('');

//   // Définition des critères
//   const criteria = [
//     { label: "8 caractères", test: password.length >= 8 },
//     { label: "Majuscule & Minuscule", test: /[a-z]/.test(password) && /[A-Z]/.test(password) },
//     { label: "Un chiffre", test: /\d/.test(password) },
//     { label: "Spécial (@$!%*?)", test: /[@$!%*?&]/.test(password) },
//   ];

//   const isPasswordValid = criteria.every(c => c.test);

//   // Charger les données initiales (Années et Filières)
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [resYears, resPrograms] = await Promise.all([
//           api.get('/academic-years'),
//           api.get('/programs')
//         ]);
//         setYears(resYears.data);
//         setPrograms(resPrograms.data);
//       } catch (err) {
//         console.error("Erreur de chargement", err);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       await api.post('/users/signup', formData);
//       alert("Compte DIT créé ! Connecte-toi.");
//       window.location.href = '/login';
//     } catch (error) {
//       alert(error.response?.data?.detail || "Erreur lors de l'inscription.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-dit-blue flex flex-col justify-center p-4 py-10 text-gray-800">
//       <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        
//         <div className="flex flex-col items-center justify-center mb-10 text-center">
//           <img 
//             src="/logo-archive.png" 
//             alt="DIT Logo" 
//             className="md:h-35 object-contain"/>

//           <h2 className="text-xl text-gray-800 -mt-10">Construis ton héritage numérique. Archive tes projets et inspire les prochaines promotions.</h2>

//         </div>

//         <h2 className="text-2xl font-bold text-dit-blue text-center mb-6">Inscrivez-vous!</h2>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="text-xs font-bold text-gray-500 uppercase">Prénom</label>
//               <input name="first_name" type="text" required onChange={handleChange}
//                 className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
//             </div>
//             <div>
//               <label className="text-xs font-bold text-gray-500 uppercase">Nom</label>
//               <input name="last_name" type="text" required onChange={handleChange}
//                 className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
//             </div>
//           </div>

//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase">Email Institutionnel (@dit.sn)</label>
//             <input name="email" type="email" required onChange={handleChange} placeholder="nom.prenom@dit.sn"
//               className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="text-xs font-bold text-gray-500 uppercase">Filière</label>
//               <select name="program_id" required onChange={handleChange}
//                 className="mt-1 w-full px-4 py-2 border rounded-lg bg-white outline-none">
//                 <option value="">Choisir...</option>
//                 {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//               </select>
//             </div>
//             <div>
//               <label className="text-xs font-bold text-gray-500 uppercase">Niveau</label>
//               <select name="level" required onChange={handleChange}
//                 className="mt-1 w-full px-4 py-2 border rounded-lg bg-white outline-none">
//                 <option value="">Choisir...</option>
//                 <option value="L1">Licence 1</option>
//                 <option value="L2">Licence 2</option>
//                 <option value="L3">Licence 3</option>
//                 <option value="M1">Master 1</option>
//                 <option value="M2">Master 2</option>
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase">Promotion (Année)</label>
//             <select name="academic_year_id" required onChange={handleChange}
//               className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-dit-teal outline-none appearance-none">
//               <option value="">Sélectionner l'année...</option>
//               {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
//             </select>
//           </div>

//           <div>
//             <label className="text-xs font-bold text-gray-500 uppercase">Mot de passe</label>
//             <input name="password" type="password" required onChange={(e) => setPassword(e.target.value)}
//               className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
//           </div>
//           <div className="mt-4 space-y-2 ml-1">
//             {criteria.map((c, i) => (
//               <div key={i} className="flex items-center gap-2">
//                 <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${c.test ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-200'}`} />
//                 <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${c.test ? 'text-slate-600' : 'text-slate-300'}`}>
//                   {c.label}
//                 </span>
//               </div>
//             ))}
//           </div>

//          <button 
//           type="submit" 
//           disabled={!isPasswordValid || loading}
//           className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 text-[10px] uppercase tracking-[0.2em]
//             ${isPasswordValid && !loading
//               ? 'bg-[#004751] hover:bg-slate-900 text-white shadow-teal-100 cursor-pointer' 
//               : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
//             }`}
//           >
//             {loading ? (
//               <div className="flex items-center justify-center gap-2">
//                 <Loader2 className="animate-spin" size={16} />
//                 <span>Initialisation...</span>
//               </div>
//             ) : (
//               "Créer mon compte"
//             )}
//           </button>
//         </form>
        
//         <p className="mt-6 text-center text-sm text-gray-600">
//           Déjà inscrit ? <a href="/login" className="text-dit-teal font-bold hover:underline">Se connecter</a>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Signup;

import React, { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import api from '../api/axios';
import Navbar from './Navbar';

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    academic_year_id: '',
    program_id: '',
    level: ''
  });

  const [years, setYears] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Définition des critères de sécurité
  const criteria = [
    { label: "8 caractères", test: formData.password.length >= 8 },
    { label: "Majuscule & Minuscule", test: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) },
    { label: "Un chiffre", test: /\d/.test(formData.password) },
    { label: "Spécial (@$!%*?)", test: /[@$!%*?&]/.test(formData.password) },
  ];

  const isPasswordValid = criteria.every(c => c.test);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resYears, resPrograms] = await Promise.all([
          api.get('/academic-years'),
          api.get('/programs')
        ]);
        setYears(resYears.data);
        setPrograms(resPrograms.data);
      } catch (err) {
        console.error("Erreur de chargement", err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) return alert("Les mots de passe ne correspondent pas.");
    
    setLoading(true);
    // On extrait confirmPassword pour ne pas l'envoyer au backend
    const { confirmPassword, ...dataToSend } = formData;

    try {
      await api.post('/users/signup', dataToSend);
      alert("Compte DIT créé ! Connecte-toi.");
      window.location.href = '/login';
    } catch (error) {
      alert(error.response?.data?.detail || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center p-4 py-20 text-gray-800 font-sans">
      <div className="max-w-2xl w-full mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-50">
        
        <div className="flex flex-col items-center mb-10 text-center">
          <img src="/logo-archive.png" alt="DIT Logo" className="h-20 mb-6 object-contain"/>
          <h2 className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
            Rejoignez l'archive numérique du DIT. <br/>Partagez vos projets, bâtissez votre futur.
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* IDENTITÉ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prénom</label>
              <input name="first_name" type="text" required onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#004751]/10 focus:bg-white outline-none transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
              <input name="last_name" type="text" required onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#004751]/10 focus:bg-white outline-none transition-all" />
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Institutionnel</label>
            <input name="email" type="email" required onChange={handleChange} placeholder="nom.prenom@dit.sn"
              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#004751]/10 focus:bg-white outline-none transition-all" />
          </div>

          {/* ACADÉMIQUE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filière</label>
              <select name="program_id" required onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                <option value="">Choisir...</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Niveau</label>
              <select name="level" required onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                <option value="">Choisir...</option>
                <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
                <option value="M1">M1</option><option value="M2">M2</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Promotion</label>
              <select name="academic_year_id" required onChange={handleChange}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none appearance-none">
                <option value="">Année...</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
              </select>
            </div>
          </div>

          {/* MOTS DE PASSE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} required onChange={handleChange}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#004751]/10 outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmation</label>
              <div className="relative">
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required onChange={handleChange}
                  className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl focus:ring-2 outline-none transition-all ${
                    formData.confirmPassword ? (passwordsMatch ? 'border-emerald-200 focus:ring-emerald-500/10' : 'border-red-200 focus:ring-red-500/10') : 'border-slate-100'
                  }`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* CRITÈRES VISUELS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            {criteria.map((c, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${c.test ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                {c.test ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200" />}
                <span className="text-[8px] font-black uppercase tracking-tighter">{c.label}</span>
              </div>
            ))}
          </div>

          {/* BOUTON SOUMISSION */}
          <button 
            type="submit" 
            disabled={!isPasswordValid || !passwordsMatch || loading}
            className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 text-[11px] uppercase tracking-[0.3em] mt-4
              ${isPasswordValid && passwordsMatch && !loading
                ? 'bg-[#004751] hover:bg-slate-900 text-white shadow-[#004751]/20 cursor-pointer' 
                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="animate-spin" size={18} />
                <span>Création du profil...</span>
              </div>
            ) : (
              "Finaliser l'inscription"
            )}
          </button>
        </form>
        
        <p className="mt-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          Déjà un héritage ici ? <a href="/login" className="text-[#E91E63] hover:underline ml-1">Se connecter</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;