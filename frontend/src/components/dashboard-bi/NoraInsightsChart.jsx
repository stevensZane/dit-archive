import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const NoraInsightsChart = ({ data }) => (
  // Augmentation légère de la hauteur globale (400px) pour laisser de la place aux libellés inclinés
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[400px] flex flex-col justify-between">
    <h3 className="text-base font-bold text-slate-800 mb-2">Interactions IA Nora par Filière</h3>
    <ResponsiveContainer width="100%" height="90%">
      <BarChart 
        data={data} 
        margin={{ top: 10, right: 10, left: -20, bottom: 45 }} // Bottom augmenté pour laisser de la place au texte incliné
      >
        <XAxis 
          dataKey="program" 
          axisLine={false} 
          tickLine={false} 
          interval={0} // Force l'affichage de tous les labels
          angle={-25} // Incline le texte de 25 degrés
          textAnchor="end" // Aligne la fin du texte au point de graduation
          height={60} // Réserve une zone explicite pour le texte de l'axe X
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
          // Raccourcit proprement les noms de plus de 18 caractères
          tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 18)}...` : value} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
        />
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            borderColor: '#E2E8F0', 
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }} 
        />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          iconType="circle" 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
        />
        <Bar 
          dataKey="total_questions" 
          name="Questions posées" 
          fill="#004751" 
          radius={[6, 6, 0, 0]} 
        />
        <Bar 
          dataKey="negative_feedbacks" 
          name="Retours négatifs" 
          fill="#F43F5E" 
          radius={[6, 6, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default NoraInsightsChart;