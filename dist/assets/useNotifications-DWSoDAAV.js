import{f as d,r as c,s as i}from"./index-6pAmkhK5.js";import{u as h}from"./useQuery-CFRVHZdo.js";import{u as m}from"./useMutation-D7Ozn7eC.js";function w(t){var s;const o=d(),r=h({queryKey:["notifications",t],queryFn:async()=>{if(!t)return[];const{data:e,error:n}=await i.from("notifications").select(`
          *,
          actor:users!notifications_actor_id_fkey(name)
        `).eq("user_id",t).order("created_at",{ascending:!1}).limit(50);if(n)throw n;return e||[]},enabled:!!t}),f=m({mutationFn:async()=>{if(!t)return;const{error:e}=await i.from("notifications").update({read:!0}).eq("user_id",t).eq("read",!1);if(e)throw e},onSuccess:()=>{o.invalidateQueries({queryKey:["notifications",t]})}});c.useEffect(()=>{if(!t)return;const e=`notifications-${t}`,n=i.getChannels().find(u=>u.topic===`realtime:${e}`);n&&i.removeChannel(n);const l=i.channel(e).on("postgres_changes",{event:"*",schema:"public",table:"notifications",filter:`user_id=eq.${t}`},()=>{o.invalidateQueries({queryKey:["notifications",t]})}).subscribe();return()=>{i.removeChannel(l)}},[t,o]);const a=((s=r.data)==null?void 0:s.filter(e=>!e.read).length)||0;return c.useEffect(()=>{const e=document.querySelector("link[rel~='icon']");if(e)if(a>0){const n=`<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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
      </svg>`;e.href=`data:image/svg+xml,${encodeURIComponent(n)}`}else e.href="/icon.svg"},[a]),{...r,markAllAsRead:f}}export{w as u};
