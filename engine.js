(function(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./cards.js') : root.CardCatalog);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArenaCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(CARDS) {
  'use strict';
  const W=1200, H=720, BOUNDS={x:65,y:118,w:1070,h:530};
  const WALLS=[{x:290,y:240,w:155,h:64},{x:755,y:240,w:155,h:64},{x:290,y:444,w:155,h:64},{x:755,y:444,w:155,h:64}];
  const SETTINGS={easy:{speed:154,fire:1.32,spread:.18,lead:.12,dodge:.12},normal:{speed:181,fire:1.02,spread:.105,lead:.42,dodge:.48},hard:{speed:204,fire:.77,spread:.045,lead:.75,dodge:.85}};
  const cardById=id=>CARDS.find(c=>c.id===id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const norm=(x,y)=>{const n=Math.hypot(x,y);return n>.0001?{x:x/n,y:y/n}:{x:0,y:0};};
  function segmentRect(ax,ay,bx,by,r,pad=0) {
    let lo=0,hi=1;
    for(const [a,d,min,max] of [[ax,bx-ax,r.x-pad,r.x+r.w+pad],[ay,by-ay,r.y-pad,r.y+r.h+pad]]) {
      if(Math.abs(d)<1e-9){if(a<min||a>max)return null;}
      else {let p=(min-a)/d,q=(max-a)/d;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);if(lo>hi)return null;}
    }
    return lo;
  }
  function segmentCircle(ax,ay,bx,by,x,y,r) {
    const dx=bx-ax,dy=by-ay,fx=ax-x,fy=ay-y;
    const a=dx*dx+dy*dy,c=fx*fx+fy*fy-r*r;
    if(c<=0)return 0;if(a<1e-9)return null;
    const b=2*(fx*dx+fy*dy),disc=b*b-4*a*c;if(disc<0)return null;
    const t=(-b-Math.sqrt(disc))/(2*a);return t>=0&&t<=1?t:null;
  }
  function lineClear(a,b,pad=4){return !WALLS.some(r=>segmentRect(a.x,a.y,b.x,b.y,r,pad)!==null);}
  function solidHit(ax,ay,x,y,r=5){let nearest=Infinity,normal=null;
    for(const b of WALLS){const t=segmentRect(ax,ay,x,y,b,r);if(t!==null&&t<nearest){nearest=t;const sx=ax+(x-ax)*t,sy=ay+(y-ay)*t;const faces=[{d:Math.abs(sx-(b.x-r)),x:-1,y:0},{d:Math.abs(sx-(b.x+b.w+r)),x:1,y:0},{d:Math.abs(sy-(b.y-r)),x:0,y:-1},{d:Math.abs(sy-(b.y+b.h+r)),x:0,y:1}];faces.sort((a,b)=>a.d-b.d);normal=faces[0];}}
    for(const [axis,value,nx,ny] of [['x',BOUNDS.x+r,1,0],['x',BOUNDS.x+BOUNDS.w-r,-1,0],['y',BOUNDS.y+r,0,1],['y',BOUNDS.y+BOUNDS.h-r,0,-1]]){const end=axis==='x'?x:y,start=axis==='x'?ax:ay,delta=end-start,crossing=axis==='x'?(nx>0?end<value:end>value):(ny>0?end<value:end>value);if(crossing&&Math.abs(delta)>1e-9){const t=(value-start)/delta;if(t>=0&&t<nearest){nearest=t;normal={x:nx,y:ny};}}}
    return {t:nearest,normal};
  }
  function blocked(x,y,r=19){return x<BOUNDS.x+r||x>BOUNDS.x+BOUNDS.w-r||y<BOUNDS.y+r||y>BOUNDS.y+BOUNDS.h-r||WALLS.some(b=>x>b.x-r&&x<b.x+b.w+r&&y>b.y-r&&y<b.y+b.h+r);}
  function move(p,dx,dy){
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/7));
    for(let i=0;i<steps;i++) {
      p.x=clamp(p.x+dx/steps,BOUNDS.x+p.r,BOUNDS.x+BOUNDS.w-p.r);
      for(const b of WALLS)if(p.x>b.x-p.r&&p.x<b.x+b.w+p.r&&p.y>b.y-p.r&&p.y<b.y+b.h+p.r){if(dx>0)p.x=b.x-p.r;else if(dx<0)p.x=b.x+b.w+p.r;}
      p.y=clamp(p.y+dy/steps,BOUNDS.y+p.r,BOUNDS.y+BOUNDS.h-p.r);
      for(const b of WALLS)if(p.x>b.x-p.r&&p.x<b.x+b.w+p.r&&p.y>b.y-p.r&&p.y<b.y+b.h+p.r){if(dy>0)p.y=b.y-p.r;else if(dy<0)p.y=b.y+b.h+p.r;}
    }
  }
  // A small visibility graph routes the bot around cover without cutting corners.
  function route(start,goal){
    const nodes=[start,goal];
    for(const b of WALLS)for(const x of [b.x-29,b.x+b.w+29])for(const y of [b.y-29,b.y+b.h+29])if(!blocked(x,y))nodes.push({x,y});
    const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),used=new Set();dist[0]=0;
    for(let j=0;j<nodes.length;j++){
      let u=-1;for(let i=0;i<nodes.length;i++)if(!used.has(i)&&(u<0||dist[i]<dist[u]))u=i;
      if(u<0||!isFinite(dist[u])||u===1)break;used.add(u);
      for(let v=0;v<nodes.length;v++)if(v!==u&&!used.has(v)&&lineClear(nodes[u],nodes[v],23)){
        const d=dist[u]+Math.hypot(nodes[u].x-nodes[v].x,nodes[u].y-nodes[v].y);if(d<dist[v]){dist[v]=d;prev[v]=u;}
      }
    }
    if(!isFinite(dist[1]))return [];
    const out=[];let n=1;while(n>0){out.unshift(nodes[n]);n=prev[n];}return out;
  }
  function fighter(x,y,team){return {x,y,r:18,team,hp:3,angle:team==='you'?-.6:2.6,vx:0,vy:0,fireCd:.5,dashCd:0,dashTime:0,dashX:0,dashY:0,invuln:0,hit:0,recoil:0,hazard:0,sinceShot:1,firstShot:true,counterReady:false,adrenaline:0,momentum:0,exit:0,marked:0};}
  class Game {
    constructor(random=Math.random){this.random=random;this.events=[];this.difficulty='normal';this.score={you:0,bot:0};this.builds={you:{},bot:{}};this.round=1;this.stats={shots:0,hits:0,dashes:0};this.state='menu';this.initRound();this.state='menu';}
    emit(type,data={}){this.events.push({type,...data});}
    drain(){const e=this.events;this.events=[];return e;}
    start(difficulty='normal'){this.difficulty=SETTINGS[difficulty]?difficulty:'normal';this.score={you:0,bot:0};this.builds={you:{},bot:{}};this.round=1;this.stats={shots:0,hits:0,dashes:0};this.events=[];this.initRound();this.prepareDraft();}
    initRound(){this.player=fighter(360,570,'you');this.bot=fighter(840,174,'bot');this.bullets=[];this.bombs=[];this.echoes=[];this.time=60;this.countdown=1.6;this.zone=0;this.state='playing';this.paused=false;this.result=null;this.matchWinner=null;this.ai={think:0,path:[],dir:1,shift:1.3,react:.15};}
    rank(team,id){return this.builds[team][id]||0;}
    offer(team){const pool=CARDS.filter(c=>this.rank(team,c.id)<c.max&&(!c.requires||this.rank(team,c.requires)>0)).map(c=>c.id);for(let i=pool.length-1;i>0;i--){const j=Math.min(i,Math.floor(this.random()*(i+1)));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,3);}
    prepareDraft(){this.state='draft';this.offers={you:this.offer('you'),bot:this.offer('bot')};
      // Commit the bot before the human chooses: never counter-pick a hidden selection.
      this.botPick=this.offers.bot.length?this.offers.bot[Math.min(this.offers.bot.length-1,Math.floor(this.random()*this.offers.bot.length))]:null;this.picks=null;this.emit('draft');}
    chooseCard(id){if(this.state!=='draft'||(this.offers.you.length?!this.offers.you.includes(id):id!==null))return false;
      if(id)this.builds.you[id]=this.rank('you',id)+1;
      if(this.botPick)this.builds.bot[this.botPick]=this.rank('bot',this.botPick)+1;
      this.picks={you:id,bot:this.botPick};this.state='reveal';this.emit('reveal');return true;}
    beginRound(){if(this.state!=='reveal')return false;this.state='playing';this.emit('round');return true;}
    nextRound(){if(this.state==='roundOver'){this.round++;this.initRound();this.prepareDraft();}}
    weapon(team){const p=team==='you'?this.player:this.bot,R=id=>this.rank(team,id),heavy=R('heavy'),double=R('double');
      const bonus=.08*R('velocity')+(p.hp===1?.12*R('cold'):0)+(p.sinceShot>=1?.15*R('patient'):0)+(p.counterReady?.2*R('counter'):0);
      return {count:1+double,interval:(team==='you'?.34:SETTINGS[this.difficulty].fire)*Math.pow(1.5,double)*(1-.05*R('rhythm')),speed:560*Math.pow(.75,heavy)*(1+bonus),radius:(5+heavy*3)*(1+.1*R('caliber')+(p.firstShot?.2*R('prepared'):0)),damage:1+heavy,bounces:R('ricochet'),life:(2.2+heavy*.5)*(1+.2*R('range')),pierce:!!R('pierce')};}
    movementBonus(p){return .06*this.rank(p.team,'light')+(this.time>58?.15*this.rank(p.team,'opener'):0)+(p.adrenaline>0?.12:0)+(p.momentum>0?.08:0)+(p.exit>0?.08:0);}
    dash(p,dx,dy){if(p.dashCd>0||p.dashTime>0)return false;const n=norm(dx,dy);if(!n.x&&!n.y)return false;p.dashX=n.x;p.dashY=n.y;p.dashTime=.16;p.dashCd=3*(1-.08*this.rank(p.team,'reflex'));p.invuln=.21;if(p.team==='you')this.stats.dashes++;this.emit('dash',{x:p.x,y:p.y,team:p.team});const bomb=this.rank(p.team,'bomb');if(bomb)this.bombs.push({x:p.x,y:p.y,team:p.team,fuse:.65,radius:82+14*(bomb-1)});if(this.rank(p.team,'echo'))this.echoes.push({...p,life:.75,dashTime:0,invuln:0});return true;}
    fire(p,angle){if(p.fireCd>0||p.hp<=0)return false;
      const w=this.weapon(p.team);p.fireCd=w.interval;p.recoil=1;p.sinceShot=0;p.firstShot=false;p.counterReady=false;
      if(p.team==='you')this.stats.shots+=w.count;
      this.emit('shot',{x:p.x,y:p.y,team:p.team});
      for(let i=0;i<w.count;i++){const a=angle+(i-(w.count-1)/2)*.12;const q={x:p.x,y:p.y,px:p.x,py:p.y,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,team:p.team,life:w.life,radius:w.radius,damage:w.damage,bounces:w.bounces,pierce:w.pierce};
        // Sweep all the way from the fighter to the muzzle, including close ricochets.
        if(this.advanceBullet(q,32/w.speed))this.bullets.push(q);
      }return true;
    }
    hurt(p,source,damage=1,kind='projectile'){if(p.hp<=0||p.invuln>0)return false;const dealt=Math.min(p.hp,damage);p.hp-=dealt;p.invuln=.42;p.hit=.3;
      if(kind==='projectile'&&(source==='you'||source==='bot')){if(source==='you')this.stats.hits++;const attacker=source==='you'?this.player:this.bot;attacker.dashCd=Math.max(0,attacker.dashCd-.4*this.rank(source,'hunter'));if(this.rank(source,'momentum'))attacker.momentum=1;if(this.rank(source,'tracker'))p.marked=2;}
      if(this.rank(p.team,'adrenaline'))p.adrenaline=1;if(this.rank(p.team,'counter'))p.counterReady=true;
      this.emit('hit',{x:p.x,y:p.y,team:p.team,damage:dealt,kind});return true;}
    advanceBullet(q,dt){let remaining=dt;
      for(let attempt=0;attempt<5&&remaining>1e-8;attempt++){
        const x=q.x+q.vx*remaining,y=q.y+q.vy*remaining,r=q.radius||5;const {t:nearest,normal}=solidHit(q.x,q.y,x,y,r);
        const target=q.team==='you'?this.bot:this.player;const hit=target.hp>0&&target.invuln<=0?segmentCircle(q.x,q.y,x,y,target.x,target.y,target.r+r):null;
        if(hit!==null&&hit<nearest){this.hurt(target,q.team,q.damage||1,'projectile');return false;}
        q.px=q.x;q.py=q.y;
        if(nearest===Infinity){q.x=x;q.y=y;return true;}
        q.x+=(x-q.x)*nearest;q.y+=(y-q.y)*nearest;this.emit('spark',{x:q.x,y:q.y,team:q.team});
        if(q.bounces<=0||!q.bounces)return false;q.bounces--;
        const dot=q.vx*normal.x+q.vy*normal.y;q.vx-=2*dot*normal.x;q.vy-=2*dot*normal.y;q.x+=normal.x*.05;q.y+=normal.y*.05;remaining*=1-nearest;
      }return true;
    }
    collideProjectiles(dt){
      const hits=[];
      // Swept relative motion catches fast opposing shots between simulation frames.
      for(let i=0;i<this.bullets.length;i++)for(let j=i+1;j<this.bullets.length;j++){
        const a=this.bullets[i],b=this.bullets[j];if(a.team===b.team||(a.pierce&&b.pierce)||a.life<=0||b.life<=0)continue;
        const t=segmentCircle(a.x-b.x,a.y-b.y,a.x-b.x+(a.vx-b.vx)*dt,a.y-b.y+(a.vy-b.vy)*dt,0,0,(a.radius||5)+(b.radius||5));if(t===null||t*dt>=a.life||t*dt>=b.life)continue;
        const unobstructed=q=>{const ex=q.x+q.vx*dt,ey=q.y+q.vy*dt;if(solidHit(q.x,q.y,ex,ey,q.radius||5).t<=t)return false;const p=q.team==='you'?this.bot:this.player;const h=p.hp>0&&p.invuln<=0?segmentCircle(q.x,q.y,ex,ey,p.x,p.y,p.r+(q.radius||5)):null;return h===null||h>t;};
        if(unobstructed(a)&&unobstructed(b))hits.push({a,b,t});
      }
      hits.sort((a,b)=>a.t-b.t);const dead=new Set();for(const {a,b,t} of hits){if(dead.has(a)||dead.has(b))continue;if(!a.pierce)dead.add(a);if(!b.pierce)dead.add(b);this.emit('spark',{x:a.x+a.vx*dt*t,y:a.y+a.vy*dt*t,team:a.pierce?a.team:b.pierce?b.team:a.team});}
      this.bullets=this.bullets.filter(q=>!dead.has(q));
    }
    threat(p){return this.bullets.find(q=>{if(q.team===p.team)return false;const x=q.x+q.vx*.35,y=q.y+q.vy*.35;const t=segmentCircle(q.x,q.y,x,y,p.x,p.y,p.r+(q.radius||5)+6);return t!==null&&t<solidHit(q.x,q.y,x,y,q.radius||5).t;});}
    aimSegments(p,angle=p.angle){const w=this.weapon(p.team),extended=this.rank(p.team,'sight')&&w.bounces>0;let length=extended?760:290,x=p.x,y=p.y,dx=Math.cos(angle),dy=Math.sin(angle);const lines=[];
      for(let i=0;i<(extended?2:1);i++){const ex=x+dx*length,ey=y+dy*length,{t,normal}=solidHit(x,y,ex,ey,w.radius),fraction=Math.min(1,t),nx=x+(ex-x)*fraction,ny=y+(ey-y)*fraction;lines.push({x,y,ex:nx,ey:ny});if(t===Infinity)break;const dot=dx*normal.x+dy*normal.y;dx-=2*dot*normal.x;dy-=2*dot*normal.y;length*=1-t;x=nx+normal.x*.05;y=ny+normal.y*.05;}
      return lines;
    }
    bankAngle(p,target){if(!this.rank(p.team,'sight')||!this.rank(p.team,'ricochet'))return null;const r=this.weapon(p.team).radius,planes=[['x',BOUNDS.x+r],['x',BOUNDS.x+BOUNDS.w-r],['y',BOUNDS.y+r],['y',BOUNDS.y+BOUNDS.h-r]];for(const b of WALLS)planes.push(['x',b.x-r],['x',b.x+b.w+r],['y',b.y-r],['y',b.y+b.h+r]);
      for(const [axis,v] of planes){const tx=axis==='x'?2*v-target.x:target.x,ty=axis==='y'?2*v-target.y:target.y,a=Math.atan2(ty-p.y,tx-p.x),segments=this.aimSegments(p,a),s=segments[1];if(s&&segmentCircle(s.x,s.y,s.ex,s.ey,target.x,target.y,target.r+r)!==null)return a;}return null;
    }
    finish(winner,reason){if(this.state!=='playing')return;if(winner)this.score[winner]++;this.result={winner,reason};this.state=this.score.you>=3||this.score.bot>=3||this.round>=5?'matchOver':'roundOver';if(this.state==='matchOver')this.matchWinner=this.score.you===this.score.bot?null:this.score.you>this.score.bot?'you':'bot';this.emit('finish',{winner:this.state==='matchOver'?this.matchWinner:winner,match:this.state==='matchOver'});}
    controlBot(dt){
      const b=this.bot,s=SETTINGS[this.difficulty],a=this.ai;
      const decoy=this.player.marked<=0?this.echoes.find(e=>e.team==='you'&&e.life>.3&&lineClear(b,e,10)):null;
      const p=decoy||this.player;
      const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy),toward=norm(dx,dy);
      a.shift-=dt;if(a.shift<=0){a.dir*=-1;a.shift=1.1+this.random()*1.4;}
      a.react-=dt;
      if(a.react<=0){a.react=.14;
        if(b.dashCd<=0&&this.random()<Math.min(.95,s.dodge+(this.rank('bot','alert')?.15:0))){
          const threat=this.bullets.find(q=>q.team==='you'&&segmentCircle(q.x,q.y,q.x+q.vx*.3,q.y+q.vy*.3,b.x,b.y,36)!==null);
          if(threat){const n=norm(-threat.vy,threat.vx);let sign=a.dir;if(blocked(b.x+n.x*sign*110,b.y+n.y*sign*110))sign*=-1;this.dash(b,n.x*sign,n.y*sign);}
        }
      }
      const clear=lineClear(b,p,10),edge=this.zone;
      a.think-=dt;
      if(a.think<=0){a.think=.28;
        let goal=null;
        if(edge>0&&(b.x<BOUNDS.x+edge+45||b.x>BOUNDS.x+BOUNDS.w-edge-45||b.y<BOUNDS.y+edge+45||b.y>BOUNDS.y+BOUNDS.h-edge-45))goal={x:600,y:383};
        else if(!clear){
          const candidates=[{x:600,y:188},{x:600,y:382},{x:600,y:579},{x:206,y:377},{x:994,y:377},...Array.from({length:8},(_,i)=>({x:p.x+Math.cos(i*Math.PI/4)*290,y:p.y+Math.sin(i*Math.PI/4)*290}))];
          const viable=candidates.filter(c=>!blocked(c.x,c.y,30)&&lineClear(c,p,8));
          viable.sort((c,e)=>Math.hypot(b.x-c.x,b.y-c.y)-Math.hypot(b.x-e.x,b.y-e.y));goal=viable[0]||{x:600,y:383};
        }
        a.path=goal?route(b,goal):[];
      }
      let mx=0,my=0;
      if(a.path.length){let q=a.path[0];if(Math.hypot(q.x-b.x,q.y-b.y)<20){a.path.shift();q=a.path[0];}if(q){const n=norm(q.x-b.x,q.y-b.y);mx=n.x;my=n.y;}}
      else {const approach=d>390?.85:d<245?-.8:0;mx=toward.x*approach-toward.y*a.dir*.78;my=toward.y*approach+toward.x*a.dir*.78;}
      const danger=this.bombs.find(q=>q.team==='you'&&Math.hypot(q.x-b.x,q.y-b.y)<q.radius+40&&lineClear(q,b,0));if(danger){const escape=norm(b.x-danger.x,b.y-danger.y);mx=escape.x;my=escape.y;}
      if(this.rank('bot','bomb')&&d<125&&b.dashCd<=0&&this.random()<dt*.8)this.dash(b,-toward.y*a.dir,toward.x*a.dir);
      const m=norm(mx,my);this.moveFighter(b,m.x,m.y,s.speed,dt);
      const lead=d/this.weapon('bot').speed*s.lead;
      b.angle=Math.atan2(p.y+p.vy*lead-b.y,p.x+p.vx*lead-b.x);
      const bank=!clear?this.bankAngle(b,p):null;if(bank!==null)b.angle=bank;
      if((clear||bank!==null)&&d<790&&b.fireCd<=0){const spread=(this.random()-.5)*s.spread*(bank!==null?.5:2);this.fire(b,b.angle+spread);}
    }
    moveFighter(p,mx,my,speed,dt){const x=p.x,y=p.y;if(p.dashTime>0){const boost=1+.2*this.rank(p.team,'longdash');move(p,p.dashX*810*dt*boost,p.dashY*810*dt*boost);}else{const boost=1+this.movementBonus(p);move(p,mx*speed*dt*boost,my*speed*dt*boost);}p.vx=(p.x-x)/dt;p.vy=(p.y-y)/dt;}
    update(dt,input={}){
      if(this.state!=='playing'||this.paused)return;
      dt=clamp(dt,0,.034);if(dt<=0)return;
      if(this.countdown>0){this.countdown=Math.max(0,this.countdown-dt);return;}
      this.time=Math.max(0,this.time-dt);this.zone=this.time<25?(25-this.time)/25*195:0;
      for(const p of [this.player,this.bot]){const wasDashing=p.dashTime>0;for(const k of ['fireCd','dashTime','invuln','hit','adrenaline','momentum','exit','marked'])p[k]=Math.max(0,p[k]-dt);if(wasDashing&&p.dashTime===0&&this.rank(p.team,'exit'))p.exit=1;p.sinceShot+=dt;p.dashCd=Math.max(0,p.dashCd-dt*(p.hp===1?1+.6*this.rank(p.team,'breath'):1));p.recoil=Math.max(0,p.recoil-dt*9);}
      this.echoes=this.echoes.filter(e=>(e.life-=dt)>0);
      const p=this.player,m=norm(input.mx||0,input.my||0);
      if(Number.isFinite(input.angle))p.angle=input.angle;
      if(input.dash)this.dash(p,m.x||m.y?m.x:Math.cos(p.angle),m.x||m.y?m.y:Math.sin(p.angle));
      this.moveFighter(p,m.x,m.y,226,dt);
      if(input.fire)this.fire(p,p.angle);
      this.controlBot(dt);
      this.collideProjectiles(dt);
      const live=[];
      for(const q of this.bullets){
        q.life-=dt;if(q.life>0&&this.advanceBullet(q,dt))live.push(q);
      }
      this.bullets=live;
      const bombs=[];for(const bomb of this.bombs){bomb.fuse-=dt;if(bomb.fuse>0){bombs.push(bomb);continue;}this.emit('explosion',{...bomb});const target=bomb.team==='you'?this.bot:this.player;if(Math.hypot(target.x-bomb.x,target.y-bomb.y)<=bomb.radius+target.r&&lineClear(bomb,target,0))this.hurt(target,bomb.team,1,'bomb');}this.bombs=bombs;
      for(const f of [this.player,this.bot]){
        const outside=f.x<BOUNDS.x+this.zone||f.x>BOUNDS.x+BOUNDS.w-this.zone||f.y<BOUNDS.y+this.zone||f.y>BOUNDS.y+BOUNDS.h-this.zone;
        if(this.zone>0&&outside){f.hazard+=dt;if(f.hazard>=1){this.hurt(f,'zone',1,'zone');f.hazard=0;}}else f.hazard=0;
      }
      if(this.player.hp<=0||this.bot.hp<=0)this.finish(this.player.hp<=0?(this.bot.hp<=0?null:'bot'):'you','elimination');
      else if(this.time<=0)this.finish(this.player.hp===this.bot.hp?null:this.player.hp>this.bot.hp?'you':'bot','time');
    }
  }
  return {Game,W,H,BOUNDS,WALLS,SETTINGS,CARDS,cardById,clamp,norm,segmentRect,segmentCircle,solidHit,lineClear,blocked,move,route};
});
