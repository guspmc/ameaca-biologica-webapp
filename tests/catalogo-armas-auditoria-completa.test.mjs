import test from 'node:test';
import assert from 'node:assert/strict';
import { listarPerfisArma } from '../src/catalogoArmas.ts';
import { listarPerfisArmasFogo } from '../src/catalogoArmasFogo.ts';

// Valores de tabela conferidos com o Arquivo do Jogador v1.0, pp. 50–51.
const corpoACorpo = [
  ['bastao', 'Comum', '1d8', 2, '1/2', 1, 0, 2, '1 Moeda Antiga'],
  ['cutelo', 'Comum', '1d8', 3, '1', 1, 0, 2, '1 Moeda Antiga'],
  ['faca', 'Comum', '1d4', 2, '1', 1, 0, 2, '1 Moeda Antiga'],
  ['machadinha', 'Comum', '1d6', 3, '1', 1, 1, 2, '1 Moeda Antiga'],
  ['martelo', 'Comum', '1d6', 2, '1', 1, 0, 2, '1 Moeda Antiga'],
  ['punhal', 'Comum', '1d4', 3, '1', 1, 0, 1, '1 Moeda Antiga'],
  ['replica-espada', 'Comum', '1d8', 2, '1/2', 2, 1, 4, '1 Moeda Antiga'],
  ['replica-katana', 'Comum', '1d10', 2, '1/2', 2, 1, 3, '1 Moeda Antiga'],
  ['cassetete', 'Tática', '1d6', 2, '1', 1, 0, 3, '1 Moeda Antiga'],
  ['faca-combate', 'Tática', '1d6', 2, '1', 1, 2, 5, '1 Moeda Antiga'],
  ['hatchet', 'Tática', '2d4', 3, '1', 1, 3, 'Indestrutível', 'Exploração'],
  ['machado', 'Tática', '1d8', 3, '2', 2, 1, 3, '1 Moeda Antiga'],
  ['machete', 'Tática', '1d6', 2, '1', 1, 1, 4, '1 Moeda Antiga'],
  ['marreta', 'Tática', '3d4', 2, '2', 2, 1, 3, '1 Moeda Antiga'],
  ['motosserra', 'Tática', '3d6', 2, '2', 2, 0, 4, 'Exploração'],
];

test('tabela de todas as 15 armas corpo a corpo corresponde aos valores oficiais', () => {
  const perfis = listarPerfisArma().filter(item => item.categoria === 'corpo-a-corpo');
  assert.equal(perfis.length, corpoACorpo.length);
  for (const [id, grau, dano, critico, maos, espacos, pecas, durabilidade, aquisicao] of corpoACorpo) {
    const p = perfis.find(item => item.id === id);
    assert.ok(p, 'arma corpo a corpo ausente: ' + id);
    assert.deepEqual(
      [p.grau, p.dano, p.multiplicadorCritico, p.maos.join('/'), p.espacos, p.pecas, p.durabilidade, p.aquisicao],
      [grau, dano, critico, maos, espacos, pecas, durabilidade, aquisicao],
      'divergência na tabela: ' + id,
    );
  }
});

