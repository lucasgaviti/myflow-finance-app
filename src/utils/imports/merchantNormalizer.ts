function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
  
  function titleCase(value: string) {
    return value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => {
        if (word.length <= 2) {
          return word;
        }
  
        return (
          word.charAt(0).toUpperCase() +
          word.slice(1)
        );
      })
      .join(' ');
  }
  
  const KNOWN_MERCHANTS: Array<{
    keywords: string[];
    title: string;
  }> = [
    {
      keywords: [
        'atacadao',
        'atacadao 060',
      ],
      title: 'Atacadão',
    },
    {
      keywords: [
        'mercado livre',
        'mercadolivre',
        'mercado pago',
      ],
      title: 'Mercado Livre',
    },
    {
      keywords: [
        'ifood',
      ],
      title: 'iFood',
    },
    {
      keywords: [
        'sem parar',
      ],
      title: 'Sem Parar',
    },
    {
      keywords: [
        'uber',
        'uber trip',
      ],
      title: 'Uber',
    },
    {
      keywords: [
        '99app',
        '99 pop',
        '99 tecnologia',
      ],
      title: '99',
    },
    {
      keywords: [
        'drogal',
      ],
      title: 'Drogal',
    },
    {
      keywords: [
        'droga raia',
        'raia drogasil',
      ],
      title: 'Droga Raia',
    },
    {
      keywords: [
        'pague menos',
      ],
      title: 'Pague Menos',
    },
    {
      keywords: [
        'netflix',
      ],
      title: 'Netflix',
    },
    {
      keywords: [
        'spotify',
      ],
      title: 'Spotify',
    },
    {
      keywords: [
        'amazon',
        'amazon marketplace',
      ],
      title: 'Amazon',
    },
    {
      keywords: [
        'google',
        'google play',
      ],
      title: 'Google',
    },
    {
      keywords: [
        'apple',
        'apple.com',
      ],
      title: 'Apple',
    },
    {
      keywords: [
        'shell',
      ],
      title: 'Shell',
    },
    {
      keywords: [
        'ipiranga',
      ],
      title: 'Ipiranga',
    },
    {
      keywords: [
        'posto',
        'auto posto',
      ],
      title: 'Posto de Combustível',
    },
  ];
  
  function findKnownMerchant(
    description: string,
  ) {
    const normalized =
      normalizeText(description);
  
    return KNOWN_MERCHANTS.find((merchant) =>
      merchant.keywords.some((keyword) =>
        normalized.includes(
          normalizeText(keyword),
        ),
      ),
    );
  }
  
  function cleanBankNoise(value: string) {
    return value
      .replace(/compra no debito:/gi, '')
      .replace(/compra no débito:/gi, '')
      .replace(/no estabelecimento/gi, '')
      .replace(/pix enviado:/gi, 'Pix para')
      .replace(/pix recebido:/gi, 'Pix de')
      .replace(/pagamento efetuado:/gi, '')
      .replace(/transferencia enviada:/gi, 'Transferência para')
      .replace(/transferência enviada:/gi, 'Transferência para')
      .replace(/transferencia recebida:/gi, 'Transferência de')
      .replace(/transferência recebida:/gi, 'Transferência de')
      .replace(/"/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function removeLocationNoise(value: string) {
    return value
      .replace(/\bSAO PAULO\b/gi, '')
      .replace(/\bSÃO PAULO\b/gi, '')
      .replace(/\bSP\b/gi, '')
      .replace(/\bBRA\b/gi, '')
      .replace(/\bBRASIL\b/gi, '')
      .replace(/\bBR\b/gi, '')
      .replace(/\bLTDA\b/gi, '')
      .replace(/\bS\/A\b/gi, '')
      .replace(/\bSA\b/gi, '')
      .replace(/\bME\b/gi, '')
      .replace(/\bEIRELI\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  function removeTerminalCodes(value: string) {
    return value
      .replace(/\b\d{2,}\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  export function normalizeMerchantTitle(
    description: string,
  ) {
    const knownMerchant =
      findKnownMerchant(description);
  
    if (knownMerchant) {
      return knownMerchant.title;
    }
  
    const cleaned =
      removeTerminalCodes(
        removeLocationNoise(
          cleanBankNoise(description),
        ),
      );
  
    if (!cleaned) {
      return description.trim();
    }
  
    return titleCase(cleaned);
  }