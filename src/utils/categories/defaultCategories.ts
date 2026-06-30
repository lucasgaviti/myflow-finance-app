export const DEFAULT_CATEGORIES = [
    'Receitas',
    'Transporte',
    'Mercado',
    'Alimentação',
    'Saúde',
    'Moradia',
    'Assinaturas',
    'Compras',
    'Pets',
    'Lazer',
    'Investimentos',
    'Cartão',
    'Educação',
    'Casa',
    'Serviços',
    'Despesas Diversas',
    'Sem categoria',
  ];
  
  export function mergeCategories(
    currentCategories: string[],
  ) {
    return Array.from(
      new Set([
        ...DEFAULT_CATEGORIES,
        ...currentCategories,
      ]),
    ).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    );
  }