// Valores de tabela conferidos com o Arquivo do Jogador v1.0, pp. 53–61.
// A coluna de grau não se aplica a Magnums e Armas Especiais.
const armasDeFogo = [
  // Pistolas 9 mm, pp. 53–54
  ['jmb-hp3','Pistola 9 mm','Comum','1d8','x2',13,'Curto/Médio',1,1,2,3,'Ação Bônus','1 Moeda Antiga'],
  ['lemi','Pistola 9 mm','Comum','1d8','x2',10,'Curto/Médio',1,1,3,3,'Ação Bônus','1 Moeda Antiga'],
  ['nine-oh-nine','Pistola 9 mm','Comum','1d8','x2',15,'Curto/Médio',1,1,1,3,'Ação Bônus','1 Moeda Antiga'],
  ['sentinel-nine','Pistola 9 mm','Comum','1d8','x2',19,'Curto/Médio',1,1,1,3,'Ação Bônus','1 Moeda Antiga'],
  ['albert-01r','Pistola 9 mm','Tática','1d10','19–20 x3',3,'Curto/Médio',1,1,0,3,'Ação Bônus','2 Moedas Antigas'],
  ['blacktail','Pistola 9 mm','Tática','1d8','19–20 x2',9,'Curto/Médio',1,1,0,3,'Ação Bônus','2 Moedas Antigas'],
  ['samurai-edge','Pistola 9 mm','Tática','2d4','x2',15,'Curto/Médio',1,1,2,3,'Ação Bônus','2 Moedas Antigas'],
  ['silencer-9','Pistola 9 mm','Tática','1d6','x3',10,'Curto/Médio',1,1,0,3,'Ação Bônus','2 Moedas Antigas'],
  ['matilda','Pistola 9 mm','Militar','1d8','x2',18,'Curto/Médio',1,1,2,3,'Ação Bônus','3 Moedas Antigas'],
  ['punisher','Pistola 9 mm','Militar','1d8','x3',12,'Curto/Médio',1,1,1,3,'Ação Bônus','3 Moedas Antigas'],
  // Escopetas, p. 55
  ['w-870','Escopeta','Comum','3d6','x3',3,'Médio',2,2,2,4,'Movimento','2 Moedas Antigas'],
  ['hydra','Escopeta','Tática','4d6','x4',3,'Curto',1,1,0,3,'Movimento','3 Moedas Antigas'],
  ['riot-gun','Escopeta','Tática','3d6','x3',7,'Médio',2,2,1,4,'Movimento','3 Moedas Antigas'],
  ['striker','Escopeta','Militar','3d6','x3',12,'Médio',2,2,0,4,'Movimento','4 Moedas Antigas'],
  // Submetralhadoras, p. 56
  ['tmp','Submetralhadora','Tática','2d4','x2',30,'Curto/Médio','1/2',1,3,3,'Ação Bônus','2 Moedas Antigas'],
  ['gal','Submetralhadora','Militar','2d4','x2',40,'Curto/Médio','1/2',1,1,3,'Ação Bônus','3 Moedas Antigas'],
  ['hk-mp5','Submetralhadora','Militar','2d4','x2',35,'Curto/Médio',2,2,2,4,'Ação Bônus','3 Moedas Antigas'],
  ['chicago-sweeper','Submetralhadora','Exótica','4d4','x2',50,'Curto/Médio',2,2,0,3,'Ação Bônus','4 Moedas Antigas'],
  // Rifles, p. 57
  ['clatter-carbine','Rifle','Militar','2d10','x2',40,'Médio/Longo',2,2,1,4,'Ação Bônus','5 Moedas Antigas'],
  ['dragoon','Rifle','Militar','2d10','x2',30,'Médio/Longo',2,2,2,4,'Ação Bônus','5 Moedas Antigas'],
  ['bear-commander','Rifle','Exótica','1d10','x2',30,'Médio/Longo',2,2,0,4,'Ação Bônus','6 Moedas Antigas'],
  // Rifles de Precisão, p. 58
  ['stingray','Rifle de Precisão','Tática','2d12','x3',7,'Longo/Muito Longo',2,2,2,4,'Ação Bônus','4 Moedas Antigas'],
  ['svd','Rifle de Precisão','Militar','2d12','x3',5,'Longo/Muito Longo',2,2,1,4,'Ação Bônus','5 Moedas Antigas'],
  // Magnums, pp. 59–60
  ['elephant-killer','Magnum',undefined,'4d6','x4',5,'Curto/Médio',2,1,0,5,'Ação','4 Moedas Antigas'],
  ['killer7','Magnum',undefined,'4d6','x3',6,'Curto/Médio',2,1,1,5,'Ação Bônus','4 Moedas Antigas'],
  ['m1851-wolfsbane','Magnum',undefined,'4d6','x3',5,'Curto/Médio',2,2,2,5,'Ação Bônus','4 Moedas Antigas'],
  ['requiem','Magnum',undefined,'4d6','x3',5,'Curto/Médio',2,'1–2',3,5,'Ação Bônus','4 Moedas Antigas'],
  ['sw-m29','Magnum',undefined,'4d6','x3',6,'Curto/Médio',2,2,0,5,'Ação','4 Moedas Antigas'],
  // Armas Especiais, pp. 60–61
  ['besta','Arma Especial',undefined,'1d8','19–20 x2',1,'Curto/Médio',2,1,1,1,'Movimento','Exploração'],
  ['gm-79','Arma Especial',undefined,'4d6','x4',1,'Médio',2,2,1,3,'Movimento','Exploração'],
  ['lanca-chamas-quimico','Arma Especial',undefined,'3d6→6d6','x2',100,'Cone 4,5 m',2,2,1,1,'Movimento (reabastecer)','Exploração'],
  ['redemption','Arma Especial',undefined,'1d12','x4',1,'Curto/Médio',1,1,0,1,'Ação Bônus','Exploração'],
  ['rpg-7','Arma Especial',undefined,null,null,1,'Curto/Médio/Longo',2,2,0,1,'Movimento','Exploração'],
  ['spark-shot','Arma Especial',undefined,'1d4 / 4d4','x2',7,'Curto/Médio',2,2,1,1,'Movimento (bateria)','Exploração'],
];

test('tabela de todas as 34 armas de fogo e especiais corresponde aos valores oficiais', () => {
  const perfis = listarPerfisArmasFogo();
  assert.equal(perfis.length, armasDeFogo.length);
  for (const [id,categoria,grau,dano,critico,capacidade,alcance,maos,espacos,pecas,durabilidade,recarga,aquisicao] of armasDeFogo) {
    const p = perfis.find(item => item.id === id);
    assert.ok(p, 'arma de fogo/especial ausente: ' + id);
    assert.deepEqual(
      [p.categoria,p.grau,p.dano,p.critico,p.capacidade,p.alcance,p.maos,p.espacos,p.pecas,p.durabilidade,p.recarga,p.aquisicao],
      [categoria,grau,dano,critico,capacidade,alcance,maos,espacos,pecas,durabilidade,recarga,aquisicao],
      'divergência na tabela: ' + id,
    );
  }
});
