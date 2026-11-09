// Controlador puro: a integracao deve selecionar/inutilizar contexto em cada troca
// de Mesa, conta, sessao ou ficha, inclusive quando o identificador volta ao anterior.
export function prepararConsultaContextual<T>(){
 let contexto:string|null=null,geracao=0,carregando=false,valor:T|null=null,erro:string|null=null;
 const limpar=()=>{carregando=false;valor=null;erro=null;};
 return {
  selecionar(chave:string|null){geracao++;contexto=chave;limpar();},
  invalidar(){geracao++;contexto=null;limpar();},
  estado(){return {contexto,carregando,valor:valor===null?null:structuredClone(valor),erro};},
  async consultar(carregar:()=>Promise<T>):Promise<'atual'|'descartada'>{
   if(contexto===null)return 'descartada';
   const esta=++geracao;carregando=true;valor=null;erro=null;
   try{
    const recebido=await carregar();
    if(esta!==geracao)return 'descartada';
    valor=structuredClone(recebido);
   }catch{
    if(esta!==geracao)return 'descartada';
    valor=null;erro='Não foi possível consultar os dados neste contexto.';
   }
   carregando=false;return 'atual';
  }
 };
}
