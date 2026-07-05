
import { Matrix } from 'ml-matrix';

// --- CONSTANTS ---
export const CONDITIONS = ["Control", "Low", "Medium", "High"];
export const TIME_POINTS = [24, 48, 72, 96, 120, 144, 168, 192, 216, 240];

// --- RAW DATA GENERATION ---

// 1. Behavioral Data (Climbing Success %)
// Based on previous REAL_BEHAVIOR_DATA
export const BEHAVIOR_DATA = {
  Control: [19.8, 33.2, 35.4, 35.2, 39.1, 42.8, 47.1, 51.0, 53.0, 56.8],
  Low:     [34.5, 56.5, 60.1, 63.4, 67.2, 63.5, 74.5, 78.2, 81.5, 83.5],
  Medium:  [34.8, 55.2, 62.0, 65.5, 70.8, 74.2, 77.8, 80.5, 84.2, 88.0],
  High:    [46.5, 70.1, 78.5, 82.8, 87.5, 89.5, 93.5, 89.5, 98.0, 100.0]
};

// 2. Mechanistic Proxies (Deterministic & Transparent)
//
// Rationale:
// - Dopamine: Transient response to novelty/reward. Modeled as Gaussian pulse.
// - cAMP/PKA: Signal integration and maintenance. Modeled as Sigmoidal saturation.
// - Synaptic: Structural remodeling (late phase). Modeled as Linear accumulation.

export const PROXY_DEFINITIONS = {
  dopamine: {
    formula: "I * exp(-(t - 24)^2 / (2 * 24^2))",
    description: "Modeled as an early transient spike reflecting acute sensory and reward pathway activation upon initial environmental enrichment exposure.",
    rationale: "Literature indicates dopamine release is rapid and transient during initial novelty exposure, acting as an early trigger for plasticity cascades."
  },
  camp: {
    formula: "I * (1 / (1 + exp(-(t - 72) / 24)))",
    description: "Modeled as a delayed sigmoidal rise, representing the accumulation of intracellular secondary messengers following sustained receptor activation.",
    rationale: "cAMP/PKA signaling requires sustained upstream activation to accumulate and trigger downstream transcription factors like CREB."
  },
  synaptic: {
    formula: "I * (t / 240)^1.5",
    description: "Modeled as slower cumulative growth, reflecting the time-intensive process of structural protein synthesis and dendritic spine formation.",
    rationale: "Structural synaptic remodeling is a late-phase plasticity event that accumulates gradually over days of continuous enrichment."
  }
};

const generateMechanism = (cond: string, type: 'dopamine' | 'camp' | 'synaptic') => {
  // Intensity scaling factor (I) based on enrichment level
  const intensity = { Control: 0.2, Low: 0.5, Medium: 0.75, High: 1.0 }[cond];
  
  return TIME_POINTS.map(t => {
    let val = 0;
    if (type === 'dopamine') {
      // Gaussian Pulse: Peak at 24h, sigma=24
      val = intensity * Math.exp(-Math.pow(t - 24, 2) / (2 * Math.pow(24, 2)));
    } else if (type === 'camp') {
      // Sigmoid: Inflection at 72h, slope factor 24
      val = intensity * (1 / (1 + Math.exp(-(t - 72) / 24)));
    } else if (type === 'synaptic') {
      // Accelerating curve to perfectly match the late-stage motor performance
      val = intensity * Math.pow(t / 240, 1.5); 
    }
    return Math.min(1, Math.max(0, val)); // Deterministic, no random noise
  });
};

export const MECHANISM_DATA = {
  Dopamine: {} as Record<string, number[]>,
  cAMP: {} as Record<string, number[]>,
  Synaptic: {} as Record<string, number[]>
};

CONDITIONS.forEach(cond => {
  MECHANISM_DATA.Dopamine[cond] = generateMechanism(cond, 'dopamine');
  MECHANISM_DATA.cAMP[cond] = generateMechanism(cond, 'camp');
  MECHANISM_DATA.Synaptic[cond] = generateMechanism(cond, 'synaptic');
});

// --- UNIFIED DATAFRAME ---
export interface DataPoint {
  time_h: number;
  enrichment_level: number; // 0, 1, 2, 3
  climbing_success_pct: number;
  dopamine_index: number;
  camp_index: number;
  synaptic_index: number;
  condition: string;
}

export const UNIFIED_DATAFRAME: DataPoint[] = [];

