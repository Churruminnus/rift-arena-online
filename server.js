'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');
const { Game } = require('./engine.js');
const port = Number(process.env.PORT || 10000);
const publicDir = __dirname;
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const waiting = [], rooms = new Set();

function send(res,status,body,type='text/plain; charset=utf-8'){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);}
function message(socket,data){if(socket && socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(data));}
function cleanInput(value={}){const finite=n=>Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;return {mx:finite(value.mx),my:finite(value.my),angle:Number.isFinite(value.angle)?value.angle:0,fire:!!value.fire,dash:!!value.dash};}
function validPick(room,side,id){const offers=room.game.offers[side]||[];return offers.length?offers.includes(id):id===null;}
function publicState(room,side,events=[]){const g=room.game;return {type:'state',side,state:{state:g.state,time:g.time,countdown:g.countdown,zone:g.zone,round:g.round,score:g.score,builds:g.builds,picks:g.picks,player:g.player,bot:g.bot,bullets:g.bullets,bombs:g.bombs,echoes:g.echoes,result:g.result,matchWinner:g.matchWinner,offers:g.state==='draft'?g.offers[side]:[],events}};}
function sync(room,events=[]){for(const side of ['you','bot'])message(room.players[side],publicState(room,side,events));}
function removeWaiting(socket){const i=waiting.indexOf(socket);if(i>=0)waiting.splice(i,1);}
function endRoom(room,leftSide){if(!rooms.delete(room))return;for(const side of ['you','bot']){const socket=room.players[side];if(side!==leftSide)message(socket,{type:'opponent-left'});if(socket)socket.room=null;}}
function createRoom(first,second){const room={game:new Game(),players:{you:first,bot:second},inputs:{you:cleanInput(),bot:cleanInput()},picks:{},ready:new Set(),nextReady:new Set(),rematchReady:new Set()};rooms.add(room);first.room=room;first.side='you';second.room=room;second.side='bot';room.game.startOnline();const events=room.game.drain();message(first,{type:'matched',side:'you'});message(second,{type:'matched',side:'bot'});sync(room,events);}
function joinQueue(socket){if(socket.room||waiting.includes(socket))return;const opponent=waiting.shift();if(opponent&&opponent.readyState===WebSocket.OPEN)createRoom(opponent,socket);else{waiting.push(socket);message(socket,{type:'queue'});}}
function handleMessage(socket,data){if(!data||typeof data.type!=='string')return;if(data.type==='queue')return joinQueue(socket);if(data.type==='cancel')return removeWaiting(socket);const room=socket.room;if(!room)return;const side=socket.side;
  if(data.type==='input'&&room.game.state==='playing'){room.inputs[side]=cleanInput(data.input);return;}
  if(data.type==='pick'&&room.game.state==='draft'&&validPick(room,side,data.card)){room.picks[side]=data.card;message(socket,{type:'waiting-pick'});if(Object.prototype.hasOwnProperty.call(room.picks,'you')&&Object.prototype.hasOwnProperty.call(room.picks,'bot')){room.game.chooseCards(room.picks.you,room.picks.bot);sync(room,room.game.drain());}return;}
  if(data.type==='ready'&&room.game.state==='reveal'){room.ready.add(side);if(room.ready.size===2){room.ready.clear();room.game.beginRound();sync(room,room.game.drain());}else message(socket,{type:'waiting-ready'});return;}
  if(data.type==='next'&&room.game.state==='roundOver'){room.nextReady.add(side);if(room.nextReady.size===2){room.nextReady.clear();room.picks={};room.game.nextRound();sync(room,room.game.drain());}else message(socket,{type:'waiting-next'});return;}
  if(data.type==='rematch'&&room.game.state==='matchOver'){room.rematchReady.add(side);if(room.rematchReady.size===2){room.rematchReady.clear();room.picks={};room.game.startOnline();sync(room,room.game.drain());}else message(socket,{type:'waiting-rematch'});}
}
const server=http.createServer((req,res)=>{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname==='/health')return send(res,200,JSON.stringify({status:'ok',service:'rift-arena',mode:'online-1v1'}),'application/json');if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Método não permitido');const requested=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/,'');const file=path.resolve(publicDir,requested);if(!file.startsWith(publicDir+path.sep)&&file!==path.join(publicDir,'index.html'))return send(res,403,'Acesso negado');fs.readFile(file,(error,data)=>{if(error)return send(res,404,'Página não encontrada');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'public, max-age=300'});if(req.method==='HEAD')return res.end();res.end(data);});});
const wss=new WebSocketServer({server,path:'/ws'});
wss.on('connection',socket=>{socket.room=null;socket.side=null;socket.on('message',raw=>{try{handleMessage(socket,JSON.parse(String(raw)));}catch(_){message(socket,{type:'error',message:'Mensagem inválida.'});}});socket.on('close',()=>{removeWaiting(socket);if(socket.room)endRoom(socket.room,socket.side);});});
setInterval(()=>{for(const room of rooms){if(room.game.state!=='playing')continue;room.game.update(1/60,room.inputs.you,room.inputs.bot);room.inputs.you.dash=false;room.inputs.bot.dash=false;sync(room,room.game.drain());}},1000/60);
server.listen(port,'0.0.0.0',()=>console.log(`RIFT Arena online disponível na porta ${port}`));
