import{f as l,r as c,s as r}from"./index-BZ3h5Qdv.js";import{u}from"./useQuery-Jmm78tVv.js";import{u as d}from"./useMutation-CP_89NPj.js";function y(e){var s;const n=l(),o=u({queryKey:["notifications",e],queryFn:async()=>{if(!e)return[];const{data:t,error:i}=await r.from("notifications").select(`
          *,
          actor:users!notifications_actor_id_fkey(name)
        `).eq("user_id",e).order("created_at",{ascending:!1}).limit(50);if(i)throw i;return t||[]},enabled:!!e}),f=d({mutationFn:async()=>{if(!e)return;const{error:t}=await r.from("notifications").update({read:!0}).eq("user_id",e).eq("read",!1);if(t)throw t},onSuccess:()=>{n.invalidateQueries({queryKey:["notifications",e]})}});c.useEffect(()=>{if(!e)return;const t=r.channel(`notifications-${e}`).on("postgres_changes",{event:"*",schema:"public",table:"notifications",filter:`user_id=eq.${e}`},()=>{n.invalidateQueries({queryKey:["notifications",e]})}).subscribe();return()=>{r.removeChannel(t)}},[e,n]);const a=((s=o.data)==null?void 0:s.filter(t=>!t.read).length)||0;return c.useEffect(()=>{const t=document.querySelector("link[rel~='icon']");if(t)if(a>0){const i=`<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="patchworkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6C5CE7" />
            <stop offset="100%" stop-color="#8B7CF8" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="120" fill="url(#patchworkGrad)" />
        <g stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(100, 100) scale(13)">
          <path d="m15 12-8.373 8.373a1 1 0 1 1-1.414-1.414L13.586 10.586"/>
          <path d="m18 13.4-9-9"/>
          <path d="M12 4.4 14.6 2l3.4 3.4L15.6 8z"/>
          <path d="M18.4 10.6 21 8l-3.4-3.4L15 7.2"/>
        </g>
        <circle cx="420" cy="92" r="70" fill="#f43f5e" stroke="#0A0910" stroke-width="24" />
      </svg>`;t.href=`data:image/svg+xml,${encodeURIComponent(i)}`}else t.href="/icon.svg"},[a]),{...o,markAllAsRead:f}}export{y as u};
