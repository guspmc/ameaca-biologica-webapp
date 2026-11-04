import type { PersonagemLocal } from './persistenciaFicha';

export const FORMATO_BACKUP = 'ameaca-biologica-backup';
export const VERSAO_BACKUP = 1;

/** Gera um nome de cópia único sem ultrapassar o limite da ficha. */
export function nomeDeCopiaUnico(nomeOriginal: string, nomesExistentes: Iterable<string>): string {
  const existentes = new Set([...nomesExistentes].map(nome => nome.trim().toLocaleLowerCase('pt-BR')));
  let sufixo = 0;
  let candidato = '';
  do {
    sufixo += 1;
    const complemento = ` (cópia ${sufixo})`;
    const base = nomeOriginal.trim().slice(0, 80 - complemento.length).trimEnd();
    candidato = base + complemento;
  } while (existentes.has(candidato.toLocaleLowerCase('pt-BR')));
  return candidato;
}

export type BackupFicha = {
  formato: typeof FORMATO_BACKUP;
  versao: typeof VERSAO_BACKUP;
  exportadoEm: string;
  personagens: PersonagemLocal[];
};

function personagemValido(valor: unknown): valor is PersonagemLocal {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const p = valor as Partial<PersonagemLocal>;
  return typeof p.id === 'string' && p.id.trim().length > 0
    && typeof p.nome === 'string' && p.nome.trim().length >= 2 && p.nome.trim().length <= 80
    && typeof p.criadoEm === 'string' && !Number.isNaN(Date.parse(p.criadoEm))
    && typeof p.atualizadoEm === 'string' && !Number.isNaN(Date.parse(p.atualizadoEm))
    && !!p.dados && typeof p.dados === 'object' && !Array.isArray(p.dados);
}

export function criarBackup(personagens: PersonagemLocal[], exportadoEm = new Date().toISOString()): BackupFicha {
  if (!Array.isArray(personagens) || !personagens.every(personagemValido)
    || new Set(personagens.map(p => p.id)).size !== personagens.length) {
    throw new Error('Não foi possível exportar: a lista contém fichas inválidas ou IDs duplicados.');
  }
  return {
    formato: FORMATO_BACKUP,
    versao: VERSAO_BACKUP,
    exportadoEm,
    personagens: structuredClone(personagens),
  };
}

export function validarBackup(valor: unknown): BackupFicha {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new Error('O arquivo não contém um backup válido do Ameaça Biológica.');
  }
  const backup = valor as Partial<BackupFicha>;
  if (backup.formato !== FORMATO_BACKUP) {
    throw new Error('Este arquivo não é um backup do Ameaça Biológica.');
  }
  if (backup.versao !== VERSAO_BACKUP) {
    throw new Error('A versão deste backup não é compatível com esta versão do aplicativo.');
  }
  if (typeof backup.exportadoEm !== 'string' || Number.isNaN(Date.parse(backup.exportadoEm))) {
    throw new Error('A data do backup está ausente ou inválida.');
  }
  if (!Array.isArray(backup.personagens) || !backup.personagens.every(personagemValido)) {
    throw new Error('O backup contém uma ou mais fichas inválidas. Nenhuma ficha foi importada.');
  }
  if (new Set(backup.personagens.map(p => p.id)).size !== backup.personagens.length) {
    throw new Error('O backup contém identificadores duplicados. Nenhuma ficha foi importada.');
  }
  return structuredClone(backup as BackupFicha);
}

export function serializarBackup(backup: BackupFicha): string {
  return JSON.stringify(validarBackup(backup), null, 2);
}

export function lerArquivoBackup(texto: string): BackupFicha {
  let valor: unknown;
  try {
    valor = JSON.parse(texto);
  } catch {
    throw new Error('O arquivo não contém JSON válido. Nenhuma ficha foi importada.');
  }
  return validarBackup(valor);
}
