import{c as s,s as n}from"./index-dHsvE6he.js";import{u as r}from"./useQuery-C0URn5ro.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],y=s("pen",i);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],f=s("save",o);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",key:"r04s7s"}]],d=s("star",u);function _(a){return r({queryKey:["github_account",a],queryFn:async()=>{if(!a)return null;const{data:t,error:e}=await n.from("github_accounts").select("*").eq("user_id",a).maybeSingle();if(e)throw e;return t},enabled:!!a})}function h(a){return r({queryKey:["github_repositories",a],queryFn:async()=>{if(!a)return[];const{data:t,error:e}=await n.from("repositories").select("*").eq("linked_user_id",a);if(e)throw e;return t||[]},enabled:!!a})}function b(a){return r({queryKey:["github_drafts",a],queryFn:async()=>{if(!a)return[];const{data:t,error:e}=await n.from("github_drafts").select("*").eq("room_id",a).eq("status","draft").order("created_at",{ascending:!1});if(e)throw e;return t||[]},enabled:!!a})}function p(a){return r({queryKey:["linkedin_account",a],queryFn:async()=>{if(!a)return null;const{data:t,error:e}=await n.from("linkedin_accounts").select("*").eq("user_id",a).maybeSingle();if(e)throw e;return t},enabled:!!a})}export{y as P,f as S,p as a,d as b,b as c,h as d,_ as u};
