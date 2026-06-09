import{c as i,s as r}from"./index-BZ3h5Qdv.js";import{u as a}from"./useQuery-Jmm78tVv.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",key:"tonef"}],["path",{d:"M9 18c-4.51 2-5-2-7-2",key:"9comsn"}]],y=i("github",c);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",key:"c2jq9f"}],["rect",{width:"4",height:"12",x:"2",y:"9",key:"mk3on5"}],["circle",{cx:"4",cy:"4",r:"2",key:"bt5ra8"}]],f=i("linkedin",u);function h(e){return a({queryKey:["github_account",e],queryFn:async()=>{if(!e)return null;const{data:n,error:t}=await r.from("github_accounts").select("*").eq("user_id",e).maybeSingle();if(t)throw t;return n},enabled:!!e})}function l(e){return a({queryKey:["github_repositories",e],queryFn:async()=>{if(!e)return[];const{data:n,error:t}=await r.from("repositories").select("*").eq("linked_user_id",e);if(t)throw t;return n||[]},enabled:!!e})}function b(e){return a({queryKey:["github_drafts",e],queryFn:async()=>{if(!e)return[];const{data:n,error:t}=await r.from("github_drafts").select("*").eq("room_id",e).eq("status","draft").order("created_at",{ascending:!1});if(t)throw t;return n||[]},enabled:!!e})}function d(e){return a({queryKey:["linkedin_account",e],queryFn:async()=>{if(!e)return null;const{data:n,error:t}=await r.from("linkedin_accounts").select("*").eq("user_id",e).maybeSingle();if(t)throw t;return n},enabled:!!e})}export{y as G,f as L,d as a,l as b,b as c,h as u};
