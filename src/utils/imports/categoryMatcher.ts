export type CategorySuggestion = {
  category: string;

  confidence: 'high' | 'medium' | 'low';

  matchedKeyword?: string;
};

const CATEGORY_RULES: Array<{
  category: string;
  keywords: string[];
  confidence?: 'high' | 'medium';
}> = [
  {
    category: 'Receitas',
    confidence: 'high',
    keywords: [
      'pix recebido',
      'pix de',
      'salario',
      'salário',
      'pagamento salario',
      'pagamento salário',
      'resgate',
      'resgate poupanca',
      'resgate poupança',
      'rendimento',
      'devolucao',
      'devolução',
      'estorno',
    ],
  },
  {
    category: 'Investimentos',
    confidence: 'high',
    keywords: [
      'aplicacao',
      'aplicação',
      'aplicacao poupanca',
      'aplicação poupança',
      'poupanca',
      'poupança',
      'cdb',
      'tesouro direto',
      'renda fixa',
      'investimento',
      'corretora',
    ],
  },
  {
    category: 'Mercado',
    confidence: 'high',
    keywords: [
      'mercado',
      'supermercado',
      'atacadao',
      'atacadão',
      'assai',
      'assaí',
      'carrefour',
      'extra',
      'dia supermercado',
      'swift',
      'sup ',
      'irmaos boa',
      'irmãos boa',
      'carnes',
      'hortifruti',
      'padaria',
      'grande pao',
      'grande pão',
      'emporio',
      'empório',
      'mercearia',
      'sacolao',
      'sacolão',
    ],
  },
  {
    category: 'Alimentação',
    confidence: 'high',
    keywords: [
      'ifood',
      'restaurante',
      'lanches',
      'lanche',
      'delivery',
      'pastelaria',
      'acai',
      'açaí',
      'acai do museu',
      'açaí do museu',
      'espeto',
      'pizza',
      'pizzaria',
      'burger',
      'hamburguer',
      'hambúrguer',
      'cafeteria',
      'cafe',
      'café',
      'sorveteria',
      'churrasco',
      'churrascaria',
      'mcdonald',
      'burger king',
      'subway',
    ],
  },
  {
    category: 'Transporte',
    confidence: 'high',
    keywords: [
      'pedagio',
      'pedágio',
      'via colinas',
      'sem parar',
      'posto',
      'auto posto',
      'combustivel',
      'combustível',
      'gasolina',
      'etanol',
      'shell',
      'ipiranga',
      'uber',
      '99',
      '99app',
      'estacionamento',
      'zona azul',
      'metro',
      'metrô',
      'onibus',
      'ônibus',
      'recarga transporte',
    ],
  },
  {
    category: 'Saúde',
    confidence: 'high',
    keywords: [
      'farmacia',
      'farmácia',
      'drogal',
      'drogaria',
      'drogasil',
      'droga raia',
      'raia drogasil',
      'farma',
      'ultrafarma',
      'pague menos',
      'medicamento',
      'hospital',
      'clinica',
      'clínica',
      'laboratorio',
      'laboratório',
      'consulta',
      'exame',
      'dentista',
      'odonto',
    ],
  },
  {
    category: 'Moradia',
    confidence: 'high',
    keywords: [
      'aluguel',
      'condominio',
      'condomínio',
      'energia',
      'elektro',
      'cpfl',
      'enel',
      'sabesp',
      'agua',
      'água',
      'internet',
      'telefonica',
      'telefônica',
      'vivo',
      'claro',
      'tim',
      'oi',
      'net claro',
      'manutencao casa',
      'manutenção casa',
    ],
  },
  {
    category: 'Assinaturas',
    confidence: 'high',
    keywords: [
      'netflix',
      'spotify',
      'amazon prime',
      'prime video',
      'youtube',
      'youtube premium',
      'google one',
      'apple',
      'icloud',
      'wellhub',
      'gympass',
      'disney',
      'disney plus',
      'hbo',
      'max',
      'globoplay',
      'canva',
      'notion',
      'openai',
      'chatgpt',
    ],
  },
  {
    category: 'Compras',
    confidence: 'high',
    keywords: [
      'mercado livre',
      'mercadolivre',
      'mercado pago',
      'marketplace',
      'pix marketplace',
      'amazon',
      'shopee',
      'magazine',
      'magalu',
      'americanas',
      'aliexpress',
      'kabum',
      'renner',
      'riachuelo',
      'centauro',
      'loja',
      'shopping',
      'cosmetic',
      'cosmetico',
      'cosmético',
      'roupa',
      'calcado',
      'calçado',
    ],
  },
  {
    category: 'Pets',
    confidence: 'high',
    keywords: [
      'pet',
      'petville',
      'petlove',
      'cobasi',
      'petz',
      'racao',
      'ração',
      'veterinario',
      'veterinário',
      'banho e tosa',
    ],
  },
  {
    category: 'Lazer',
    confidence: 'medium',
    keywords: [
      'adega',
      'bar',
      'jogos',
      'cinema',
      'show',
      'evento',
      'shopping',
      'parque',
      'viagem',
      'hotel',
      'airbnb',
      'ingresso',
    ],
  },
  {
    category: 'Cartão',
    confidence: 'high',
    keywords: [
      'pagamento fatura',
      'fatura cartao',
      'fatura cartão',
      'cartao inter',
      'cartão inter',
      'pagamento cartao',
      'pagamento cartão',
    ],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findBestRule(
  description: string,
) {
  const normalizedDescription =
    normalizeText(description);

  const matches: Array<{
    category: string;
    keyword: string;
    normalizedKeyword: string;
    confidence: 'high' | 'medium';
  }> = [];

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword =
        normalizeText(keyword);

      if (
        normalizedKeyword &&
        normalizedDescription.includes(
          normalizedKeyword,
        )
      ) {
        matches.push({
          category: rule.category,
          keyword,
          normalizedKeyword,
          confidence:
            rule.confidence ??
            (normalizedKeyword.length >= 8
              ? 'high'
              : 'medium'),
        });
      }
    }
  }

  return matches.sort(
    (a, b) =>
      b.normalizedKeyword.length -
      a.normalizedKeyword.length,
  )[0];
}

export function suggestCategoryFromDescription(
  description: string,
): CategorySuggestion {
  const match =
    findBestRule(description);

  if (!match) {
    return {
      category: 'Sem categoria',

      confidence: 'low',
    };
  }

  return {
    category: match.category,

    confidence: match.confidence,

    matchedKeyword: match.keyword,
  };
}

export function suggestCategoryByTransactionType(
  type: 'income' | 'expense',
  description: string,
) {
  const suggestion =
    suggestCategoryFromDescription(
      description,
    );

  if (
    type === 'income' &&
    suggestion.category === 'Sem categoria'
  ) {
    return {
      category: 'Receitas',

      confidence: 'medium' as const,
    };
  }

  return suggestion;
}