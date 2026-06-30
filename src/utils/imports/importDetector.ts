export type ImportFileType =
  | 'csv'
  | 'pdf'
  | 'ofx'
  | 'unknown';

export function detectImportFileType(
  file: File,
): ImportFileType {
  const fileName =
    file.name.toLowerCase();

  const mimeType =
    file.type.toLowerCase();

  if (
    fileName.endsWith('.csv') ||
    mimeType.includes('csv')
  ) {
    return 'csv';
  }

  if (
    fileName.endsWith('.pdf') ||
    mimeType.includes('pdf')
  ) {
    return 'pdf';
  }

  if (
    fileName.endsWith('.ofx') ||
    fileName.endsWith('.qfx')
  ) {
    return 'ofx';
  }

  return 'unknown';
}

export function getImportFileLabel(
  type: ImportFileType,
) {
  switch (type) {
    case 'csv':
      return 'CSV';

    case 'pdf':
      return 'PDF';

    case 'ofx':
      return 'OFX';

    default:
      return 'Desconhecido';
  }
}