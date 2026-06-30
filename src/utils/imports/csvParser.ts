import {
    normalizeImportedTransaction,
    parseBrazilianCurrency,
    type NormalizedImportedTransaction,
  } from './transactionNormalizer';
  
  export type CsvColumnMap = {
    date: string;
  
    description: string;
  
    amount: string;
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
  
      if (
        (char === ',' || char === ';') &&
        !insideQuotes
      ) {
        result.push(current.trim());
        current = '';
        continue;
      }
  
      current += char;
    }
  
    result.push(current.trim());
  
    return result;
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
  
  export function parseCsvTransactions({
    csvContent,
    columnMap,
  }: {
    csvContent: string;
    columnMap: CsvColumnMap;
  }): NormalizedImportedTransaction[] {
    const lines =
      csvContent
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);
  
    if (lines.length <= 1) {
      return [];
    }
  
    const headers =
      splitCsvLine(lines[0]);
  
    const normalizedHeaders =
      headers.map(normalizeHeader);
  
    const dateIndex =
      normalizedHeaders.indexOf(
        normalizeHeader(columnMap.date),
      );
  
    const descriptionIndex =
      normalizedHeaders.indexOf(
        normalizeHeader(columnMap.description),
      );
  
    const amountIndex =
      normalizedHeaders.indexOf(
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
      const columns =
        splitCsvLine(line);
  
      const date =
        columns[dateIndex] ?? '';
  
      const description =
        columns[descriptionIndex] ?? '';
  
      const signedAmount =
        parseBrazilianCurrency(
          columns[amountIndex] ?? '0',
        );
  
      return normalizeImportedTransaction({
        date,
        description,
        signedAmount,
      });
    });
  }