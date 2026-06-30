export type ParsedCsvTransaction = {
    date: string;
  
    description: string;
  
    amount: number;
  
    type: 'income' | 'expense';
  
    externalId: string;
  };
  
  type CsvColumnMap = {
    date: string;
  
    description: string;
  
    amount: string;
  };
  
  type ParseCsvParams = {
    csvContent: string;
  
    columnMap: CsvColumnMap;
  };
  
  function normalizeHeader(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
  
  function parseCurrencyValue(value: string) {
    const cleaned = value
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
  
    const parsed = Number(cleaned);
  
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  
  function normalizeDate(value: string) {
    const trimmed = value.trim();
  
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  
    const match = trimmed.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
    );
  
    if (!match) {
      return trimmed;
    }
  
    const [, day, month, year] = match;
  
    return `${year}-${month}-${day}`;
  }
  
  function createExternalId({
    date,
    description,
    amount,
  }: {
    date: string;
    description: string;
    amount: number;
  }) {
    return `${date}-${description}-${amount}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  
  function splitCsvLine(line: string) {
    const result: string[] = [];
    let current = '';
    let insideQuotes = false;
  
    for (const char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }
  
      if (char === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
        continue;
      }
  
      result.push(char);
    }
  
    result.push(current.trim());
  
    return result;
  }
  
  export function parseCsvTransactions({
    csvContent,
    columnMap,
  }: ParseCsvParams): ParsedCsvTransaction[] {
    const lines = csvContent
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);
  
    if (lines.length <= 1) {
      return [];
    }
  
    const headers = splitCsvLine(lines[0]).map(
      normalizeHeader,
    );
  
    const dateIndex = headers.indexOf(
      normalizeHeader(columnMap.date),
    );
  
    const descriptionIndex = headers.indexOf(
      normalizeHeader(columnMap.description),
    );
  
    const amountIndex = headers.indexOf(
      normalizeHeader(columnMap.amount),
    );
  
    if (
      dateIndex === -1 ||
      descriptionIndex === -1 ||
      amountIndex === -1
    ) {
      throw new Error(
        'Não foi possível identificar as colunas do CSV.',
      );
    }
  
    return lines.slice(1).map((line) => {
      const columns = splitCsvLine(line);
  
      const date = normalizeDate(
        columns[dateIndex] ?? '',
      );
  
      const description =
        columns[descriptionIndex] ?? '';
  
      const amount = parseCurrencyValue(
        columns[amountIndex] ?? '0',
      );
  
      const type =
        amount >= 0 ? 'income' : 'expense';
  
      const normalizedAmount = Math.abs(amount);
  
      return {
        date,
  
        description,
  
        amount: normalizedAmount,
  
        type,
  
        externalId: createExternalId({
          date,
          description,
          amount,
        }),
      };
    });
  }