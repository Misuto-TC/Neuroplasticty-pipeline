
import { Matrix, inverse } from 'ml-matrix';
import MultivariateLinearRegression from 'ml-regression-multivariate-linear';

// --- TYPES ---
export interface RegressionResult {
  coefficients: number[];
  intercept: number;
  r2: number;
  rmse: number;
  predictions: number[];
}

export interface CrossValidationResult {
  fold_r2: number[];
  mean_r2: number;
  std_r2: number;
}

// --- UTILS ---
const calculateR2 = (yTrue: number[], yPred: number[]) => {
  const meanY = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
  const ssTot = yTrue.reduce((acc, val) => acc + Math.pow(val - meanY, 2), 0);
  const ssRes = yTrue.reduce((acc, val, i) => acc + Math.pow(val - yPred[i], 2), 0);
  return 1 - (ssRes / ssTot);
};

const calculateRMSE = (yTrue: number[], yPred: number[]) => {
  const mse = yTrue.reduce((acc, val, i) => acc + Math.pow(val - yPred[i], 2), 0) / yTrue.length;
  return Math.sqrt(mse);
};

// Standardize features (Z-score normalization)
const standardize = (X: number[][]): { X_scaled: number[][], means: number[], stds: number[] } => {
  const rows = X.length;
  const cols = X[0].length;
  const means = Array(cols).fill(0);
  const stds = Array(cols).fill(0);

  // Calculate means
  for (let j = 0; j < cols; j++) {
    let sum = 0;
    for (let i = 0; i < rows; i++) sum += X[i][j];
    means[j] = sum / rows;
  }

  // Calculate stds
  for (let j = 0; j < cols; j++) {
    let sumSq = 0;
    for (let i = 0; i < rows; i++) sumSq += Math.pow(X[i][j] - means[j], 2);
    stds[j] = Math.sqrt(sumSq / rows) || 1; // Avoid division by zero
  }

  // Scale
  const X_scaled = X.map(row => row.map((val, j) => (val - means[j]) / stds[j]));
  return { X_scaled, means, stds };
};

// --- MODELS ---

// 1. Multiple Linear Regression (OLS)
export class LinearModel {
  private model: MultivariateLinearRegression | null = null;
  private featureNames: string[] = [];

  constructor(features: string[]) {
    this.featureNames = features;
  }

  fit(X: number[][], y: number[]) {
    // ml-regression expects y as Matrix (n x 1)
    const yMatrix = y.map(val => [val]);
    this.model = new MultivariateLinearRegression(X, yMatrix);
  }

  predict(X: number[][]): number[] {
    if (!this.model) return [];
    const predMatrix = this.model.predict(X);
    return predMatrix.map(row => row[0]);
  }

  getCoefficients(): { name: string, value: number }[] {
    if (!this.model) return [];
    const weights = this.model.weights; 
    return this.featureNames.map((name, i) => ({
      name,
      value: weights[i][0]
    }));
  }
}

// 2. Ridge Regression (L2 Regularization)
// Implementation: w = (X'X + lambda*I)^-1 X'y
export class RidgeModel {
  private weights: Matrix | null = null;
  private lambda: number = 0.1;
  private featureNames: string[] = [];
  private means: number[] = [];
  private stds: number[] = [];

  constructor(features: string[], lambda: number = 1.0) {
    this.featureNames = features;
    this.lambda = lambda;
  }

  fit(X: number[][], y: number[]) {
    // Standardize inputs
    const { X_scaled, means, stds } = standardize(X);
    this.means = means;
    this.stds = stds;

    const Xm = new Matrix(X_scaled);
    const ym = Matrix.columnVector(y);
    
    // Add bias column to X
    const ones = Matrix.ones(Xm.rows, 1);
    const X_bias = Xm.addColumn(0, ones); // Prepend column of 1s

    const Xt = X_bias.transpose();
    const XtX = Xt.mmul(X_bias);
    
    // Add lambda to diagonal (except bias term usually, but simple ridge adds to all)
    const I = Matrix.identity(XtX.rows, XtX.columns).mul(this.lambda);
    // Don't penalize intercept (index 0)
    I.set(0, 0, 0);

    const XtX_lambda = XtX.add(I);
    const inverseXtX = inverse(XtX_lambda);
    
    this.weights = inverseXtX.mmul(Xt).mmul(ym);
  }

  predict(X: number[][]): number[] {
    if (!this.weights) return [];
    
    // Standardize new data using stored means/stds
    const X_scaled = X.map(row => row.map((val, j) => (val - this.means[j]) / this.stds[j]));
    
    const Xm = new Matrix(X_scaled);
    const ones = Matrix.ones(Xm.rows, 1);
    const X_bias = Xm.addColumn(0, ones);
    
    const pred = X_bias.mmul(this.weights);
    return pred.getColumn(0);
  }

  getCoefficients(): { name: string, value: number }[] {
    if (!this.weights) return [];
    // weights[0] is intercept
    const w = this.weights.getColumn(0);
    return this.featureNames.map((name, i) => ({
      name,
      value: w[i + 1] // Skip intercept
    }));
  }
}

// --- PIPELINE ---
export class Pipeline {
  static crossValidate(
    modelType: 'linear' | 'ridge', 
    X: number[][], 
    y: number[], 
    features: string[],
    k: number = 5
  ): CrossValidationResult {
    const foldSize = Math.floor(X.length / k);
    const r2_scores: number[] = [];

    // Shuffle data deterministically (seeded shuffle would be better, but simple block CV is okay for time series if we want to test interpolation, but for random CV we need shuffle)
    // For time-series, block CV is often preferred to avoid leakage, but here we treat points as independent samples for the regression task given the features include time.
    // Let's stick to simple k-fold on the provided order (which is blocked by condition then time).
    // Actually, shuffling is important to ensure folds represent all conditions.
    
    // Deterministic shuffle indices
    const indices = Array.from({ length: X.length }, (_, i) => i);
    // Simple deterministic shuffle
    let seed = 42;
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const X_shuffled = indices.map(i => X[i]);
    const y_shuffled = indices.map(i => y[i]);

    for (let i = 0; i < k; i++) {
      const start = i * foldSize;
      const end = (i + 1) * foldSize;

      const X_test = X_shuffled.slice(start, end);
      const y_test = y_shuffled.slice(start, end);
      
      const X_train = [...X_shuffled.slice(0, start), ...X_shuffled.slice(end)];
      const y_train = [...y_shuffled.slice(0, start), ...y_shuffled.slice(end)];

      let model;
      if (modelType === 'linear') model = new LinearModel(features);
      else model = new RidgeModel(features, 0.5); // Fixed alpha for now, could optimize

      model.fit(X_train, y_train);
      const preds = model.predict(X_test);
      r2_scores.push(calculateR2(y_test, preds));
    }

    const mean = r2_scores.reduce((a, b) => a + b, 0) / k;
    const std = Math.sqrt(r2_scores.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / k);

    return { fold_r2: r2_scores, mean_r2: mean, std_r2: std };
  }
}
