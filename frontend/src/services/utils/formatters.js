export function formatarData(data) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

export function dataDentroPeriodo(data, inicio, fim) {
  if (!data) return false;

  if (inicio && data < inicio) return false;
  if (fim && data > fim) return false;

  return true;
}
