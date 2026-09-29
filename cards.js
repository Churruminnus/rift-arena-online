(function(root,factory){const cards=factory();if(typeof module==='object'&&module.exports)module.exports=cards;else root.CardCatalog=cards;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const c=(id,name,tag,color,tier,max,describe,requires=null)=>({id,name,tag,color,tier,max,describe,requires,icon:'◆'});
  return [
    c('ricochet','Ricochete','TRAJETÓRIA','#70defb','tactical',2,n=>`Seus tiros rebatem ${n} ${n===1?'vez':'vezes'} nas paredes e coberturas.`),
    c('double','Disparo duplo','PRESSÃO','#c0a5ff','power',1,()=>`Dispara 2 projéteis em leque. Por ser um poder forte, o intervalo entre disparos aumenta 50%.`),
    c('bomb','Esquiva explosiva','CONTROLE','#ffb371','power',2,n=>`A esquiva deixa uma bomba: 1 de dano após 0,65 s. ${n===1?'Alcance curto.':'Alcance 17% maior.'} Não fere você; paredes protegem.`),
    c('heavy','Tiro pesado','IMPACTO','#ff8199','power',1,()=>`Tiros maiores causam 2 de dano. Por ser um poder forte, os projéteis viajam 25% mais devagar.`),
    c('breath','Último fôlego','SOBREVIVÊNCIA','#8ee6b0','tactical',2,n=>`Com 1 vida, sua esquiva recarrega ${n*60}% mais rápido. O bônus acompanha sua vida atual.`),
    c('hunter','Caçador','PRECISÃO','#f2d37b','tactical',2,n=>`Cada projétil que causa dano reduz ${(n*.4).toFixed(1).replace('.',',')} s da recarga atual da esquiva.`),
    c('light','Passo leve','MOVIMENTO','#7fe6ce','basic',2,n=>`Você se movimenta ${6*n}% mais rápido durante toda a rodada.`),
    c('longdash','Fuga longa','ESQUIVA','#b6a9ff','tactical',1,()=>`Sua esquiva percorre 20% mais distância. Mantém a recarga e o tempo de proteção.`),
    c('adrenaline','Adrenalina','REAÇÃO','#ff9476','basic',1,()=>`Após sofrer dano, ganha 12% de velocidade por 1 segundo. Novos danos renovam a duração.`),
    c('patient','Mira paciente','PREPARAÇÃO','#bcd6ff','tactical',1,()=>`Após 1 segundo sem atirar, o próximo disparo viaja 15% mais rápido. Não aumenta o dano.`),
    c('range','Alcance estendido','ALCANCE','#8adfff','basic',2,n=>`Seus projéteis duram ${20*n}% mais tempo antes de desaparecer, aumentando seu alcance.`),
    c('opener','Arranque','ABERTURA','#97f2b9','basic',1,()=>`Nos primeiros 2 segundos de combate, você se movimenta 15% mais rápido.`),
    c('rhythm','Ritmo','CADÊNCIA','#a6cdff','basic',2,n=>`Reduz em ${5*n}% o intervalo entre seus disparos.`),
    c('reflex','Reflexos','AGILIDADE','#91f0db','basic',2,n=>`Reduz em ${8*n}% a recarga base da esquiva.`),
    c('velocity','Munição veloz','PROJÉTEIS','#85dfff','basic',2,n=>`Seus projéteis viajam ${8*n}% mais rápido.`),
    c('caliber','Calibre maior','PRECISÃO','#d6bcff','basic',2,n=>`Seus projéteis ficam ${10*n}% maiores, facilitando acertos. Não aumenta o dano.`),
    c('cold','Sangue frio','SOBREVIVÊNCIA','#99e6ff','basic',1,()=>`Com 1 vida restante, seus projéteis viajam 12% mais rápido.`),
    c('momentum','Impulso certeiro','MOBILIDADE','#a7eab3','tactical',1,()=>`Acertar um tiro dá 8% de velocidade por 1 segundo. Novos acertos renovam a duração, sem somar o bônus.`),
    c('counter','Contra-ataque','REAÇÃO','#ffbd93','tactical',1,()=>`Após receber dano, seu próximo disparo viaja 20% mais rápido. O bônus é consumido ao atirar.`),
    c('exit','Saída rápida','ESQUIVA','#9ed4ff','basic',1,()=>`Após terminar a esquiva, ganha 8% de velocidade de movimento por 1 segundo.`),
    c('prepared','Disparo preparado','ABERTURA','#f4d69c','basic',1,()=>`O primeiro disparo de cada rodada fica 20% maior. Não aumenta o dano.`),
    c('pierce','Atravessar','DOMÍNIO','#f9d488','power',1,()=>`Seus tiros atravessam e destroem os tiros normais do rival. Dois tiros com Atravessar passam um pelo outro.`),
    c('echo','Eco da esquiva','ILUSÃO','#ccadff','tactical',1,()=>`Sua esquiva deixa uma imagem do personagem por 0,75 s. Confunde o rival, mas não bloqueia tiros.`),
    c('sight','Mira de ricochete','LEITURA','#90e6ef','tactical',1,()=>`Mostra o caminho previsto do tiro até a primeira rebatida. Requer Ricochete; você continua controlando a mira.`,'ricochet'),
    c('tracker','Rastro de caça','RASTREAMENTO','#ffd69b','tactical',1,()=>`Acertar um tiro destaca o rival por 2 segundos e deixa um rastro visível de sua movimentação.`),
    c('alert','Alerta de perigo','PERCEPÇÃO','#ffac90','tactical',1,()=>`Um indicador perto do personagem avisa quando um tiro inimigo se aproxima em rota de acerto.`)
  ];
});
