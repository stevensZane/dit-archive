import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Navbar from '../navigations/Navbar';
import Footer from '../navigations/Footer';


import StatCard from '../dashboard-bi/statCard';
import TechDistributionChart from '../dashboard-bi/TechDistributionChart';
import ProgramDistributionChart from '../dashboard-bi/ProgramDistributionChart';
import LevelDistributionChart from '../dashboard-bi/LevelDistributionChart';
import NoraInsightsChart from '../dashboard-bi/NoraInsightsChart';
import TopProjectsTable from '../dashboard-bi/TopProjectsTable';
import TopStudentsLeaderboard from '../dashboard-bi/TopStudentsLeaderboard';



import { FolderGit2, Users, Eye, Bot } from 'lucide-react';

const DashboardBI = () => {
  const [summary, setSummary] = useState({});
  const [techData, setTechData] = useState([]);
  const [programData, setProgramData] = useState([]);
  const [levelData, setLevelData] = useState([]);
  const [noraData, setNoraData] = useState([]);
  const [topProjects, setTopProjects] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sumRes, techRes, progRes, levelRes, noraRes, topProjRes, topStudRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/tech-stack'),
          api.get('/analytics/projects-by-program'),
          api.get('/analytics/projects-by-level'),
          api.get('/analytics/nora-insights'),
          api.get('/analytics/top-projects'),
          api.get('/analytics/top-students')
        ]);

        setSummary(sumRes.data);
        setTechData(techRes.data);
        setProgramData(progRes.data);
        setLevelData(levelRes.data);
        setNoraData(noraRes.data);
        setTopProjects(topProjRes.data);
        setTopStudents(topStudRes.data);
      } catch (err) {
        console.error("Erreur lors du chargement de la BI :", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#004751] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* EN-TÊTE */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Business Intelligence <span className="text-[#004751]">& Analytics</span>
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Supervision stratégique de la production académique et des interactions au Dakar Institute of Technology.
          </p>
        </div>

        {/* 1. CARTES DE KPIS SOUVERAINES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard title="Projets Archivés" value={summary.total_projects} icon={FolderGit2} colorClass="bg-[#004751] text-white" badgeText="Base globale" />
          <StatCard title="Étudiants Inscrits" value={summary.total_students} icon={Users} colorClass="bg-slate-700 text-white" badgeText="Comptes actifs" />
          <StatCard title="Consultations Totales" value={summary.total_views} icon={Eye} colorClass="bg-teal-700 text-white" badgeText="Vues cumulées" />
          <StatCard title="Prompts Nora IA" value={summary.total_nora_queries} icon={Bot} colorClass="bg-indigo-600 text-white" badgeText="Sessions IA" />
        </div>

        {/* 2. GRAPHIQUES - LIGNE 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TechDistributionChart data={techData} />
          <ProgramDistributionChart data={programData} />
        </div>

        {/* 3. GRAPHIQUES - LIGNE 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LevelDistributionChart data={levelData} />
          <NoraInsightsChart data={noraData} />
        </div>

        {/* 4. TABLEAUX DE RANGEMENT ET D'IMPACT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProjectsTable projects={topProjects} />
          <TopStudentsLeaderboard students={topStudents} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardBI;