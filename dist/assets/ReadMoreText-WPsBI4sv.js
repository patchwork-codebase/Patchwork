import{c,r as d,j as t}from"./index-dHsvE6he.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]],u=c("message-circle",x);function h({content:l,text:r,maxLength:a=250,className:o=""}){const[n,i]=d.useState(!1),e=l??r??"";return e?e.length<a&&e.split(`
`).length<=4?t.jsx("p",{className:o,children:e}):t.jsxs("div",{className:"relative",children:[t.jsx("p",{className:`${o} ${n?"":"line-clamp-4 overflow-hidden"}`,children:e}),n?t.jsx("button",{onClick:s=>{s.stopPropagation(),i(!1)},className:"text-slate-500 hover:text-white font-bold text-[13px] mt-2 transition-colors focus-visible:outline-none",children:"Show less"}):t.jsx("button",{onClick:s=>{s.stopPropagation(),i(!0)},className:"text-[#8B7CF8] hover:text-white font-bold text-[13px] mt-2 transition-colors focus-visible:outline-none",children:"Read more"})]}):null}export{u as M,h as R};
