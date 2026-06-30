export function formatDate(
  date?: string,
) {
  if (!date) {
    return 'Sem data';
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return 'Data inválida';
  }

  return parsedDate.toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
    },
  );
}