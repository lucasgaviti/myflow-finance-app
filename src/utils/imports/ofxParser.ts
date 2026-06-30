import {
  normalizeImportedTransaction,
  type NormalizedImportedTransaction,
} from './transactionNormalizer';

function extractTag(
  content: string,
  tag: string,
) {
  const regex = new RegExp(
    `<${tag}>([^<\\r\\n]*)`,
    'i',
  );

  return content.match(regex)?.[1]?.trim();
}

function parseOfxAmount(value: string) {
  const normalized = value
    .trim()
    .replace(',', '.');

  const parsed = Number(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseOfxDate(value: string) {
  const cleaned =
    value.replace(/\D/g, '').substring(0, 8);

  const year =
    cleaned.substring(0, 4);

  const month =
    cleaned.substring(4, 6);

  const day =
    cleaned.substring(6, 8);

  return `${year}-${month}-${day}`;
}

function getDescription(block: string) {
  return (
    extractTag(block, 'MEMO') ??
    extractTag(block, 'NAME') ??
    extractTag(block, 'FITID') ??
    'Transação sem descrição'
  );
}

export async function parseOfxTransactions(
  file: File,
): Promise<
  NormalizedImportedTransaction[]
> {
  const content =
    await file.text();

  const normalizedContent =
    content.replace(/\r/g, '');

  const blocks =
    normalizedContent
      .split(/<STMTTRN>/i)
      .slice(1);

  return blocks
    .map((block) => {
      const amount =
        extractTag(block, 'TRNAMT');

      const date =
        extractTag(block, 'DTPOSTED');

      const description =
        getDescription(block);

      if (!amount || !date) {
        return null;
      }

      return normalizeImportedTransaction({
        date:
          parseOfxDate(date),

        description,

        signedAmount:
          parseOfxAmount(amount),
      });
    })
    .filter(
      (
        transaction,
      ): transaction is NormalizedImportedTransaction =>
        transaction !== null,
    );
}