import {
  getDocument,
  GlobalWorkerOptions,
} from 'pdfjs-dist';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import {
  normalizeImportedTransaction,
  parseBrazilianCurrency,
  type NormalizedImportedTransaction,
} from './transactionNormalizer';

GlobalWorkerOptions.workerSrc =
  pdfWorkerUrl;

const MONTHS_PT_BR: Record<string, string> = {
  janeiro: '01',
  fevereiro: '02',
  marco: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
};

function normalizeTextLine(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMonthName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractTransactionDateFromLine(
  line: string,
) {
  const match = line.match(
    /^(\d{1,2}) de ([a-zçãé]+) de (\d{4})/i,
  );

  if (!match) return null;

  const [, day, monthName, year] = match;

  const month =
    MONTHS_PT_BR[
      normalizeMonthName(monthName)
    ];

  if (!month) return null;

  return `${year}-${month}-${day.padStart(
    2,
    '0',
  )}`;
}

function extractSignedAmountFromLine(
  line: string,
) {
  const matches = Array.from(
    line.matchAll(/-?R\$\s?[\d.]+,\d{2}/g),
  );

  if (matches.length === 0) {
    return null;
  }

  return parseBrazilianCurrency(
    matches[0][0],
  );
}

function removeAmountsFromDescription(
  line: string,
) {
  return line
    .replace(/-?R\$\s?[\d.]+,\d{2}/g, '')
    .trim();
}

function isOnlyCurrencyValue(line: string) {
  return /^-?R\$\s?[\d.]+,\d{2}$/.test(line);
}

function shouldIgnoreLine(line: string) {
  return (
    line.length === 0 ||

    line.startsWith('Solicitado em:') ||

    line.includes('CPF/CNPJ:') ||

    line.includes('Instituição:') ||

    line.startsWith('Período:') ||

    line.startsWith('Saldo total') ||

    line.startsWith('Saldo disponível') ||

    line.startsWith('Saldo bloqueado') ||

    line.startsWith('Saldo do dia') ||

    line.includes('Saldo do dia:') ||

    line.startsWith('Valor Saldo por transação') ||

    line.startsWith('Fale com a gente') ||

    line.startsWith('SAC:') ||

    line.startsWith('Ouvidoria:') ||

    line.includes('Deficiência de fala') ||

    line === 'Valor' ||

    line === 'Saldo por transação'
  );
}

function parseTransactionsFromText(
  text: string,
) {
  const lines = text
    .split(/\r?\n/)
    .map(normalizeTextLine)
    .filter(Boolean);

  const transactions: NormalizedImportedTransaction[] = [];

  let currentDate: string | null = null;
  let pendingDescription: string | null = null;

  for (const line of lines) {
    const detectedDate =
      extractTransactionDateFromLine(line);

    if (detectedDate) {
      currentDate = detectedDate;
      pendingDescription = null;
      continue;
    }

    if (!currentDate || shouldIgnoreLine(line)) {
      continue;
    }

    const signedAmount =
      extractSignedAmountFromLine(line);

    if (signedAmount !== null) {
      const descriptionFromSameLine =
        removeAmountsFromDescription(line);

      const description =
        descriptionFromSameLine &&
        !isOnlyCurrencyValue(line)
          ? descriptionFromSameLine
          : pendingDescription;

      if (description) {
        transactions.push(
          normalizeImportedTransaction({
            date: currentDate,
            description,
            signedAmount,
          }),
        );

        pendingDescription = null;
      }

      continue;
    }

    pendingDescription = line;
  }

  return transactions;
}

export async function extractTextFromPdf(
  file: File,
) {
  const buffer =
    await file.arrayBuffer();

  const pdf =
    await getDocument({
      data: buffer,
    }).promise;

  const pageTexts: string[] = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber += 1
  ) {
    const page =
      await pdf.getPage(pageNumber);

    const content =
      await page.getTextContent();

    const text = content.items
      .map((item) =>
        'str' in item ? item.str : '',
      )
      .join('\n');

    pageTexts.push(text);
  }

  return pageTexts.join('\n');
}

export async function parsePdfTransactions(
  file: File,
) {
  const text =
    await extractTextFromPdf(file);

  return parseTransactionsFromText(text);
}