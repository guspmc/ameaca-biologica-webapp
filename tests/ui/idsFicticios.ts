// Somente simulações em memória: permite HTTP na rede local sem exigir contexto seguro.
// Não usar como gerador de operações reais ou persistidas entre dispositivos.
export function prepararIdsFicticios(){let sequencia=0;return()=>`f3000000-0000-4000-8000-${(++sequencia).toString(16).padStart(12,'0')}`;}
