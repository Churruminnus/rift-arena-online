'use strict';
function createPlayFabService({titleId='',secretKey='',fetchImpl=globalThis.fetch,log=()=>{}}={}){
  const title=String(titleId).trim(),secret=String(secretKey).trim();
  const configured=()=>/^[A-Za-z0-9]+$/.test(title)&&secret.length>=16;
  async function authenticateSessionTicket(sessionTicket){
    if(!configured())throw new Error('playfab-not-configured');
    if(typeof sessionTicket!=='string'||sessionTicket.length<16)throw new Error('playfab-session-invalid');
    const response=await fetchImpl(`https://${title}.playfabapi.com/Server/AuthenticateSessionTicket`,{method:'POST',headers:{'Content-Type':'application/json','X-SecretKey':secret},body:JSON.stringify({SessionTicket:sessionTicket})});
    const payload=await response.json().catch(()=>null),user=payload?.data?.UserInfo;
    if(!response.ok||payload?.code!==200||!user?.PlayFabId||payload.data.IsSessionTicketExpired){log('session-rejected',{status:response.status,code:payload?.errorCode||null});throw new Error('playfab-session-invalid');}
    const identity=Object.freeze({playFabId:user.PlayFabId,entityId:user.TitleInfo?.TitlePlayerAccount?.Id||null,entityType:user.TitleInfo?.TitlePlayerAccount?.Type||null,displayName:user.TitleInfo?.DisplayName||null});
    log('session-verified',{playFabId:identity.playFabId,entityId:identity.entityId});return identity;
  }
  return Object.freeze({configured,authenticateSessionTicket});
}
module.exports={createPlayFabService};
