import Groq from 'groq-sdk';

// Lazy initialization to avoid issues during build
let groqInstance: Groq | null = null;

function getGroq(): Groq {
  if (!groqInstance) {
    groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqInstance;
}

// On utilise Groq pour générer un "pseudo-embedding" via le LLM
// Alternative : utiliser OpenAI embeddings (meilleur mais payant)
// Pour le MVP, on utilise une approche simplifiée

/**
 * Génère un embedding pour un texte donné
 *
 * Option 1 (recommandée pour prod) : OpenAI embeddings
 * Option 2 (MVP) : Hash + LLM extraction de features
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Si OpenAI est configuré, l'utiliser (meilleure qualité)
  if (process.env.OPENAI_API_KEY) {
    return generateOpenAIEmbedding(text);
  }

  // Sinon, utiliser une approche simplifiée avec Groq
  return generateGroqEmbedding(text);
}

/**
 * Embedding via OpenAI (recommandé pour la prod)
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limite de tokens
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Embedding simplifié via Groq (pour MVP sans OpenAI)
 * Extrait des features sémantiques et les convertit en vecteur
 */
async function generateGroqEmbedding(text: string): Promise<number[]> {
  try {
    const groq = getGroq();

    // Extraire des features sémantiques via le LLM
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Tu es un système d'extraction de features. Analyse le texte et extrais des scores entre 0 et 1 pour ces 20 dimensions:
1. urgency (urgence)
2. sentiment_positive
3. sentiment_negative
4. formality (formalité)
5. complexity (complexité)
6. action_required (action requise)
7. financial_topic
8. technical_topic
9. relationship_topic
10. problem_mentioned
11. solution_offered
12. gratitude_expressed
13. frustration_expressed
14. question_asked
15. information_shared
16. request_made
17. deadline_mentioned
18. personal_tone
19. professional_tone
20. emotional_intensity

Réponds UNIQUEMENT avec un JSON: {"scores": [0.5, 0.3, ...]} (20 valeurs)`,
        },
        {
          role: 'user',
          content: text.slice(0, 2000),
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const scores = parsed.scores || [];

      // Padding pour atteindre 1536 dimensions (compatibilité pgvector)
      // On répète et varie les scores pour créer un vecteur de 1536
      return expandToFullEmbedding(scores, 1536);
    }
  } catch (e) {
    console.error('Error parsing Groq embedding response:', e);
  }

  // Fallback : embedding basé sur le hash du texte (déterministe)
  return generateHashBasedEmbedding(text, 1536);
}

/**
 * Étend un petit vecteur de features en embedding complet
 */
function expandToFullEmbedding(scores: number[], targetSize: number): number[] {
  const result: number[] = [];
  const baseScores = scores.length > 0 ? scores : [0.5];

  for (let i = 0; i < targetSize; i++) {
    const baseIndex = i % baseScores.length;
    const variation = Math.sin(i * 0.1) * 0.1; // Petite variation
    result.push(Math.max(0, Math.min(1, baseScores[baseIndex] + variation)));
  }

  // Normaliser le vecteur
  const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
  return result.map((val) => val / magnitude);
}

/**
 * Génère un embedding basé sur le hash du texte (déterministe)
 * Meilleur que random car le même texte donne le même embedding
 */
function generateHashBasedEmbedding(text: string, size: number): number[] {
  // Simple hash function
  const hash = (str: string, seed: number): number => {
    let h = seed;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i);
      h = h | 0; // Convert to 32-bit integer
    }
    return h;
  };

  const embedding: number[] = [];
  for (let i = 0; i < size; i++) {
    // Use different seeds for each dimension
    const h = hash(text, i * 7919); // 7919 is a prime number
    // Convert hash to a float between -1 and 1
    embedding.push((h % 1000000) / 1000000);
  }

  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
}

/**
 * Génère un embedding aléatoire (fallback)
 */
export function generateRandomEmbedding(size: number): number[] {
  const embedding = Array.from({ length: size }, () => Math.random() - 0.5);
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map((val) => val / magnitude);
}

/**
 * Calcule la similarité cosinus entre deux embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  // Guard contre la division par zéro (vecteur tout-zéro)
  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Formate un vecteur pour Supabase (format pgvector)
 */
export function formatEmbeddingForSupabase(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Parse un embedding depuis Supabase (format pgvector)
 */
export function parseEmbeddingFromSupabase(pgvectorString: string): number[] {
  // Remove brackets and split by comma
  const cleaned = pgvectorString.replace(/[\[\]]/g, '');
  return cleaned.split(',').map((s) => parseFloat(s.trim()));
}
