import { useEffect, useRef, useState } from 'react';
import { lembretesCondicoesPorTurno } from './condicoesFicha';
import {
  comprarRecursoPorEsforco, consumirAcaoCompleta, consumirInteracaoGratuita,
  consumirRecursoNormal,
  saNaJanelaEsforco, type EstadoEconomiaAcoes, type RecursoAcao,
} from './economiaAcoes';
import {
  aplicarManobraCombate, carregarEstadoTurnoCombate, encerrarTurnoCombate,
  iniciarTurnoCombate, type EstadoTurnoCombate,
} from './estadoTurnoCombate';
import { registrarDisparada, registrarFuga, registrarMirar, registrarAtaque } from './manobrasOperacionais';

type Props = {
  dados: Record<string, unknown>;
  saAtual: number;
  aoSalvar: (patch: Record<string, unknown>) => Promise<boolean>;
  origemDados?: 'local' | 'servidor';
};

const RECURSOS: { id: RecursoAcao; nome: string; custo: string }[] = [
  { id: 'acao', nome: 'Ação', custo: '2 SA' },
  { id: 'movimento', nome: 'Movimento', custo: '1 SA' },
  { id: 'acaoBonus', nome: 'Ação Bônus', custo: '1 SA' },
  { id: 'reacao', nome: 'Reação', custo: '1 SA' },
];

function carregarEstado(dados: Record<string, unknown>, saAtual: number) {
  return carregarEstadoTurnoCombate(dados.estadoTurnoCombate, dados.economiaAcoes, saAtual);
}

function comEconomia(
  estado: EstadoTurnoCombate,
  operacao: (economia: EstadoEconomiaAcoes) => EstadoEconomiaAcoes,
): EstadoTurnoCombate {
  return { ...estado, economia: operacao(estado.economia) };
}

