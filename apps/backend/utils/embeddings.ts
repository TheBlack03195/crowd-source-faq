import { logger } from './logger.js';

type FeatureExtractionPipeline = (
  text: string,
  options?: { pooling?: string; normalize?: boolean }
) => Promise<{ data: Float32Array }>;

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2')
    ) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}


export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}


export async function tryGenerateEmbedding(text: string): Promise<number[] | null> {
  try {
    return await generateEmbedding(text);
  } catch (err) {
    logger.warn('Embedding generation failed, continuing without it', {
      message: (err as Error).message,
    });
    return null;
  }
}

export const EMBEDDING_DIMENSIONS = 768;
export const EMBEDDING_MODEL = 'Xenova/all-mpnet-base-v2';