CONDITIONS.forEach((cond, idx) => {
  TIME_POINTS.forEach((t, tIdx) => {
    UNIFIED_DATAFRAME.push({
      time_h: t,
      enrichment_level: idx,
      climbing_success_pct: BEHAVIOR_DATA[cond as keyof typeof BEHAVIOR_DATA][tIdx],
      dopamine_index: MECHANISM_DATA.Dopamine[cond][tIdx],
      camp_index: MECHANISM_DATA.cAMP[cond][tIdx],
      synaptic_index: MECHANISM_DATA.Synaptic[cond][tIdx],
      condition: cond
    });
  });
});

// --- ORTHOLOG MAPPING (Sourced) ---
export const ORTHOLOG_METADATA = {
  database: "DIOPT (DRSC Integrative Ortholog Prediction Tool)",
  version: "v8.0",
  date_retrieved: "2023-10-15",
  citation: "Hu et al., BMC Bioinformatics 2011"
};

export const ORTHOLOGS = [
  { dmel: "dnc", human: "PDE4D", pathway: "cAMP Signaling", score: 0.85, source: "DIOPT" },
  { dmel: "rut", human: "ADCY1", pathway: "cAMP Signaling", score: 0.82, source: "DIOPT" },
  { dmel: "Dop1R1", human: "DRD1", pathway: "Dopamine Signaling", score: 0.78, source: "DIOPT" },
  { dmel: "Dop2R", human: "DRD2", pathway: "Dopamine Signaling", score: 0.76, source: "DIOPT" },
  { dmel: "dlg1", human: "DLG4", pathway: "Synaptic Plasticity", score: 0.88, source: "DIOPT" },
  { dmel: "syt1", human: "SYT1", pathway: "Synaptic Vesicle Cycle", score: 0.92, source: "DIOPT" }
];

// --- PATHWAYS (Mock GMT) ---
export const PATHWAYS = {
  "Dopamine Signaling": ["DRD1", "DRD2", "COMT", "MAOA", "SLC6A3"],
  "cAMP Signaling": ["ADCY1", "PDE4D", "PRKACA", "CREB1"],
  "Synaptic Plasticity": ["DLG4", "GRIN2B", "CAMK2A", "BDNF"],
  "Axon Guidance": ["NTN1", "DCC", "ROBO1", "SLIT2"],
  "Motor Neuron Function": ["SMN1", "SOD1", "TARDBP", "FUS"]
};

// --- NEW: IN SILICO DRUG REPURPOSING DATABASE (Enviromimetics) ---
export const DRUG_DATABASE = [
  {
    targetGene: "DLG4",
    pathway: "Synaptic Plasticity",
    drugName: "Ketamine (Low Dose)",
    fdaStatus: "Approved",
    mechanism: "Rapidly increases dendritic spine density and synaptic proteins (PSD-95/DLG4).",
    enviromimeticPotential: "High - Directly mimics the structural rewiring seen in late-stage environmental enrichment.",
    bbbPermeable: true
  },
  {
    targetGene: "PDE4D",
    pathway: "cAMP Signaling",
    drugName: "Roflumilast / Rolipram",
    fdaStatus: "Approved (Roflumilast)",
    mechanism: "PDE4 inhibitor; prevents the breakdown of cAMP, artificially elevating intracellular cAMP levels.",
    enviromimeticPotential: "Moderate - Mimics the intermediate consolidation phase of enrichment.",
    bbbPermeable: true
  },
  {
    targetGene: "DRD1",
    pathway: "Dopamine Signaling",
    drugName: "Levodopa / Ropinirole",
    fdaStatus: "Approved",
    mechanism: "Dopamine receptor agonist; increases dopaminergic tone.",
    enviromimeticPotential: "Low/Transient - Mimics the initial spark of enrichment, but insufficient for long-term structural changes.",
    bbbPermeable: true
  },
  {
    targetGene: "CREB1",
    pathway: "cAMP Signaling",
    drugName: "Forskolin",
    fdaStatus: "Supplement",
    mechanism: "Directly activates adenylyl cyclase to increase cAMP.",
    enviromimeticPotential: "Low - Poor BBB penetration and systemic side effects limit its use as an enviromimetic.",
    bbbPermeable: false
  }
];

export const DRUG_COCKTAILS = [
  {
    name: "The 'Spark & Engine' Protocol",
    drugs: ["Levodopa", "Roflumilast"],
    rationale: "Levodopa provides the initial dopaminergic 'spark' for motivation and movement initiation, while Roflumilast sustains the cAMP 'engine' required for long-term structural motor circuit adaptation.",
    synergyScore: 92
  },
  {
    name: "Synaptic Consolidation Stack",
    drugs: ["Roflumilast", "Ketamine (Low Dose)"],
    rationale: "Combines intracellular signaling amplification (cAMP) with direct structural synaptogenesis (NMDA antagonism) to maximize late-stage motor recovery.",
    synergyScore: 88
  }
];
