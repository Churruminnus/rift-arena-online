(function(root,factory){const art=factory();if(typeof module==='object'&&module.exports)module.exports=art;else root.CardArt=art;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  let serial=0;
  return function cardArt(card){
    const id='ca'+(++serial),g=`url(#${id}metal)`,a=`url(#${id}light)`;
    const path=(d,fill=a,stroke='#e9faff',width=2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const line=(d,color=card.color,w=3)=>path(d,'none',color,w);
    const circle=(x,y,r,fill='none',stroke=card.color,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
    const group=(content,transform)=>`<g transform="${transform}">${content}</g>`;
    const bolt=path('M125 25 98 78 119 78 108 125 148 65 124 65Z');
    const bullet=path('M72 63 123 63Q153 63 169 79Q153 95 123 95L72 95Z',g)+path('M126 64Q154 64 169 79Q154 94 126 94Z')+line('M81 66V92M88 66V92','#829cac',2)+line('M56 70H31M54 79H19M56 89H35',card.color,3);
    const boot=path('M103 32 137 38 128 83 169 101Q181 109 169 118L106 119 79 98 94 76Z',g)+path('M102 40 126 44 120 69 94 65Z')+line('M96 73 121 80M94 83 118 89M104 106 149 108','#d0e0e8',4)+path('M81 98 107 114 172 112 166 123 104 124 75 105Z','#142735','#6d8797',2);
    const target=circle(121,77,37,g,'#8daebf',3)+circle(121,77,27,'none',card.color,3)+circle(121,77,14,'none','#c9f6ff',2)+circle(121,77,4,a,'#fff')+line('M121 31V49M121 105V123M75 77H93M149 77H167','#d9f6ff',3);
    const clock=circle(122,78,39,g,'#a3b7c3',3)+circle(122,78,31,'#152536',card.color,2)+line('M122 53V78L141 90','#e5faff',4)+path('M113 28H131V37H113Z',g)+line('M93 42 87 34M150 42 156 34','#a3b7c3',5);
    const heart=path('M121 118 82 82C55 51 93 28 121 57C149 28 187 51 160 82Z',g)+path('M121 104 94 79C77 58 97 48 121 70C145 48 165 58 148 79Z')+line('M72 78H97L108 62 121 90 132 74H174','#eaffff',3);
    const helmet=path('M90 40 115 27 145 34 163 60 154 105 123 122 94 104 80 67Z',g)+path('M88 63 122 77 158 59 148 85 124 97 98 87Z')+path('M108 101 124 108 143 96 137 112 124 118 113 112Z','#213844','#879da9')+line('M96 47 118 36 138 41','#c5dae4',3);
    const shield=path('M121 27 169 46 159 96 121 126 83 96 73 46Z',g)+path('M121 39 156 53 148 88 121 111 94 88 86 53Z','#173848',card.color,2);
    const ring=path('M76 91C56 44 119 18 157 46M157 46 155 25M157 46 178 40','none',card.color,6);
    const graphics={
      ricochet:path('M159 22 185 31 185 113 159 123Z',g)+line('M55 115 153 68 65 37',card.color,5)+circle(153,68,8,a,'#fff',2)+path('M67 28 54 34 63 47')+line('M168 40V104','#87969e',2),
      double:group(bullet,'translate(13,-25) rotate(-8 120 80)')+group(bullet,'translate(13,28) rotate(8 120 80)'),
      bomb:circle(121,87,34,g,'#9eb2bf',3)+circle(111,75,12,'#8097a040','none')+path('M111 51 114 41 134 41 137 54Z',g)+line('M125 42C116 16 155 19 155 37','#e4bd85',4)+path('M155 17 158 29 171 25 164 36 175 43 160 43 158 55 152 42 139 45 147 35 140 27 153 30Z')+line('M94 87H108M136 87H150M121 75V99',card.color,3),
      heavy:group(bullet,'translate(-15,-6) scale(1.2)')+path('M87 42 100 33 146 33 155 43Z','#293b47','#9db4c2')+line('M57 116H158',card.color,4),
      breath:shield+group(heart,'translate(48,30) scale(.6)'),
      hunter:target+path('M160 34 143 43 155 55 172 46Z',g)+line('M160 42 125 74',card.color,4)+path('M124 62 118 80 137 73'),
      light:group(boot,'translate(2,0)')+path('M68 43Q27 42 37 90L72 56M37 90 77 48','none','#cef6e1',3)+line('M46 72 43 56M51 65H66',card.color,2),
      longdash:group(boot,'translate(17,-4)')+line('M71 46H35M66 65H18M58 83H29M75 107H41',card.color,5)+path('M169 48 183 63 169 79','none','#edfbff',4),
      adrenaline:heart+group(bolt,'translate(53,20) scale(.58)'),
      patient:group(target,'translate(-18,-2)')+group(clock,'translate(97,68) scale(.43)'),
      range:group(bullet,'translate(26,-11) scale(.87)')+line('M34 120H198M34 114V126M198 114V126',card.color,2)+path('M47 114 38 120 47 126M185 114 194 120 185 126','none','#e4f8ff',2)+line('M40 37H54M66 37H80M92 37H106',card.color,2),
      opener:group(boot,'translate(13,-3)')+path('M51 25V116','none','#9db1be',3)+path('M53 27H99V55H53Z','#ecf4f6','#344c59')+path('M54 28H65V39H54ZM76 28H87V39H76ZM65 39H76V50H65ZM87 39H98V50H87Z','#263846','none'),
      rhythm:path('M63 81H87L103 39 122 111 141 61 152 81H181','none',card.color,5)+circle(103,39,6,a,'#fff')+circle(122,111,6,a,'#fff')+line('M55 46V112M188 46V112','#677f95',2),
      reflex:clock+group(bolt,'translate(77,31) scale(.5)'),
      velocity:bullet+path('M106 59 75 28 123 54M106 99 75 128 123 103',g)+line('M66 46H41M66 112H41',card.color,3),
      caliber:circle(121,77,44,'none',card.color,2)+group(bullet,'translate(6,-2) scale(.97)')+path('M91 28 85 19 80 32M148 28 154 19 160 32','none','#cdd8ff',2),
      cold:group(heart,'translate(-11,0)')+line('M171 65V117M148 78 194 104M148 104 194 78M165 71 171 77 177 71M155 80 158 87 150 88M182 101 186 109 192 106','#e1faff',3),
      momentum:group(target,'translate(-1,-12) scale(.8)')+group(boot,'translate(68,41) scale(.62)'),
      counter:shield+path('M143 57H111L99 72M111 57 113 43M111 57 129 71','none',card.color,5)+path('M99 91H132L146 77M132 91 133 107M132 91 115 78','none','#f3faff',4),
      exit:`<ellipse cx="81" cy="78" rx="25" ry="49" fill="#102b3c" stroke="${card.color}" stroke-width="4"/>`+group(boot,'translate(25,5) scale(.91)')+line('M171 51H191M178 65H206M172 80H192',card.color,3),
      prepared:bullet+path('M136 20 140 36 156 40 140 44 136 60 132 44 116 40 132 36Z','#e8faff',card.color)+path('M183 96 186 105 195 108 186 111 183 120 180 111 171 108 180 105Z'),
      pierce:group(bullet,'translate(15,2)')+path('M140 29 126 57 149 50M138 129 123 103 150 106','none','#ff8a95',5)+path('M163 43 183 33M170 53 194 52M163 111 183 123M172 103 195 103','none','#fff1bd',3)+circle(148,80,42,'none','#ffe7a744',2),
      echo:`<g opacity=".28" transform="translate(-43,-7)">${helmet}</g><g opacity=".48" transform="translate(-19,-3)">${helmet}</g>`+group(helmet,'translate(13,0)'),
      sight:line('M42 118 159 59 70 29',card.color,4)+path('M164 21 184 30 184 104 164 115Z',g)+group(target,'translate(0,33) scale(.55)')+circle(159,59,7,'#f1ffff',card.color,3),
      tracker:circle(123,76,46,'#122d39','#76b2bd',2)+circle(123,76,32,'none','#91e6ce66')+line('M123 76 153 42',card.color,2)+path('M89 93Q78 70 92 63Q106 65 102 78L101 91Z')+path('M113 115Q102 92 116 85Q130 87 126 100L125 113Z')+circle(153,45,5,'#fff4cb',card.color,2),
      alert:path('M122 28 179 121H65Z',g)+path('M122 43 164 113H80Z','#302d2f',card.color,3)+line('M122 64V86',card.color,7)+circle(122,100,3,card.color,card.color)+line('M65 48Q45 75 58 101M180 48Q200 75 187 101','#ffc0a4',3)
    };
    return `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${card.name}" focusable="false"><defs><linearGradient id="${id}metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9bb8c9"/><stop offset=".28" stop-color="#536e84"/><stop offset=".65" stop-color="#263f54"/><stop offset="1" stop-color="#132535"/></linearGradient><linearGradient id="${id}light" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="#f0ffff"/><stop offset=".4" stop-color="${card.color}"/><stop offset="1" stop-color="${card.color}" stop-opacity=".5"/></linearGradient><radialGradient id="${id}halo"><stop stop-color="${card.color}" stop-opacity=".21"/><stop offset="1" stop-color="${card.color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="121" cy="85" rx="104" ry="69" fill="url(#${id}halo)"/><ellipse cx="121" cy="130" rx="65" ry="7" fill="#041020" opacity=".45"/><g opacity=".3" fill="none" stroke="${card.color}" stroke-width=".7"><path d="M35 61 61 28H157L196 76 159 127H57Z"/><circle cx="120" cy="78" r="56"/><path d="M23 95H40M189 30H204M47 127H64"/></g>${graphics[card.id]||target}<g fill="#e9fbff" opacity=".7"><circle cx="46" cy="42" r="1.5"/><circle cx="193" cy="94" r="1.5"/><circle cx="175" cy="19" r="1"/></g></svg>`;
  };
});
