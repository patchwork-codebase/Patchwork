import{c as i,s as n}from"./index-DowOzHyK.js";import{u as r}from"./useQuery-BTZky8iG.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],y=i("pen",u);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],f=i("save",s);function l(e){return r({queryKey:["github_account",e],queryFn:async()=>{if(!e)return null;const{data:a,error:t}=await n.from("github_accounts").select("*").eq("user_id",e).maybeSingle();if(t)throw t;return a},enabled:!!e})}function d(e){return r({queryKey:["github_repositories",e],queryFn:async()=>{if(!e)return[];const{data:a,error:t}=await n.from("repositories").select("*").eq("linked_user_id",e);if(t)throw t;return a||[]},enabled:!!e})}function h(e){return r({queryKey:["github_drafts",e],queryFn:async()=>{if(!e)return[];const{data:a,error:t}=await n.from("github_drafts").select("*").eq("room_id",e).eq("status","draft").order("created_at",{ascending:!1});if(t)throw t;return a||[]},enabled:!!e})}function _(e){return r({queryKey:["linkedin_account",e],queryFn:async()=>{if(!e)return null;const{data:a,error:t}=await n.from("linkedin_accounts").select("*").eq("user_id",e).maybeSingle();if(t)throw t;return a},enabled:!!e})}export{y as P,f as S,_ as a,h as b,d as c,l as u};
