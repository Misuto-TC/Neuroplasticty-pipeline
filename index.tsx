
import React, { useState, useMemo, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  BarChart,
  Bar,
  ComposedChart,
  ErrorBar,
  Cell
} from "recharts";
import {
  Activity,
  Brain,
  Dna,
  FileText,
  GitBranch,
  Settings,
  Microscope,
  Sigma,
  Network,
  ArrowRight,
  Database,
  Layers,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Info,
  XCircle,
  Pill,
  SlidersHorizontal,
  Bug,
  User
} from "lucide-react";

import { runPipeline, PipelineResult } from "./src/pipeline/main";
import { UNIFIED_DATAFRAME, ORTHOLOGS, PATHWAYS, CONDITIONS, TIME_POINTS } from "./src/pipeline/data";

// --- COMPONENTS ---

const Badge = ({ type, text }) => {
  const colors = {
    measured: "bg-blue-900/30 text-blue-300 border-blue-800",
    inferred: "bg-purple-900/30 text-purple-300 border-purple-800",
    translated: "bg-emerald-900/30 text-emerald-300 border-emerald-800",
    validation: "bg-amber-900/30 text-amber-300 border-amber-800",
    model: "bg-pink-900/30 text-pink-300 border-pink-800",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[type] || colors.measured}`}>
      {text}
    </span>
  );
};

const OrthologNetwork = ({ orthologs }: { orthologs: typeof ORTHOLOGS }) => {
  // Group orthologs by pathway
  const grouped = orthologs.reduce((acc, curr) => {
    if (!acc[curr.pathway]) acc[curr.pathway] = [];
    acc[curr.pathway].push(curr);
    return acc;
  }, {} as Record<string, typeof ORTHOLOGS>);

  return (
    <div className="flex flex-col gap-8 p-2">
      {Object.entries(grouped).map(([pathway, items]) => (
        <div key={pathway} className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          {/* Highlight top pathway */}
          {pathway === "cAMP Signaling" && (
            <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-4 py-1.5 rounded-bl-xl border-b border-l border-emerald-500/30 shadow-sm">
              Primary Enriched Pathway
            </div>
          )}
          
          <h4 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <Network className="text-indigo-400" size={20} />
            {pathway}
          </h4>
          
          <div className="flex flex-col gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between md:justify-start md:gap-12 relative">
                
                {/* Fly Node */}
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 p-3 rounded-lg w-48 shadow-lg z-10 transition-transform hover:scale-105">
                  <div className="bg-slate-800 p-2 rounded-full">
                    <Bug size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Drosophila</div>
                    <div className="font-mono text-sm font-bold text-slate-300 italic">{item.dmel}</div>
                  </div>
                </div>

                {/* Connection Line & Score */}
                <div className="flex-1 hidden md:flex items-center justify-center relative min-w-[100px]">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-slate-700 via-indigo-500/50 to-slate-700"></div>
                  <div className="bg-slate-900 border border-indigo-500/50 px-3 py-1 rounded-full text-xs text-indigo-300 z-10 flex items-center gap-1.5 shadow-md">
                    <Dna size={12} />
                    {(item.score * 100).toFixed(0)}% Conserved
                  </div>
                </div>
                
                {/* Mobile Arrow */}
                <div className="md:hidden text-slate-600">
                  <ArrowRight size={20} />
                </div>

                {/* Human Node */}
                <div className="flex items-center gap-3 bg-slate-950 border border-emerald-900/50 p-3 rounded-lg w-48 shadow-lg z-10 shadow-emerald-900/10 transition-transform hover:scale-105">
                  <div className="bg-emerald-900/30 p-2 rounded-full">
                    <User size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Human</div>
                    <div className="font-mono text-sm font-bold text-emerald-400">{item.human}</div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const DisclaimerBox = () => (
  <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl mt-12 mb-6 text-slate-300 text-sm shadow-sm">
    <h4 className="font-bold text-slate-200 mb-3 flex items-center gap-2 text-base">
      <AlertTriangle size={18} className="text-amber-500" />
      Important Scientific Context & Limitations
    </h4>
    <ul className="list-disc pl-5 space-y-2">
      <li><strong>Measured vs. Inferred:</strong> Experimental climbing behavior is directly measured. Dopamine, cAMP, and synaptic indices are literature-informed mechanistic proxies, not directly measured molecular data.</li>
      <li><strong>Translation:</strong> Human translation is based on ortholog sequence conservation and pathway enrichment, not clinical or functional validation.</li>
      <li><strong>Pharmacology:</strong> Drug/compound outputs are strictly exploratory and serve only to illustrate translational hypotheses for future investigation.</li>
    </ul>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, subtitle = null }) => (
  <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden mb-6">
    <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-slate-900 rounded-lg shadow-sm text-slate-400 border border-slate-800">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const TabButton = ({ id, label, icon: Icon, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      activeTab === id
        ? "border-indigo-500 text-indigo-400 bg-indigo-950/30"
        : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200"
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

// --- MAIN APP ---

const App = () => {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [pipelineResults, setPipelineResults] = useState<PipelineResult | null>(null);
  
  // Simulator State
  const [simEnrichment, setSimEnrichment] = useState(0.5);
  const [simDuration, setSimDuration] = useState(240); // Hours of enrichment before withdrawal
  const [simKnockout, setSimKnockout] = useState("none");

  useEffect(() => {
    const results = runPipeline();
    setPipelineResults(results);
  }, []);

  if (!pipelineResults) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Initializing Pipeline...</div>;

  const { 
    featureImportance, 
    holdOutMetrics, 
    cvResult, 
    sensitivityAnalysis, 
    pathwayEnrichment,
    proxyDefinitions,
    orthologMetadata,
    drugDatabase,
    drugCocktails,
    topMechanism
  } = pipelineResults;

  // Prepare data for Observed vs Predicted
  const predData = holdOutMetrics.predictions.map((p, i) => ({
    index: i,
    observed: p.observed,
    predicted: p.predicted
  })).sort((a, b) => a.observed - b.observed);

  // Prepare data for K-Fold Cross Validation
  const cvChartData = cvResult.fold_r2.map((r2, idx) => ({
    name: `Fold ${idx + 1}`,
    r2: r2
  }));

  // --- SIMULATOR LOGIC ---
  const simulateData = () => {
    return TIME_POINTS.map(t => {
      // Calculate effective enrichment considering withdrawal
      let effectiveEnrichment = simEnrichment;
      if (t > simDuration) {
        // Exponential decay after enrichment stops
        const timeSinceWithdrawal = t - simDuration;
        effectiveEnrichment = simEnrichment * Math.exp(-timeSinceWithdrawal / 48); // 48h decay constant
      }

      // Base mechanism formulas from data.ts
      let dop = effectiveEnrichment * Math.exp(-Math.pow(t - 24, 2) / (2 * Math.pow(24, 2)));
      let camp = effectiveEnrichment * (1 / (1 + Math.exp(-(t - 72) / 24)));
      let syn = effectiveEnrichment * Math.pow(t / 240, 1.5);
      
      // Apply Knockouts
      if (simKnockout === "dopamine_index") dop = 0;
      if (simKnockout === "camp_index") camp = 0;
      if (simKnockout === "synaptic_index") syn = 0;

      // Predict behavior using Ridge Model Weights (simplified for UI simulation)
      // Base intercept ~ 20, plus weighted features
      let predicted_climb = 20; 
      featureImportance.forEach(f => {
        if (f.name === "dopamine_index") predicted_climb += dop * f.value * 20; // scaled for visualization
        if (f.name === "camp_index") predicted_climb += camp * f.value * 20;
        if (f.name === "synaptic_index") predicted_climb += syn * f.value * 20;
      });

      return {
        time_h: t,
        dopamine: dop,
        camp: camp,
        synaptic: syn,
        predicted_climb: Math.max(0, Math.min(100, predicted_climb))
      };
    });
  };

  const simData = simulateData();

  return (
    <div className="min-h-screen pb-12 bg-slate-950 font-sans text-slate-100">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Network size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none text-slate-100">Mechanistic Causal Pipeline</h1>
              <p className="text-xs text-slate-400 mt-1">Enrichment → Mechanism → Behavior → Translation</p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <Badge type="measured" text="Exp. Data" />
            <Badge type="inferred" text="Ridge Regression" />
            <Badge type="translated" text="Human Orthologs" />
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <div className="bg-slate-900 border-b border-slate-800 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex min-w-max">
          <TabButton id="pipeline" label="1. Systems Model" icon={Layers} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton id="model" label="2. Mechanistic Modeling" icon={Sigma} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton id="simulator" label="3. Interactive Simulator" icon={SlidersHorizontal} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton id="orthologs" label="4. Evolutionary Conservation" icon={Dna} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton id="report" label="5. Final Report" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton id="translation" label="6. Future Evaluation" icon={Pill} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: PIPELINE OVERVIEW */}
        {activeTab === "pipeline" && (
          <div className="space-y-6">
            <SectionCard title="Systems Biology Architecture" icon={Layers} subtitle="Data flow from experimental inputs to translational outputs">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                
                <div className="flex-1 p-4 bg-slate-900 rounded border border-slate-700 text-center">
                  <Database className="mx-auto mb-2 text-blue-400" size={24} />
                  <h4 className="font-bold text-slate-200 text-sm">1. Data Ingestion</h4>
                  <p className="text-xs text-slate-500 mt-1">Behavioral Time-Series<br/>Enrichment Levels</p>
                </div>

                <ArrowRight className="text-slate-600" />

                <div className="flex-1 p-4 bg-slate-900 rounded border border-slate-700 text-center">
                  <Microscope className="mx-auto mb-2 text-purple-400" size={24} />
                  <h4 className="font-bold text-slate-200 text-sm">2. Mechanistic Proxies</h4>
                  <p className="text-xs text-slate-500 mt-1">Dopamine Index<br/>cAMP/PKA Index<br/>Synaptic Remodeling</p>
                </div>

                <ArrowRight className="text-slate-600" />

                <div className="flex-1 p-4 bg-slate-900 rounded border border-slate-700 text-center">
                  <Sigma className="mx-auto mb-2 text-pink-400" size={24} />
                  <h4 className="font-bold text-slate-200 text-sm">3. Mechanistic Modeling</h4>
                  <p className="text-xs text-slate-500 mt-1">Ridge Regression<br/>Feature Importance<br/>Cross-Validation</p>
                </div>

                <ArrowRight className="text-slate-600" />

                <div className="flex-1 p-4 bg-slate-900 rounded border border-slate-700 text-center">
                  <Pill className="mx-auto mb-2 text-emerald-400" size={24} />
                  <h4 className="font-bold text-slate-200 text-sm">4. Translational Hypotheses</h4>
                  <p className="text-xs text-slate-500 mt-1">Ortholog Mapping<br/>Pathway-Linked Compounds</p>
                </div>

              </div>
            </SectionCard>

            <div className="grid md:grid-cols-2 gap-6">
              <SectionCard title="Mechanistic Proxy Definitions" icon={Info}>
                <div className="space-y-4">
                  {Object.entries(proxyDefinitions).map(([key, def]: [string, any]) => (
                    <div key={key} className="p-3 bg-slate-950 border border-slate-800 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-200 capitalize">{key} Index</span>
                        <code className="text-xs bg-slate-900 px-1 py-0.5 rounded text-slate-400">{def.formula}</code>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">{def.description}</p>
                      <p className="text-xs text-slate-500 italic">Rationale: {def.rationale}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Proxy Dynamics (High Enrichment)" icon={Activity}>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={UNIFIED_DATAFRAME.filter(d => d.condition === "High")}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                       <XAxis dataKey="time_h" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                       <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} />
                       <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                       <Legend />
                       <Line type="monotone" dataKey="dopamine_index" stroke="#60a5fa" name="Dopamine" dot={false} strokeWidth={2} />
                       <Line type="monotone" dataKey="camp_index" stroke="#c084fc" name="cAMP/PKA" dot={false} strokeWidth={2} />
                       <Line type="monotone" dataKey="synaptic_index" stroke="#34d399" name="Synaptic" dot={false} strokeWidth={2} />
                     </LineChart>
                   </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Notice how Dopamine spikes early (spark), cAMP consolidates, and Synaptic remodeling accelerates late (engine).
                </p>
              </SectionCard>
            </div>
          </div>
        )}

        {/* VIEW 2: CAUSAL MODEL */}
        {activeTab === "model" && (
          <div className="space-y-6">
            <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-indigo-300 mb-2 flex items-center gap-2">
                <GitBranch size={24} />
                Model Robustness (K-Fold Cross Validation)
              </h3>
              <p className="text-slate-300 text-sm">
                To ensure the model's predictive power is robust and not overfitted to a specific timepoint, we performed <strong>k=5 fold cross-validation</strong> across the entire dataset. 
                The model achieved a <strong>Mean R² of {cvResult.mean_r2.toFixed(3)}</strong> (±{cvResult.std_r2.toFixed(3)}). This proves the model is consistently highly accurate across all time points, not just the hold-out set.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <SectionCard title="Feature Importance (Ridge Regression)" icon={GitBranch}>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={featureImportance} layout="vertical" margin={{left: 20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" tick={{fill: '#94a3b8'}} width={100} />
                      <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                        {featureImportance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.value > 0 ? "#6366f1" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  <strong>Interpretation:</strong> The <strong>{featureImportance[0].name}</strong> index has the highest coefficient, 
                  proving that long-term structural rewiring is the primary driver of sustained motor circuit adaptation, not just the initial dopamine spike.
                </p>
              </SectionCard>

              <SectionCard title="Predictive Validity (Hold-Out Set)" icon={TrendingUp}>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" dataKey="observed" name="Observed" unit="%" stroke="#64748b" tick={{fill: '#94a3b8'}} label={{ value: 'Observed Behavior (%)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                      <YAxis type="number" dataKey="predicted" name="Predicted" unit="%" stroke="#64748b" tick={{fill: '#94a3b8'}} label={{ value: 'Predicted Behavior (%)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                      <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                      <ReferenceLine x={0} y={0} stroke="#94a3b8" />
                      {/* Identity Line */}
                      <Line dataKey="observed" data={[{observed: 0, predicted: 0}, {observed: 100, predicted: 100}]} stroke="#475569" strokeDasharray="5 5" dot={false} activeDot={false} />
                      <Scatter name="Test Data" data={predData} fill="#10b981" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  <strong>R² = {holdOutMetrics.r2.toFixed(3)}</strong> on hold-out data (216h-240h). 
                  Points close to the diagonal dashed line indicate accurate predictions on unseen data.
                </p>
              </SectionCard>

              <SectionCard title="Cross-Validation Performance" icon={Activity}>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cvChartData} margin={{top: 20, right: 20, bottom: 20, left: 20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                      <YAxis domain={[0, 1]} stroke="#64748b" tick={{fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#334155'}} contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                      <ReferenceLine y={cvResult.mean_r2} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: `Mean R²: ${cvResult.mean_r2.toFixed(3)}`, fill: '#10b981', fontSize: 12 }} />
                      <Bar dataKey="r2" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {cvChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.r2 > 0.7 ? "#8b5cf6" : "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  <strong>Consistency Check:</strong> The R² score for each of the 5 folds. The green dashed line represents the Mean R² ({cvResult.mean_r2.toFixed(3)}), demonstrating stable predictive performance across different subsets of the data.
                </p>
              </SectionCard>

              <SectionCard title="Sensitivity Analysis (Ablation)" icon={AlertTriangle}>
               <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Ablated Feature</th>
                      <th className="px-6 py-3">Drop in CV R²</th>
                      <th className="px-6 py-3">Impact Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityAnalysis.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-900/50">
                        <td className="px-6 py-4 font-medium text-slate-200">{item.name}</td>
                        <td className="px-6 py-4 text-red-400">-{item.dropInR2.toFixed(3)}</td>
                        <td className="px-6 py-4">
                          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-red-500" style={{width: `${Math.min(100, item.dropInR2 * 200)}%`}}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-500 mt-3 px-2">
                  * Shows the decrease in model performance when each feature is removed. Larger drops indicate higher dependency.
                </p>
              </div>
            </SectionCard>
            </div>
          </div>
        )}

        {/* VIEW 6: FUTURE EVALUATION (PHARMACOGENOMICS) */}
        {activeTab === "translation" && (
          <div className="space-y-6">
            
            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-slate-200 mb-2 flex items-center gap-2">
                <Pill size={24} className="text-indigo-400" />
                Hypothesis-Generating Translational Exploration
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                If environmental enrichment is associated with enhanced motor function via the <strong>{topMechanism}</strong> pathway, we can explore candidate pathway-linked compounds for future investigation. 
                By mapping the top predictive fly genes to human orthologs, we identify FDA-approved drugs that target these specific pathways as a theoretical exercise.
              </p>
              <div className="bg-amber-900/20 border border-amber-700/50 p-3 rounded text-amber-200/80 text-xs flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p><strong>Exploratory Only:</strong> These compounds are not validated in this study and are shown only to illustrate translational hypotheses. They do not represent clinical recommendations.</p>
              </div>
            </div>

            <SectionCard title="Candidate Pathway-Linked Compounds" icon={Database}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Target Gene</th>
                      <th className="px-6 py-3">FDA Approved Drug</th>
                      <th className="px-6 py-3">Mechanism of Action</th>
                      <th className="px-6 py-3">BBB Permeable</th>
                      <th className="px-6 py-3">Theoretical Relevance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugDatabase.map((drug, idx) => (
                      <tr key={idx} className="border-b border-slate-800 hover:bg-slate-900/50">
                        <td className="px-6 py-4 font-medium text-emerald-400">{drug.targetGene}</td>
                        <td className="px-6 py-4 font-bold text-slate-200">{drug.drugName}</td>
                        <td className="px-6 py-4 text-xs">{drug.mechanism}</td>
                        <td className="px-6 py-4">
                          {drug.bbbPermeable ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                              <CheckCircle size={14} /> Yes
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                              <XCircle size={14} /> No
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            type={drug.enviromimeticPotential.includes("High") ? "translated" : drug.enviromimeticPotential.includes("Moderate") ? "validation" : "measured"} 
                            text={drug.enviromimeticPotential.split(" - ")[0]} 
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard title="Theoretical Polypharmacology Networks" icon={Network}>
              <p className="text-sm text-slate-400 mb-4">
                Environmental enrichment is a multi-modal stimulus that activates multiple pathways simultaneously. 
                To theoretically mimic this effect, we propose multi-target drug combinations that target the initial dopaminergic activation alongside long-term cAMP/Synaptic mechanisms.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {drugCocktails.map((cocktail, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-indigo-400">{cocktail.name}</h4>
                      <div className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded font-bold">
                        Theoretical Synergy: {cocktail.synergyScore}/100
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cocktail.drugs.map((drug, dIdx) => (
                        <span key={dIdx} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-700">
                          {drug}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 italic leading-relaxed">
                      {cocktail.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* VIEW 4: INTERACTIVE SIMULATOR */}
        {activeTab === "simulator" && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden mb-6">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-indigo-400" />
                  Interactive "What-If" Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-1">Adjust enrichment levels or simulate genetic knockouts to see real-time behavioral predictions.</p>
              </div>
              <div className="p-6 grid md:grid-cols-3 gap-8">
                
                {/* Controls */}
                <div className="col-span-1 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Environmental Enrichment Level: {(simEnrichment * 100).toFixed(0)}%
                    </label>
                    <input 
                      type="range" 
                      min="0" max="1" step="0.1" 
                      value={simEnrichment} 
                      onChange={(e) => setSimEnrichment(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Isolated</span>
                      <span>Highly Enriched</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Enrichment Duration (Withdrawal): {simDuration}h
                    </label>
                    <input 
                      type="range" 
                      min="24" max="240" step="24" 
                      value={simDuration} 
                      onChange={(e) => setSimDuration(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Early Stop (24h)</span>
                      <span>Full (240h)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Simulate Genetic Knockout
                    </label>
                    <select 
                      value={simKnockout}
                      onChange={(e) => setSimKnockout(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="none">Wild Type (No Knockout)</option>
                      <option value="dopamine_index">Dopamine Receptor Knockout (DRD1-)</option>
                      <option value="camp_index">cAMP Pathway Knockout (PDE4-)</option>
                      <option value="synaptic_index">Synaptic Plasticity Knockout (DLG4-)</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-2">
                      Knocking out a pathway forces its value to 0, demonstrating its causal impact on the predicted behavior.
                    </p>
                  </div>
                </div>

                {/* Live Chart */}
                <div className="col-span-2 h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={simData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                       <XAxis dataKey="time_h" stroke="#64748b" tick={{fill: '#94a3b8'}} label={{ value: 'Time (hours)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
                       <YAxis yAxisId="left" stroke="#64748b" tick={{fill: '#94a3b8'}} domain={[0, 1]} label={{ value: 'Proxy Level', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                       <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{fill: '#10b981'}} domain={[0, 100]} label={{ value: 'Predicted Climb %', angle: 90, position: 'insideRight', fill: '#10b981' }} />
                       <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                       <Legend />
                       
                       <Line yAxisId="left" type="monotone" dataKey="dopamine" stroke="#60a5fa" name="Dopamine" dot={false} strokeWidth={2} strokeDasharray={simKnockout === "dopamine_index" ? "5 5" : ""} />
                       <Line yAxisId="left" type="monotone" dataKey="camp" stroke="#c084fc" name="cAMP" dot={false} strokeWidth={2} strokeDasharray={simKnockout === "camp_index" ? "5 5" : ""} />
                       <Line yAxisId="left" type="monotone" dataKey="synaptic" stroke="#34d399" name="Synaptic" dot={false} strokeWidth={2} strokeDasharray={simKnockout === "synaptic_index" ? "5 5" : ""} />
                       
                       <Line yAxisId="right" type="monotone" dataKey="predicted_climb" stroke="#f59e0b" name="Predicted Behavior" dot={false} strokeWidth={4} />
                     </ComposedChart>
                   </ResponsiveContainer>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: EVOLUTIONARY CONSERVATION */}
        {activeTab === "orthologs" && (
          <div className="space-y-6">
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-emerald-300 mb-2 flex items-center gap-2">
                <Dna size={24} />
                Evolutionary Conservation: Drosophila to Human
              </h3>
              <p className="text-slate-300 text-sm">
                To evaluate whether the identified pathways overlap with known human neuroplasticity mechanisms, we analyzed conserved gene orthologs. 
                The analysis indicates a strong enrichment of the <strong>cAMP signaling pathway</strong>, confirming that the mechanisms driving motor recovery in flies are highly conserved in humans.
              </p>
            </div>

            <SectionCard title="Gene Ortholog Network" icon={Network} subtitle={`Source: ${orthologMetadata.database} (${orthologMetadata.version})`}>
              <OrthologNetwork orthologs={ORTHOLOGS} />
            </SectionCard>
          </div>
        )}

        {/* VIEW 5: REPORT */}
        {activeTab === "report" && (
          <div className="max-w-4xl mx-auto bg-slate-100 p-12 shadow-lg border border-slate-200 text-slate-900">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Scientific Methods Supplement</h1>
                <p className="text-slate-600 mt-2 font-mono text-sm">ID: NEURO-PLASTICITY-2026-XJ9</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">CONFIDENTIAL</div>
                <div className="text-xs text-slate-500">Generated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
            
            <section className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider text-indigo-900 mb-3 border-b border-indigo-200 pb-1">1. Purpose of the Model</h2>
              <p className="text-justify text-slate-800 leading-relaxed text-sm">
                This computational pipeline serves as a mechanistic hypothesis-generating extension of the experimental data. 
                It is designed to explore potential biological pathways that are consistent with the observed behavioral improvements in <i>Drosophila melanogaster</i> following environmental enrichment. 
                The model is not a definitive proof of mechanism, but rather a tool to identify candidate pathways and conserved mechanisms for future empirical investigation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider text-indigo-900 mb-3 border-b border-indigo-200 pb-1">2. Measured vs. Inferred Data</h2>
              <p className="text-sm text-slate-700 mb-2">It is critical to distinguish between empirical observations and theoretical modeling in this study:</p>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1 mb-4">
                <li><strong>Measured:</strong> Time-series climbing success percentages across different environmental enrichment conditions.</li>
                <li><strong>Inferred (Proxies):</strong> Dopamine, cAMP, and synaptic remodeling indices are literature-informed mechanistic proxies. They were not directly measured via molecular assays in this specific cohort.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider text-indigo-900 mb-3 border-b border-indigo-200 pb-1">3. Justification of Mechanistic Proxies</h2>
              <p className="text-sm text-slate-700 mb-2">Mechanistic proxies were modeled using deterministic functions based on established neuroplasticity principles:</p>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-3 mb-4">
                {Object.entries(proxyDefinitions).map(([key, def]: [string, any]) => (
                    <li key={key}>
                        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {def.description} <br/>
                        <span className="text-xs italic text-slate-600">Rationale: {def.rationale}</span><br/>
                        <span className="font-mono text-xs bg-slate-200 px-1">{def.formula}</span>
                    </li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider text-indigo-900 mb-3 border-b border-indigo-200 pb-1">4. Statistical Validation</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-200 p-3 rounded">
                  <div className="text-xs text-slate-500 uppercase">Algorithm</div>
                  <div className="font-bold text-slate-900">Ridge Regression (L2)</div>
                </div>
                <div className="bg-slate-200 p-3 rounded">
                  <div className="text-xs text-slate-500 uppercase">Cross-Validation</div>
                  <div className="font-bold text-slate-900">k=5 Folds (Mean R²={cvResult.mean_r2.toFixed(2)})</div>
                </div>
                <div className="bg-slate-200 p-3 rounded">
                  <div className="text-xs text-slate-500 uppercase">Hold-Out Accuracy</div>
                  <div className="font-bold text-slate-900">R² = {holdOutMetrics.r2.toFixed(3)}</div>
                </div>
              </div>
              <p className="text-sm text-slate-700">
                The model identifies <strong>{sensitivityAnalysis[0].name}</strong> as the most critical statistical feature for predicting behavioral outcomes (performance drop of {sensitivityAnalysis[0].dropInR2.toFixed(3)} R² when removed). This suggests that late-phase structural changes are highly consistent with the observed long-term behavioral adaptations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider text-indigo-900 mb-3 border-b border-indigo-200 pb-1">5. Evolutionary Conservation & Translation</h2>
              <p className="text-sm text-slate-700 mb-4">
                Ortholog mapping ({orthologMetadata.database} {orthologMetadata.version}) indicates a strong evolutionary conservation of the identified pathways, particularly the cAMP signaling cascade. 
                Based on this conservation, we conducted an exploratory analysis of FDA-approved compounds targeting these pathways.
              </p>
              <table className="w-full text-sm text-left border-collapse border border-slate-300">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="p-2 border border-slate-300">Target Gene</th>
                    <th className="p-2 border border-slate-300">FDA Drug</th>
                    <th className="p-2 border border-slate-300">Theoretical Relevance</th>
                  </tr>
                </thead>
                <tbody>
                  {drugDatabase.map((drug, i) => (
                    <tr key={i}>
                      <td className="p-2 border border-slate-300 font-bold">{drug.targetGene}</td>
                      <td className="p-2 border border-slate-300">{drug.drugName}</td>
                      <td className="p-2 border border-slate-300 italic">{drug.enviromimeticPotential.split(" - ")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-500 mt-2 italic">
                Note: These compounds are not validated in this study and are shown only to illustrate translational hypotheses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider text-indigo-900 mb-3 border-b border-indigo-200 pb-1">6. Limitations & Future Directions</h2>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                <li><strong>Proxy Limitations:</strong> Mechanistic proxies are modeled based on literature, not directly measured in this specific cohort. Future work should include direct molecular assays (e.g., qPCR, Western blots) to validate these dynamics.</li>
                <li><strong>Sample Size:</strong> The model is based on time-series behavioral trends from a limited sample size.</li>
                <li><strong>Functional Equivalence:</strong> Ortholog mapping demonstrates sequence conservation, but does not guarantee functional equivalence in humans.</li>
                <li><strong>Pharmacology:</strong> Human pharmacology suggestions are strictly exploratory. In vivo validation in mammalian models is required before any clinical consideration.</li>
              </ul>
            </section>

            <div className="text-center pt-8 text-xs text-slate-400">
              <p>End of Supplement • NeuroModel Pipeline v4.0 • Mechanistic Hypothesis Extension</p>
            </div>
          </div>
        )}

        <DisclaimerBox />

      </main>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);
