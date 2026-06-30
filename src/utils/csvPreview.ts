import {
    parseCsvTransactions,
    type ParsedCsvTransaction,
  } from './csvTransactionParser';
  
  export type CsvColumnSuggestion = {
    date?: string;
  
    description?: string;
  
    amount?: string;
  };
  
  export type CsvPreviewResult = {
    headers: string[];
  
    suggestedColumns: CsvColumnSuggestion;
  
    transactions: ParsedCsvTransaction[];
  
    incomeCount: number;
  
    expenseCount: number;
  
    incomeTotal: number;
  
    expenseTotal: number;
  
    balance: number;
  };
  
  function normalizeHeader(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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
  
      current += char;
    }
  
    result.push(current.trim());
  
    return result;
  }
  
  function findHeaderByKeywords(
    headers: string[],
    keywords: string[],
  ) {
    return headers.find((header) => {
      const normalizedHeader =
        normalizeHeader(header);
  
      return keywords.some((keyword) =>
        normalizedHeader.includes(
          normalizeHeader(keyword),
        ),
      );
    });
  }
  
  export function getCsvHeaders(
    csvContent: string,
  ) {
    const firstLine =
      csvContent
        .split(/\r?\n/)
        .find((line) => line.trim().length > 0) ?? '';
  
    return splitCsvLine(firstLine);
  }
  
  export function suggestCsvColumns(
    headers: string[],
  ): CsvColumnSuggestion {
    const date =
      findHeaderByKeywords(headers, [
        'date',
        'data',
        'dt',
        'posted',
        'lancamento',
      ]);
  
    const description =
      findHeaderByKeywords(headers, [
        'description',
        'descricao',
        'descrição',
        'historico',
        'histórico',
        'memo',
        'merchant',
        'titulo',
        'title',
        'name',
      ]);
  
    const amount =
      findHeaderByKeywords(headers, [
        'amount',
        'valor',
        'value',
        'quantia',
        'preco',
        'preço',
        'total',
      ]);
  
    return {
      date,
      description,
      amount,
    };
  }
  
  export function buildCsvPreview({
    csvContent,
    dateColumn,
    descriptionColumn,
    amountColumn,
  }: {
    csvContent: string;
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string;
  }): CsvPreviewResult {
    const headers =
      getCsvHeaders(csvContent);
  
    const suggestedColumns =
      suggestCsvColumns(headers);
  
    const transactions =
      parseCsvTransactions({
        csvContent,
  
        columnMap: {
          date: dateColumn,
          description:
            descriptionColumn,
          amount: amountColumn,
        },
      });
  
    const incomeTransactions =
      transactions.filter(
        (transaction) =>
          transaction.type === 'income',
      );
  
    const expenseTransactions =
      transactions.filter(
        (transaction) =>
          transaction.type === 'expense',
      );
  
    const incomeTotal =
      incomeTransactions.reduce(
        (acc, transaction) =>
          acc + transaction.amount,
        0,
      );
  
    const expenseTotal =
      expenseTransactions.reduce(
        (acc, transaction) =>
          acc + transaction.amount,
        0,
      );
  
    return {
      headers,
  
      suggestedColumns,
  
      transactions,
  
      incomeCount:
        incomeTransactions.length,
  
      expenseCount:
        expenseTransactions.length,
  
      incomeTotal,
  
      expenseTotal,
  
      balance:
        incomeTotal - expenseTotal,
    };
  }