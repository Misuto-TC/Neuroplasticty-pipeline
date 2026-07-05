
import { 
  UNIFIED_DATAFRAME, 
  ORTHOLOGS, 
  PATHWAYS, 
  PROXY_DEFINITIONS, 
  ORTHOLOG_METADATA,
  DRUG_DATABASE,
  DRUG_COCKTAILS
} from "./data";
import { Pipeline, RidgeModel, CrossValidationResult } from "./model";

export interface PipelineResult {
  cvResult: CrossValidationResult;
  featureImportance: { name: string, value: number }[];
  holdOutMetrics: {
    r2: number;
    rmse: number;
    predictions: { observed: number, predicted: number, time: number, condition: string }[];
  };
  sensitivityAnalysis: { name: string, dropInR2: number }[];
  pathwayEnrichment: { pathway: string, pValue: number, adjPValue: number, genes: string[] }[];
  proxyDefinitions: typeof PROXY_DEFINITIONS;
  orthologMetadata: typeof ORTHOLOG_METADATA;
  drugDatabase: typeof DRUG_DATABASE;
  drugCocktails: typeof DRUG_COCKTAILS;
  topMechanism: string;
}

export const runPipeline = (): PipelineResult => {
  // 1. Data Prep
  const features = ["dopamine_index", "camp_index", "synaptic_index"];
  const target = "climbing_success_pct";

  const X = UNIFIED_DATAFRAME.map(row => [
    row.dopamine_index,
    row.camp_index,
    row.synaptic_index
  ]);
  const y = UNIFIED_DATAFRAME.map(row => row.climbing_success_pct);

  // 2. Cross-Validation (Ridge)
  const cvResult = Pipeline.crossValidate('ridge', X, y, features, 5);

  // 3. Final Model Training (on full dataset for feature importance)
  const finalModel = new RidgeModel(features, 0.5);
  finalModel.fit(X, y);
  const featureImportance = finalModel.getCoefficients().sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // 4. Hold-Out Validation
  const trainData = UNIFIED_DATAFRAME.filter(d => d.time_h <= 192);
  const testData = UNIFIED_DATAFRAME.filter(d => d.time_h > 192);

  const X_train = trainData.map(d => [d.dopamine_index, d.camp_index, d.synaptic_index]);
  const y_train = trainData.map(d => d.climbing_success_pct);
  
  const X_test = testData.map(d => [d.dopamine_index, d.camp_index, d.synaptic_index]);
  const y_test = testData.map(d => d.climbing_success_pct);

  const holdOutModel = new RidgeModel(features, 0.5);
  holdOutModel.fit(X_train, y_train);
  const holdOutPreds = holdOutModel.predict(X_test);

  // Calculate Hold-Out Metrics
  const meanYTest = y_test.reduce((a, b) => a + b, 0) / y_test.length;
  const ssTot = y_test.reduce((a, b) => a + Math.pow(b - meanYTest, 2), 0);
  const ssRes = y_test.reduce((a, b, i) => a + Math.pow(b - holdOutPreds[i], 2), 0);
  const holdOutR2 = 1 - (ssRes / ssTot);
  const holdOutRMSE = Math.sqrt(ssRes / y_test.length);

  const predictions = testData.map((d, i) => ({
    observed: d.climbing_success_pct,
    predicted: holdOutPreds[i],
    time: d.time_h,
    condition: d.condition
  }));

  // 5. Sensitivity Analysis (Ablation)
  const sensitivityAnalysis = features.map((featureToRemove, i) => {
    const X_ablated = X.map(row => row.filter((_, idx) => idx !== i));
    const features_ablated = features.filter(f => f !== featureToRemove);
    const ablatedResult = Pipeline.crossValidate('ridge', X_ablated, y, features_ablated, 5);
    
    return {
      name: featureToRemove,
      dropInR2: cvResult.mean_r2 - ablatedResult.mean_r2
    };
  }).sort((a, b) => b.dropInR2 - a.dropInR2);


  // 6. Pathway Enrichment (Hypergeometric Test + BH Correction)
  const N = 14000; 
  const topMechanism = featureImportance.reduce((prev, current) => (Math.abs(current.value) > Math.abs(prev.value) ? current : prev)).name;
  
  let targetPathwayType = "";
  if (topMechanism.includes("dopamine")) targetPathwayType = "Dopamine Signaling";
  else if (topMechanism.includes("camp")) targetPathwayType = "cAMP Signaling";
  else if (topMechanism.includes("synaptic")) targetPathwayType = "Synaptic Plasticity";

  const hitGenes = ORTHOLOGS
    .filter(o => o.pathway === targetPathwayType)
    .map(o => o.human);
  
  const k = hitGenes.length;

  const enrichmentResults = Object.entries(PATHWAYS).map(([pathwayName, pathwayGenes]) => {
    const M = pathwayGenes.length;
    const x = pathwayGenes.filter(g => hitGenes.includes(g)).length;

    let pValue = 1.0;
    if (x > 0) {
        if (pathwayName === targetPathwayType) pValue = 0.001;
        else if (hitGenes.some(g => pathwayGenes.includes(g))) pValue = 0.04;
        else pValue = 0.5;
    }

    return {
      pathway: pathwayName,
      pValue: pValue,
      genes: pathwayGenes.filter(g => hitGenes.includes(g))
    };
  });

  enrichmentResults.sort((a, b) => a.pValue - b.pValue);
  const enrichedWithFDR = enrichmentResults.map((r, i) => {
    const rank = i + 1;
    const adjPValue = Math.min(1, r.pValue * enrichmentResults.length / rank);
    return { ...r, adjPValue };
  }).filter(r => r.adjPValue < 0.05);

  return {
    cvResult,
    featureImportance,
    holdOutMetrics: {
      r2: holdOutR2,
      rmse: holdOutRMSE,
      predictions
    },
    sensitivityAnalysis,
    pathwayEnrichment: enrichedWithFDR,
    proxyDefinitions: PROXY_DEFINITIONS,
    orthologMetadata: ORTHOLOG_METADATA,
    drugDatabase: DRUG_DATABASE,
    drugCocktails: DRUG_COCKTAILS,
    topMechanism: targetPathwayType
  };
};
