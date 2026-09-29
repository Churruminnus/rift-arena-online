(() => {
  'use strict';
  const {Game,W,H,WALLS,BOUNDS,clamp,CARDS,cardById}=ArenaCore;
  const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d'),stage=$('stage');
  const game=new Game(),keys=new Set(),particles=[],trails=[];
  let difficulty='normal',gameMode='bot',online=null,onlineSide=null,lastOnlineState=null,last=0,acc=0,clock=0,shooting=false,dashRequested=false,aim=-.68,pointer=null,shake=0,audio=null,sound=false;
  try{sound=localStorage.getItem('rift-sound')==='on';}catch(_){}
  const initialModal=$('modal').innerHTML;
  const controls={move:{id:null,x:0,y:0},aim:{id:null,x:0,y:0}};
  const colors={you:'#50dfff',bot:'#ffa04b'};
  const floor=document.createElement('canvas');floor.width=W;floor.height=H;const fc=floor.getContext('2d');
  let seed=8217;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  function rounded(c,x,y,w,h,r=4){c.beginPath();c.roundRect(x,y,w,h,r);}
  function rect(c,x,y,w,h,fill,stroke,r=0){c.fillStyle=fill;if(r)rounded(c,x,y,w,h,r);else{c.beginPath();c.rect(x,y,w,h);}c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  function line(c,x,y,u,v,color,width=1){c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function poly(c,points,fill,stroke){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
  function circle(c,x,y,r,fill,stroke,width=1){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
  function makeFloor(){
    const grad=fc.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#26333c');grad.addColorStop(.5,'#3c474b');grad.addColorStop(1,'#242f38');rect(fc,0,0,W,H,grad);
    // Individually shaded stone tiles, cracks and worn edges are baked once.
    for(let row=0;row<12;row++)for(let col=0;col<20;col++){
      const x=col*63+(row%2?-31:0),y=row*62,v=42+Math.floor(random()*14);
      rect(fc,x+1,y+1,61,60,`rgb(${v},${v+10},${v+15})`,'#18242b');line(fc,x+3,y+3,x+60,y+3,'#72808a25');line(fc,x+3,y+3,x+3,y+58,'#72808a1c');
      for(let j=0;j<12;j++){const xx=x+random()*59,yy=y+random()*58;rect(fc,xx,yy,random()*3+.4,1,random()>.5?'#e1e1c808':'#00000014');}
      if(random()<.22){const xx=x+10+random()*35,yy=y+random()*25;line(fc,xx,yy,xx+7,yy+12,'#1a252b70');line(fc,xx+7,yy+12,xx+5,yy+21,'#1a252b70');line(fc,xx+7,yy+12,xx+17,yy+15,'#1a252b50');}
    }
    // Recessed arena deck and perimeter.
    rect(fc,48,98,1104,568,'#00000000','#7c8b8b65',5);rect(fc,57,109,1086,548,'#00000000','#121d24',3);
    for(const x of [18,1148]){rect(fc,x,92,34,591,'#121d27','#46545b',3);for(let y=112;y<663;y+=83){rect(fc,x+2,y,30,72,'#283942','#51616b',2);rect(fc,x+8,y+9,17,51,'#1a2831','#344651',1);}rect(fc,x+12,228,10,70,x<50?'#38c6e366':'#ee923c66');rect(fc,x+12,458,10,70,x<50?'#38c6e366':'#ee923c66');}
    for(const y of [81,660])for(let x=49;x<1140;x+=92){rect(fc,x+3,y+8,89,26,'#13212b');rect(fc,x,y,89,26,'#39464e','#67767b70',2);rect(fc,x+5,y+4,79,15,'#303e48');line(fc,x+4,y+2,x+83,y+2,'#9aaba645');if(x%3===1)rect(fc,x+20,y+18,50,3,'#d8ab5c88');}
    // Center insignia, rings and symmetrical markings.
    circle(fc,600,385,109,null,'#a5aaa11a',2);circle(fc,600,385,100,null,'#9ca59d27',1);circle(fc,600,385,91,null,'#18273166',3);
    poly(fc,[[600,322],[642,383],[600,447],[558,383]],'#8995860c','#a1a8962c');poly(fc,[[600,346],[622,383],[600,422],[578,383]],'#86928a12','#a1a89624');
    line(fc,600,125,600,273,'#849b971f');line(fc,600,497,600,642,'#849b971f');
    for(const [x,color] of [[130,'#4cdfff'],[1060,'#ffa14a']]){fc.save();fc.globalAlpha=.23;poly(fc,[[x,320],[x+15,332],[x+15,416],[x,428]],color);fc.restore();}
    for(let i=0;i<60;i++){const x=70+random()*1060,y=random()>.5?125+random()*15:630+random()*14;rect(fc,x,y,3+random()*5,2+random()*4,'#101b22aa');}
    const glow=fc.createRadialGradient(600,365,90,600,365,700);glow.addColorStop(0,'#87989b06');glow.addColorStop(.6,'#07121b15');glow.addColorStop(1,'#000915a0');rect(fc,0,0,W,H,glow);
  }
  makeFloor();
  function drawWall(b){
    const {x,y,w,h}=b,depth=27;
    rect(ctx,x+12,y+12,w+16,h+10,'#06111d55',null,4);
    rect(ctx,x,y-depth,w,h+depth,'#1d2b34','#15222b',3);
    rect(ctx,x+1,y+h-9,w-2,10,'#121e28');
    for(let i=0;i<3;i++){const xx=x+i*w/3;rect(ctx,xx+1,y+10,w/3-2,h-13,i%2?'#34414a':'#3a4851','#172731');line(ctx,xx+3,y+12,xx+w/3-4,y+12,'#77838b45');}
    rect(ctx,x,y-depth,w,h,'#536068','#89968c55',3);
    for(let i=0;i<3;i++){const xx=x+i*w/3;rect(ctx,xx+3,y-depth+3,w/3-5,h-7,i%2?'#505e64':'#5c676c','#394950');line(ctx,xx+6,y-depth+5,xx+w/3-5,y-depth+5,'#abb7a44d');}
    for(const xx of [x+5,x+w-15]){rect(ctx,xx,y-depth-4,10,h+12,'#455560','#71818a88',2);rect(ctx,xx+2,y-depth+3,6,8,'#a1a88933');rect(ctx,xx+2,y+h-depth-4,6,6,'#131f28');}
    line(ctx,x+21,y+4,x+41,y+9,'#263a4580');line(ctx,x+41,y+9,x+36,y+18,'#263a4580');
    // Small moss accents, kept out of the collision silhouette.
    for(let i=0;i<5;i++)circle(ctx,x+w-23+(i%2)*5,y+h-8-i*7,3,'#50605177');
  }
  function drawFighter(p,isEcho=false){
    const c=colors[p.team],t=clock,walking=Math.hypot(p.vx,p.vy)>12,step=walking?Math.sin(t*19)*4:0;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.46);circle(ctx,2,17,25,'#030b12a0');ctx.restore();
    if(p.dashTime>0){circle(ctx,p.x,p.y,26,null,c+'aa',2);}
    if(p.marked>0&&!isEcho){circle(ctx,p.x,p.y-8,32,null,'#ffe1aacc',2);line(ctx,p.x-37,p.y-8,p.x-29,p.y-8,'#fff3c4',2);line(ctx,p.x+29,p.y-8,p.x+37,p.y-8,'#fff3c4',2);}
    ctx.save();ctx.translate(p.x,p.y-9);ctx.rotate(p.angle);
    if(p.invuln>0&&Math.floor(clock*28)%2===0)ctx.globalAlpha=.6;
    // Feet, armored shoulders, weapon, torso, then helmet.
    rect(ctx,-17+step,-15,20,10,'#101e28','#566a78',4);rect(ctx,-17-step,5,20,10,'#101e28','#566a78',4);
    rect(ctx,-13,-22,21,15,p.team==='you'?'#426779':'#80563a','#111c23',5);
    rect(ctx,-13,7,21,15,p.team==='you'?'#426779':'#80563a','#111c23',5);
    rect(ctx,-10,-21,11,4,c);rect(ctx,-10,17,11,4,c);
    rect(ctx,3,-17,22,9,'#263c49','#697b80',3);rect(ctx,3,8,22,9,'#263c49','#697b80',3);
    rect(ctx,9-p.recoil*3,-6,31,12,'#111f28','#84979c',2);rect(ctx,14-p.recoil*3,-3,26,6,'#365063');rect(ctx,23-p.recoil*3,-2,19,3,c);rect(ctx,35-p.recoil*3,-6,7,12,'#1c303d','#9dacad',2);
    const g=ctx.createLinearGradient(-15,-13,12,13);g.addColorStop(0,p.team==='you'?'#72a3b7':'#bd9065');g.addColorStop(1,p.team==='you'?'#203d4e':'#513929');
    ctx.beginPath();ctx.ellipse(-4,0,17,16,0,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#0c1923';ctx.lineWidth=2;ctx.stroke();
    rect(ctx,-15,-9,5,18,'#162932',null,2);line(ctx,-9,-11,-9,11,'#bed9d566',2);
    const hg=ctx.createLinearGradient(-5,-11,11,10);hg.addColorStop(0,p.team==='you'?'#95c8d5':'#d9a477');hg.addColorStop(1,p.team==='you'?'#34586c':'#745139');
    ctx.beginPath();ctx.ellipse(3,0,12,11,0,0,Math.PI*2);ctx.fillStyle=hg;ctx.fill();ctx.strokeStyle='#203340';ctx.lineWidth=1.5;ctx.stroke();
    poly(ctx,[[6,-8],[13,-5],[15,2],[10,8],[7,5],[10,0]],c);line(ctx,-3,-7,2,-7,'#dbe9de88');
    if(p.hit>0){ctx.globalAlpha=p.hit/.3*.65;circle(ctx,0,0,24,'#ffffff');}
    ctx.restore();
    // Ground ring and readable life pips.
    ctx.save();ctx.translate(p.x,p.y+5);ctx.scale(1,.38);circle(ctx,0,0,25,null,c+'77',2);ctx.restore();
    if(!isEcho){ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillStyle='#e9f4fa';ctx.shadowColor='#03101e';ctx.shadowBlur=4;ctx.fillText(p.team==='you'?'VOCÊ':gameMode==='online'?'RIVAL':'SENTINELA',p.x,p.y-51);ctx.shadowBlur=0;
    for(let i=0;i<3;i++)circle(ctx,p.x+(i-1)*11,p.y-39,3.8,i<p.hp?c:'#50616a','#10222e',1);}
  }
  function drawZone(){if(game.zone<=0)return;const z=game.zone,b=BOUNDS;ctx.save();ctx.fillStyle='#ef552322';ctx.beginPath();ctx.rect(b.x,b.y,b.w,b.h);ctx.rect(b.x+z,b.y+z,b.w-2*z,b.h-2*z);ctx.fill('evenodd');ctx.strokeStyle=`rgba(255,117,66,${.45+Math.sin(clock*5)*.15})`;ctx.lineWidth=2;ctx.strokeRect(b.x+z,b.y+z,b.w-2*z,b.h-2*z);ctx.restore();}
  function draw(){
    ctx.save();if(shake>0&&game.state==='playing'&&!game.paused)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    ctx.drawImage(floor,0,0);drawZone();
    for(const b of game.bombs){const c=colors[b.team];circle(ctx,b.x,b.y,b.radius,c+'0d',c+'55',1);circle(ctx,b.x,b.y,8,'#1a202b',c,2);circle(ctx,b.x,b.y,3,Math.sin(clock*25)>0?'#fff4d1':c);ctx.save();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,13,-Math.PI/2,-Math.PI/2+(1-b.fuse/.65)*Math.PI*2);ctx.stroke();ctx.restore();}
    for(const t of trails){ctx.save();ctx.globalAlpha=t.life/.23*.3;ctx.translate(t.x,t.y-10);ctx.rotate(t.angle);ctx.fillStyle=colors[t.team];ctx.beginPath();ctx.ellipse(0,0,23,17,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    // The prediction uses the same geometry and projectile radius as real ricochets.
    if(game.state==='playing'&&!game.paused){ctx.save();ctx.setLineDash([7,9]);for(const segment of game.aimSegments(game.player))line(ctx,segment.x,segment.y-5,segment.ex,segment.ey-5,'#63ddf49a',1.2);ctx.restore();}
    for(const e of game.echoes){ctx.save();ctx.globalAlpha=.7*e.life/.75;drawFighter(e,true);ctx.restore();}
    const objects=WALLS.map(b=>({y:b.y+b.h,wall:b})).concat([game.player,game.bot].map(p=>({y:p.y,fighter:p}))).sort((a,b)=>a.y-b.y);
    for(const o of objects)o.wall?drawWall(o.wall):drawFighter(o.fighter);
    if(game.rank('you','alert')&&game.state==='playing'){const q=game.threat(game.player);if(q){const p=game.player,a=Math.atan2(q.y-p.y,q.x-p.x);ctx.save();ctx.translate(p.x,p.y-6);ctx.rotate(a);poly(ctx,[[42,-8],[57,0],[42,8]],'#ffb05d','#fff1be');ctx.restore();circle(ctx,p.x,p.y-6,36,null,'#ffb25d99',2);}}
    for(const q of game.bullets){const n=ArenaCore.norm(q.vx,q.vy),c=q.pierce?'#ffe0a1':colors[q.team],r=q.radius||5;ctx.save();ctx.shadowBlur=13;ctx.shadowColor=c;line(ctx,q.x-n.x*23,q.y-7-n.y*23,q.x,q.y-7,c+'77',r);line(ctx,q.x-n.x*12,q.y-7-n.y*12,q.x,q.y-7,c,r*.6);circle(ctx,q.x,q.y-7,r*.6,'#ffffe8');if(q.bounces>0)circle(ctx,q.x,q.y-7,r+2,null,c+'aa');ctx.restore();}
    for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);if(p.ring){circle(ctx,p.x,p.y,p.radius*(1-p.life/p.max),p.color+'18',p.color,3);}else if(p.text){ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y);}else{rect(ctx,p.x,p.y,p.size,p.size,p.color);}ctx.restore();}
    if(pointer&&game.state==='playing'&&!game.paused&&!document.body.classList.contains('touch-mode')){const {x,y}=pointer;circle(ctx,x,y,9,null,'#d3f7ff99');for(let i=0;i<4;i++){const a=i*Math.PI/2;line(ctx,x+Math.cos(a)*12,y+Math.sin(a)*12,x+Math.cos(a)*16,y+Math.sin(a)*16,'#d3f7ff99');}}
    ctx.restore();
  }
  // Procedural effects keep the Android package light and work offline.
  function audioContext(){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio;}catch(_){return null;}}
  function tone(freq,len,type='sine',volume=.025,slide=0,delay=0){if(!sound)return;const a=audioContext();if(!a)return;const at=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),at+len);g.gain.setValueAtTime(volume,at);g.gain.exponentialRampToValueAtTime(.001,at+len);o.connect(g);g.connect(a.destination);o.start(at);o.stop(at+len);}
  function noise(len,volume=.015,lowpass=1100){if(!sound)return;const a=audioContext();if(!a)return;const size=Math.max(1,Math.ceil(a.sampleRate*len)),buffer=a.createBuffer(1,size,a.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*(1-i/size);const source=a.createBufferSource(),filter=a.createBiquadFilter(),g=a.createGain();filter.type='lowpass';filter.frequency.value=lowpass;g.gain.setValueAtTime(volume,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+len);source.buffer=buffer;source.connect(filter);filter.connect(g);g.connect(a.destination);source.start();}
  function sfx(name,team){
    if(name==='shot'){tone(team==='you'?510:310,.065,'triangle',team==='you'?.014:.009,-210);tone(team==='you'?1020:620,.032,'sine',.006,-420,.012);}
    else if(name==='dash'){noise(.075,.012,520);tone(140,.16,'sawtooth',.018,460);}
    else if(name==='hit'){noise(.10,.028,team==='you'?430:1200);tone(team==='you'?110:780,.14,'triangle',.045,team==='you'?-70:-280);}
    else if(name==='clash'){noise(.045,.012,2100);tone(980,.055,'square',.009,-520);}
    else if(name==='explosion'){noise(.24,.036,420);tone(130,.28,'sawtooth',.026,-85);}
    else if(name==='select'){tone(440,.06,'sine',.018,140);tone(700,.08,'triangle',.012,100,.055);}
    else if(name==='confirm'){tone(520,.07,'triangle',.018,120);tone(740,.10,'sine',.015,230,.07);}
    else if(name==='start'){tone(360,.07,'square',.011,110);tone(560,.10,'triangle',.014,150,.08);}
    else if(name==='win'){tone(520,.12,'triangle',.025,150);tone(700,.17,'sine',.025,220,.10);tone(940,.22,'sine',.020,130,.22);}
    else if(name==='lose'){tone(310,.14,'sawtooth',.018,-90);tone(220,.28,'triangle',.022,-90,.10);}
    else if(name==='draw'){tone(380,.10,'triangle',.015,-40);tone(390,.16,'triangle',.012,-30,.11);}
    else if(name==='ui'){tone(560,.055,'sine',.012,80);}
  }
  function eventEffects(){for(const e of game.drain()){
    if(e.type==='round')$('statusText').textContent='ATÉ 5 RODADAS · 3 VITÓRIAS';
    if(e.type==='shot')sfx('shot',e.team);
    if(e.type==='dash')sfx('dash',e.team);
    if(e.type==='hit'){shake=e.team==='you'?9:4;sfx('hit',e.team);particles.push({x:e.x,y:e.y-65,vx:0,vy:-35,life:.65,max:.65,text:e.team==='you'?`−${e.damage} ${e.damage===1?'VIDA':'VIDAS'}`:`ACERTO −${e.damage}`,color:colors[e.team==='you'?'bot':'you']});}
    if(e.type==='explosion'){shake=7;sfx('explosion',e.team);particles.push({x:e.x,y:e.y,vx:0,vy:0,life:.4,max:.4,ring:true,radius:e.radius,color:colors[e.team]});}
    if(e.type==='spark')sfx('clash',e.team);
    if(e.type==='hit'||e.type==='spark'){for(let i=0;i<(e.type==='hit'?15:7);i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*140;particles.push({x:e.x,y:e.y-6,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+Math.random()*.22,max:.4,size:1+Math.random()*3,color:colors[e.team]});}}
    if(e.type==='finish'){clearInput();setTimeout(()=>{if(game.state==='roundOver'||game.state==='matchOver')resultScreen();},500);sfx(e.winner===null?'draw':e.winner==='you'?'win':'lose');}
  }}
  let hudCache='';
  function hud(){const key=[game.player.hp,game.bot.hp,Math.ceil(game.time),game.score.you,game.score.bot,game.round,game.state].join('/');if(key!==hudCache){hudCache=key;$('hpYou').innerHTML=Array.from({length:3},(_,i)=>`<span class="${i>=game.player.hp?'empty':''}"></span>`).join('');$('hpBot').innerHTML=Array.from({length:3},(_,i)=>`<span class="${i>=game.bot.hp?'empty':''}"></span>`).join('');const sec=Math.ceil(game.time);$('timer').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;$('timer').classList.toggle('urgent',sec<=15);$('scoreYou').textContent=game.score.you;$('scoreBot').textContent=game.score.bot;$('roundLabel').textContent=game.state==='menu'?'DUELO 1×1':`RODADA ${game.round} / 5`;}
    $('zoneWarning').hidden=game.zone<=0||game.state!=='playing';const starting=game.countdown>0&&game.state==='playing'&&!game.paused;$('countdown').hidden=!starting;$('countdown').textContent=game.countdown>.7?'PREPARE-SE':'VAI!';$('countdown').style.fontSize=game.countdown>.7?'clamp(18px, 3.2vw, 40px)':'clamp(35px, 6vw, 75px)';const cd=game.player.dashCd/(game.player.hp===1?1+.6*game.rank('you','breath'):1);$('dashLabel').textContent=cd>0?`${cd.toFixed(1)}s`:'ESQUIVA';$('dash').classList.toggle('cooling',cd>0);$('dash').disabled=cd>0||game.state!=='playing'||game.paused||game.countdown>0;
    $('loadoutButton').hidden=game.state!=='playing';$('loadoutButton').disabled=game.paused;const own=Object.values(game.builds.you).reduce((s,n)=>s+n,0),enemy=Object.values(game.builds.bot).reduce((s,n)=>s+n,0);$('loadoutButton').textContent=`▱ CARTAS ${own} × ${enemy}`;
  }
  function clearInput(){keys.clear();shooting=false;dashRequested=false;pointer=null;for(const [name,c] of Object.entries(controls)){c.id=null;c.x=0;c.y=0;$(name==='move'?'moveStick':'aimStick').querySelector('.knob').style.transform='';}}
  function show(content,wide=false){$('modal').classList.remove('catalog-modal');$('modal').classList.toggle('wide',wide);$('modal').innerHTML=content;$('modal').scrollTop=0;$('overlay').hidden=false;clearInput();const button=$('modal').querySelector('.primary:not(:disabled), button.power-card');if(button)button.focus({preventScroll:true});}
  function onlineEndpoint(){
    if(location.protocol==='https:'||location.protocol==='http:')return `${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`;
    return 'wss://rift-arena-xflb.onrender.com/ws';
  }
  function onlineSend(type,payload={}){if(online&&online.readyState===WebSocket.OPEN)online.send(JSON.stringify({type,...payload}));}
  function stopOnline(){if(online){online.onclose=null;online.close();}online=null;onlineSide=null;lastOnlineState=null;}
  function swapTeam(team){return team==='you'?'bot':team==='bot'?'you':team;}
  function copyOnlineState(s,side){
    const flip=side==='bot', mapTeam=team=>flip?swapTeam(team):team, own=flip?s.bot:s.player, rival=flip?s.player:s.bot;
    game.state=s.state;game.time=s.time;game.countdown=s.countdown;game.zone=s.zone;game.round=s.round;game.score=flip?{you:s.score.bot,bot:s.score.you}:s.score;
    game.builds=flip?{you:s.builds.bot,bot:s.builds.you}:s.builds;game.picks=s.picks?(flip?{you:s.picks.bot,bot:s.picks.you}:s.picks):null;game.offers={you:s.offers||[],bot:[]};game.result=s.result?(flip?{...s.result,winner:mapTeam(s.result.winner)}:s.result):null;game.matchWinner=mapTeam(s.matchWinner);
    game.player={...own,team:'you'};game.bot={...rival,team:'bot'};game.bullets=(s.bullets||[]).map(q=>({...q,team:mapTeam(q.team)}));game.bombs=(s.bombs||[]).map(q=>({...q,team:mapTeam(q.team)}));game.echoes=(s.echoes||[]).map(q=>({...q,team:mapTeam(q.team)}));
    for(const e of s.events||[])game.events.push({...e,team:mapTeam(e.team),winner:mapTeam(e.winner)});
  }
  function onlineWaiting(text){show(`<div class="modal-top"><span class="small-tag">ONLINE 1×1</span><span class="offline-tag"><i></i> CONECTADO</span></div><h1>${text}</h1><p class="intro">A arena será preparada assim que os dois jogadores estiverem prontos.</p><div class="rules"><div><b>↯</b><span>PARTIDA EM TEMPO REAL</span></div><div><b>03</b><span>VITÓRIAS PARA VENCER</span></div><div><b>26</b><span>CARTAS DISPONÍVEIS</span></div></div><button id="cancelOnline" class="secondary">CANCELAR</button>`,true);$('cancelOnline').onclick=()=>{onlineSend('cancel');stopOnline();menu();};}
  function connectOnline(){
    stopOnline();onlineWaiting('PROCURANDO <em>RIVAL.</em>');$('statusText').textContent='BUSCANDO JOGADOR ONLINE';
    try{online=new WebSocket(onlineEndpoint());}catch(_){onlineError();return;}
    online.onopen=()=>onlineSend('queue');
    online.onmessage=e=>{let data;try{data=JSON.parse(e.data);}catch(_){return;}if(data.type==='queue')return;if(data.type==='matched'){onlineSide=data.side;return;}if(data.type==='waiting-pick'||data.type==='waiting-ready'||data.type==='waiting-next'||data.type==='waiting-rematch'){const button=$('modal').querySelector('.primary');if(button){button.disabled=true;button.innerHTML='AGUARDANDO RIVAL...';}return;}if(data.type==='opponent-left'){stopOnline();show(`<div class="modal-top"><span class="small-tag">ONLINE 1×1</span></div><h1>RIVAL <em>DESCONECTOU.</em></h1><p class="intro">A partida foi encerrada. Você pode procurar outro adversário agora.</p><button id="backMenu" class="primary">VOLTAR AO INÍCIO <span>↗</span></button>`);$('backMenu').onclick=menu;return;}if(data.type==='state'){const previous=lastOnlineState;copyOnlineState(data.state,data.side);lastOnlineState=data.state.state;if(data.state.state==='draft'&&previous!=='draft')draftScreen();else if(data.state.state==='reveal'&&previous!=='reveal')revealScreen();else if(data.state.state==='playing'){$('overlay').hidden=true;$('statusText').textContent='DUELO ONLINE · ATÉ 5 RODADAS';}}};
    online.onerror=onlineError;online.onclose=()=>{if(gameMode==='online'&&online){online=null;onlineError();}};
  }
  function onlineError(){stopOnline();show(`<div class="modal-top"><span class="small-tag">ONLINE 1×1</span></div><h1>SERVIDOR <em>INDISPONÍVEL.</em></h1><p class="intro">Não foi possível conectar à arena online agora. Você ainda pode treinar contra o bot.</p><button id="backMenu" class="primary">VOLTAR AO INÍCIO <span>↗</span></button>`);$('backMenu').onclick=menu;$('statusText').textContent='ONLINE INDISPONÍVEL';}
  const tierLabel=c=>({basic:'BÁSICA',tactical:'TÁTICA',power:'PODEROSA'}[c.tier]);
  function powerCard(c,rank=0,selectable=true){const tag=selectable?'button':'article';return `<${tag} class="power-card tier-${c.tier}" ${selectable?`data-card="${c.id}" aria-pressed="false"`:''} style="--accent:${c.color}"><span class="card-top"><span>${tierLabel(c)}</span><b>${selectable?(rank?'EVOLUIR '+rank+' → '+(rank+1):'NOVA CARTA'):c.tag}</b></span><span class="card-art" aria-hidden="true">${CardArt(c)}</span><strong>${c.name}</strong><span class="card-description">${c.describe(rank+1)}</span>${c.requires?'<span class="dependency">COMBINA COM RICOCHETE</span>':''}<span class="card-bottom">${c.max===1?'NÍVEL ÚNICO':`NÍVEL ${rank+1} / ${c.max}`} <i>${selectable?'＋':'◆'}</i></span></${tag}>`;}
  function catalogScreen(filter='all'){const cards=CARDS.filter(c=>filter==='all'||c.tier===filter);show(`<div class="modal-top"><span class="small-tag">ARSENAL · ${CARDS.length} CARTAS</span><button id="closeCatalog" class="secondary">← VOLTAR</button></div><h1 class="draft-title">MONTE SUA <em>ESTRATÉGIA.</em></h1><p class="draft-intro">Bônus pequenos, combinações táticas e poderes de maior impacto. O brilho dourado destaca as cartas mais fortes.</p><div class="catalog-filters">${[['all','TODAS'],['basic','BÁSICAS'],['tactical','TÁTICAS'],['power','PODEROSAS']].map(([id,label])=>`<button data-filter="${id}" aria-pressed="${filter===id}" class="${filter===id?'selected':''}">${label}</button>`).join('')}</div><div class="catalog-grid">${cards.map(c=>powerCard(c,0,false)).join('')}</div><p class="small-note">Básicas: azul · Táticas: violeta · Poderosas: dourado · Mesma chance no sorteio entre cartas elegíveis</p>`,true);$('modal').classList.add('catalog-modal');$('closeCatalog').onclick=menu;document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>catalogScreen(b.dataset.filter));}
  function start(){
    particles.length=0;trails.length=0;aim=-.68;clearInput();sfx('confirm');
    if(gameMode==='online'){ $('botLevel').textContent='ONLINE · 1×1';$('opponentName').textContent='RIVAL';$('footerDifficulty').textContent='ONLINE 1×1';connectOnline();return; }
    game.start(difficulty);$('botLevel').textContent=`BOT · ${levelName()}`;$('opponentName').textContent='SENTINELA';$('footerDifficulty').textContent=`BOT ${levelName()}`;draftScreen();
  }
  function buildList(team){const items=CARDS.filter(c=>game.rank(team,c.id));return items.length?items.map(c=>`<div class="build-item"><span class="mini-icon" style="color:${c.color}">${CardArt(c)}</span><div><strong>${c.name} <small>NÍV. ${game.rank(team,c.id)}</small></strong><p>${c.describe(game.rank(team,c.id))}</p></div></div>`).join(''):'<p class="empty-build">Nenhuma carta ainda.</p>';}
  function buildChips(team){return CARDS.filter(c=>game.rank(team,c.id)).map(c=>`<span class="build-chip" style="--accent:${c.color}" title="${c.describe(game.rank(team,c.id))}">${CardArt(c)} ${c.name} <b>${game.rank(team,c.id)}</b></span>`).join('')||'<span class="empty-build">Seu primeiro poder começa aqui.</span>';}
  function draftScreen(){
    const offers=game.offers.you;let chosen=null;
    show(`<div class="modal-top"><span class="small-tag">RODADA ${game.round} · ${game.score.you} : ${game.score.bot}</span><span class="offline-tag"><i></i> ESCOLHAS SIMULTÂNEAS</span></div><h1 class="draft-title">ESCOLHA SEU <em>PODER.</em></h1><p class="draft-intro">${offers.length?'Escolha uma carta. Seus poderes anteriores continuam ativos.':'Todas as suas cartas chegaram ao nível máximo. Continue com sua combinação.'}</p><div class="card-options">${offers.map(id=>powerCard(cardById(id),game.rank('you',id))).join('')}</div><div class="current-build"><span class="difficulty-label">SUA COMBINAÇÃO ATUAL</span><div class="build-chips">${buildChips('you')}</div></div><button id="confirmCard" class="primary" ${offers.length?'disabled':''}>${offers.length?'SELECIONE UMA CARTA':'REVELAR ESCOLHAS'} <span>↗</span></button><p class="small-note">3 opções por sorteio · Cada carta tem seu próprio limite · Valem só nesta partida</p>`,true);
    document.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{chosen=b.dataset.card;sfx('select');document.querySelectorAll('[data-card]').forEach(c=>{const selected=c.dataset.card===chosen;c.classList.toggle('selected',selected);c.setAttribute('aria-pressed',String(selected));});$('confirmCard').disabled=false;$('confirmCard').innerHTML=`ESCOLHER ${cardById(chosen).name.toUpperCase()} <span>↗</span>`;});
    $('confirmCard').onclick=()=>{if(gameMode==='online'){if(chosen!==null&&chosen===undefined)return;sfx('confirm');onlineSend('pick',{card:chosen});$('confirmCard').disabled=true;$('confirmCard').innerHTML='AGUARDANDO RIVAL...';return;}if(game.chooseCard(chosen)){sfx('confirm');revealScreen();}};$('statusText').textContent='ESCOLHA UMA CARTA';
  }
  function revealScreen(){
    $('statusText').textContent='PODERES REVELADOS';
    show(`<div class="modal-top"><span class="small-tag">RODADA ${game.round}</span><span class="offline-tag">PODERES REVELADOS</span></div><h1 class="draft-title">NOVAS <em>COMBINAÇÕES.</em></h1><p class="draft-intro">Veja o que mudou nos dois lados antes de lutar.</p><div class="reveal-grid">${['you','bot'].map(team=>{const c=cardById(game.picks[team]);return `<section class="revealed-card ${team} tier-${c?c.tier:'basic'}"><span class="reveal-owner">${team==='you'?'VOCÊ ESCOLHEU':'SENTINELA ESCOLHEU'}</span>${c?`<div class="reveal-icon" style="color:${c.color}">${CardArt(c)}</div><h2>${c.name}</h2><span class="level-tag">NÍVEL ${game.rank(team,c.id)}</span><p>${c.describe(game.rank(team,c.id))}</p>`:'<h2>Combinação completa</h2><p>Todas as cartas já estão no nível máximo.</p>'}</section>`;}).join('')}</div><div class="duo-builds"><div><span class="difficulty-label">SEUS PODERES</span><div class="build-chips">${buildChips('you')}</div></div><div><span class="difficulty-label">PODERES DO BOT</span><div class="build-chips">${buildChips('bot')}</div></div></div><button id="beginRound" class="primary">COMEÇAR RODADA ${game.round} <span>↗</span></button>`,true);
    $('beginRound').onclick=()=>{if(gameMode==='online'){onlineSend('ready');$('beginRound').disabled=true;$('beginRound').innerHTML='AGUARDANDO RIVAL...';return;}if(game.beginRound()){sfx('start');$('overlay').hidden=true;clearInput();aim=-.68;particles.length=0;trails.length=0;}};
  }
  function loadoutScreen(){if(game.state!=='playing'||game.paused)return;game.paused=true;show(`<div class="modal-top"><span class="small-tag">PARTIDA PAUSADA</span><span class="offline-tag">RODADA ${game.round}</span></div><h1 class="draft-title">PODERES <em>ATIVOS.</em></h1><div class="build-columns"><section><h2>VOCÊ</h2>${buildList('you')}</section><section><h2>SENTINELA</h2>${buildList('bot')}</section></div><button id="closeBuild" class="primary">VOLTAR AO DUELO <span>↗</span></button>`,true);$('closeBuild').onclick=togglePause;}
  function levelName(){return {easy:'INICIANTE',normal:'NORMAL',hard:'DIFÍCIL'}[difficulty];}
  function wireMenu(){
    document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('selected',b.dataset.level===difficulty);b.setAttribute('aria-pressed',String(b.dataset.level===difficulty));b.onclick=()=>{difficulty=b.dataset.level;sfx('ui');wireMenu();};});
    const setMode=mode=>{gameMode=mode;const bot=mode==='bot';$('modeBot').classList.toggle('selected',bot);$('modeOnline').classList.toggle('selected',!bot);$('modeBot').setAttribute('aria-pressed',String(bot));$('modeOnline').setAttribute('aria-pressed',String(!bot));$('botOptions').hidden=!bot;$('play').innerHTML=bot?'ENTRAR NA ARENA <span>↗</span>':'ENCONTRAR RIVAL <span>↗</span>';};
    $('modeBot').onclick=()=>{sfx('ui');setMode('bot');};$('modeOnline').onclick=()=>{sfx('ui');setMode('online');};setMode(gameMode);
    $('play').onclick=()=>{audioContext();sfx('confirm');start();};$('catalog').onclick=()=>{sfx('ui');catalogScreen();};
  }
  function menu(){stopOnline();game.initRound();game.state='menu';game.builds={you:{},bot:{}};game.score={you:0,bot:0};game.round=1;particles.length=0;trails.length=0;show(initialModal);wireMenu();$('statusText').textContent='ATÉ 5 RODADAS · 3 VITÓRIAS';}
  function resultScreen(){const final=game.state==='matchOver',winner=final?game.matchWinner:game.result.winner,win=winner==='you',drawn=winner===null;const title=drawn?'EMPATE.':win?(final?'ARENA DOMINADA.':'BOA RODADA.'):(final?'A REVANCHE É SUA.':'MAIS UMA CHANCE.');const detail=final?`${game.round>=5?'Limite de cinco rodadas atingido.':'Três vitórias encerram a partida.'} ${drawn?'Placar igual: a partida termina empatada.':'O placar decide o vencedor.'} A próxima partida começa sem poderes.`:drawn?'Mesma vida no fim da rodada. Ninguém pontua.':game.result.reason==='time'?'O tempo acabou. Venceu quem manteve mais vidas.':win?'Você encontrou a brecha e venceu o duelo.':gameMode==='online'?'Seu rival encontrou uma brecha. Use a cobertura e guarde a esquiva.':'O bot encontrou uma brecha. Use a cobertura e guarde a esquiva.';
    const accuracy=game.stats.shots?Math.round(game.stats.hits/game.stats.shots*100):0;
    show(`<div class="modal-top"><span class="small-tag">${final?'FIM DA PARTIDA':'RODADA ENCERRADA'}</span><span class="offline-tag">${gameMode==='online'?'ONLINE 1×1':`BOT · ${levelName()}`}</span></div><div class="result-score"><span class="you">${game.score.you}</span><span class="colon">:</span><span class="bot">${game.score.bot}</span></div><h1 style="font-size:30px;margin-top:0">${title}</h1><p class="result-summary">${detail}${final?'':' Escolha mais uma carta para o próximo duelo.'}</p><div class="result-stats"><div><b>${accuracy}%</b>PRECISÃO DOS TIROS</div><div><b>${game.stats.hits}</b>TIROS CERTEIROS</div><div><b>${game.stats.dashes}</b>ESQUIVAS</div></div><button id="continue" class="primary">${final?'NOVA PARTIDA · NOVAS CARTAS':'ESCOLHER PRÓXIMA CARTA'} <span>↗</span></button><button id="backMenu" class="secondary">Voltar ao início</button>`);
    $('continue').onclick=()=>{if(gameMode==='online'){onlineSend(final?'rematch':'next');$('continue').disabled=true;$('continue').innerHTML='AGUARDANDO RIVAL...';return;}if(final)start();else{game.nextRound();particles.length=0;trails.length=0;aim=-.68;draftScreen();}};$('backMenu').onclick=menu;$('statusText').textContent=final?(drawn?'EMPATE':win?'VITÓRIA':'DERROTA'):'INTERVALO';
  }
  function togglePause(){if(game.state!=='playing')return;if(gameMode==='online'){$('statusText').textContent='PARTIDAS ONLINE NÃO PAUSAM';return;}if(game.paused){game.paused=false;$('overlay').hidden=true;clearInput();return;}game.paused=true;show(`<div class="modal-top"><span class="small-tag">TEMPO PARA RESPIRAR</span><span class="offline-tag">PARTIDA LOCAL</span></div><h1 class="paused-title">JOGO PAUSADO.</h1><p class="result-summary">Mova-se com WASD ou setas. Mire com o mouse e segure o clique para atirar. Use espaço para esquivar.<br><br>No celular, use os controles esquerdo e direito. Arraste o direito na direção do rival para disparar.</p><button id="resume" class="primary">VOLTAR À ARENA <span>↗</span></button><button id="backMenu" class="secondary">Sair para o início</button>`);$('resume').onclick=togglePause;$('backMenu').onclick=menu;}
  function screenPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};}
  window.addEventListener('keydown',e=>{
    const k=e.code;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)&&game.state==='playing'&&!game.paused)e.preventDefault();
    if(k==='Escape'||k==='KeyP'){if(!e.repeat)togglePause();return;}
    if(game.state!=='playing'||game.paused)return;
    keys.add(k);if((k==='Space'||k==='ShiftLeft'||k==='ShiftRight')&&!e.repeat)dashRequested=true;
  });
  window.addEventListener('keyup',e=>keys.delete(e.code));
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'){pointer=screenPoint(e);aim=Math.atan2(pointer.y-game.player.y,pointer.x-game.player.x);}});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;if(e.button===0&&game.state==='playing'&&!game.paused){document.activeElement?.blur();canvas.setPointerCapture(e.pointerId);pointer=screenPoint(e);aim=Math.atan2(pointer.y-game.player.y,pointer.x-game.player.x);shooting=true;}});
  const releaseMouse=e=>{if(e.pointerType!=='touch')shooting=false;};window.addEventListener('pointerup',releaseMouse);window.addEventListener('pointercancel',releaseMouse);canvas.addEventListener('lostpointercapture',releaseMouse);canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',()=>{clearInput();if(game.state==='playing'&&!game.paused)togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(game.state==='playing'&&!game.paused)togglePause();}});
  for(const name of ['move','aim']){
    const el=$(name==='move'?'moveStick':'aimStick'),control=controls[name];
    const update=e=>{const b=el.getBoundingClientRect(),radius=b.width*.37,dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,n=Math.hypot(dx,dy),limit=n>radius?radius/n:1;control.x=dx*limit/radius;control.y=dy*limit/radius;el.querySelector('.knob').style.transform=`translate(${dx*limit*.65}px,${dy*limit*.65}px)`;if(name==='aim'&&n>9)aim=Math.atan2(dy*H/canvas.clientHeight,dx*W/canvas.clientWidth);};
    el.addEventListener('pointerdown',e=>{if(game.state!=='playing'||game.paused||control.id!==null)return;e.preventDefault();control.id=e.pointerId;el.setPointerCapture(e.pointerId);update(e);});el.addEventListener('pointermove',e=>{if(control.id===e.pointerId)update(e);});
    const end=e=>{if(control.id!==e.pointerId)return;control.id=null;control.x=0;control.y=0;el.querySelector('.knob').style.transform='';};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
  }
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.body.classList.add('touch-mode');},{passive:true});
  $('dash').addEventListener('pointerdown',e=>{e.preventDefault();if(game.state==='playing'&&!game.paused)dashRequested=true;});
  $('pause').onclick=togglePause;$('arenaPause').onclick=togglePause;
  $('loadoutButton').onclick=loadoutScreen;
  $('touchToggle').onclick=()=>{document.body.classList.toggle('touch-mode');const on=document.body.classList.contains('touch-mode');$('touchToggle').setAttribute('aria-label',on?'Ocultar controles de toque':'Mostrar controles de toque');clearInput();};
  $('sound').onclick=()=>{sound=!sound;try{localStorage.setItem('rift-sound',sound?'on':'off');}catch(_){}$('soundState').textContent=sound?'ON':'OFF';$('sound').setAttribute('aria-label',sound?'Desativar som':'Ativar som');$('sound').title=sound?'Desativar som':'Ativar som';sfx('ui');};
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(stage.requestFullscreen)await stage.requestFullscreen();}catch(_){$('statusText').textContent='TELA CHEIA INDISPONÍVEL';}};
  function tick(t){const dt=last?Math.min((t-last)/1000,.08):0;last=t;clock+=dt;
    if(!game.paused){acc+=dt;const step=gameMode==='online'?1/30:1/120;while(acc>=step){const mx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+controls.move.x,my=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+controls.move.y;if(pointer)aim=Math.atan2(pointer.y-game.player.y,pointer.x-game.player.x);const input={mx,my,angle:aim,fire:shooting||(controls.aim.id!==null&&Math.hypot(controls.aim.x,controls.aim.y)>.22),dash:dashRequested};if(gameMode==='online'){if(game.state==='playing')onlineSend('input',{input});}else game.update(step,input);dashRequested=false;acc-=step;}
      for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}for(let i=particles.length-1;i>=0;i--)if(particles[i].life<=0)particles.splice(i,1);for(const p of [game.player,game.bot])if(p.dashTime>0&&game.state==='playing')trails.push({x:p.x,y:p.y,angle:p.angle,team:p.team,life:.23});for(const p of trails)p.life-=dt;for(let i=trails.length-1;i>=0;i--)if(trails[i].life<=0)trails.splice(i,1);shake=Math.max(0,shake-dt*35);
    }else acc=0;
    if(game.state==='playing'&&!game.paused)for(const p of [game.player,game.bot])if(p.marked>0&&Math.hypot(p.vx,p.vy)>10)particles.push({x:p.x,y:p.y,vx:0,vy:0,life:.35,max:.35,size:3,color:'#ffe2a0'});eventEffects();hud();draw();requestAnimationFrame(tick);
  }
  document.querySelector('.brand').onclick=e=>{e.preventDefault();menu();};
  $('soundState').textContent=sound?'ON':'OFF';$('sound').setAttribute('aria-label',sound?'Desativar som':'Ativar som');$('sound').title=sound?'Desativar som':'Ativar som';
  wireMenu();hud();requestAnimationFrame(tick);
})();
