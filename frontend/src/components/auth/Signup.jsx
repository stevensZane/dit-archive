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

import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '', // Ajouté pour la validation
    academic_year_id: '',
    program_id: '',
    level: ''
  });

  const [years, setYears] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Définition des critères sur formData.password
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
    // On retire confirmPassword avant l'envoi à l'API
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
    <div className="min-h-screen bg-dit-blue flex flex-col justify-center p-4 py-10 text-gray-800">
      <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <img 
            src="/logo-archive.png" 
            alt="DIT Logo" 
            className="md:h-35 object-contain"/>
          <h2 className="text-xl text-gray-800 -mt-10">Construis ton héritage numérique. Archive tes projets et inspire les prochaines promotions.</h2>
        </div>

        <h2 className="text-2xl font-bold text-dit-blue text-center mb-6">Inscrivez-vous!</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Prénom</label>
              <input name="first_name" type="text" required onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nom</label>
              <input name="last_name" type="text" required onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Email Institutionnel (@dit.sn)</label>
            <input name="email" type="email" required onChange={handleChange} placeholder="nom.prenom@dit.sn"
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Filière</label>
              <select name="program_id" required onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg bg-white outline-none">
                <option value="">Choisir...</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Niveau</label>
              <select name="level" required onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg bg-white outline-none">
                <option value="">Choisir...</option>
                <option value="L1">Licence 1</option>
                <option value="L2">Licence 2</option>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Promotion (Année)</label>
            <select name="academic_year_id" required onChange={handleChange}
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-dit-teal outline-none appearance-none">
              <option value="">Sélectionner l'année...</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
            </select>
          </div>

          {/* MOT DE PASSE */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Mot de passe</label>
            <div className="relative">
              <input name="password" type={showPassword ? "text" : "password"} required onChange={handleChange}
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-dit-teal outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* CONFIRMATION DU MOT DE PASSE */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Confirmer le mot de passe</label>
            <div className="relative">
              <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required onChange={handleChange}
                className={`mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none ${formData.confirmPassword && !passwordsMatch ? 'border-red-500 focus:ring-red-200' : 'focus:ring-dit-teal'}`} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2 ml-1">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${c.test ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-200'}`} />
                <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${c.test ? 'text-slate-600' : 'text-slate-300'}`}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={!isPasswordValid || !passwordsMatch || loading}
            className={`w-full font-black py-4 rounded-2xl shadow-lg transition-all transform active:scale-95 text-[10px] uppercase tracking-[0.2em]
              ${isPasswordValid && passwordsMatch && !loading
                ? 'bg-[#004751] hover:bg-slate-900 text-white shadow-teal-100 cursor-pointer' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Initialisation...</span>
              </div>
            ) : (
              "Créer mon compte"
            )}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Déjà inscrit ? <a href="/login" className="text-dit-teal font-bold hover:underline">Se connecter</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;