"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[360],{8059:(e,s,n)=>{n.r(s),n.d(s,{assets:()=>l,contentTitle:()=>r,default:()=>u,frontMatter:()=>i,metadata:()=>a,toc:()=>c});var t=n(5893),o=n(1151);const i={title:"Troubleshooting",sidebar_position:5},r=void 0,a={id:"troubleshooting",title:"Troubleshooting",description:"Handling ReferenceError: WebAssembly is not defined",source:"@site/docs/troubleshooting.md",sourceDirName:".",slug:"/troubleshooting",permalink:"/reassure/docs/troubleshooting",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:5,frontMatter:{title:"Troubleshooting",sidebar_position:5},sidebar:"tutorialSidebar",previous:{title:"API",permalink:"/reassure/docs/api"},next:{title:"Examples",permalink:"/reassure/docs/examples"}},l={},c=[{value:"Handling <code>ReferenceError: WebAssembly is not defined</code>",id:"handling-referenceerror-webassembly-is-not-defined",level:3}];function d(e){const s={code:"code",h3:"h3",p:"p",pre:"pre",...(0,o.a)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(s.h3,{id:"handling-referenceerror-webassembly-is-not-defined",children:["Handling ",(0,t.jsx)(s.code,{children:"ReferenceError: WebAssembly is not defined"})]}),"\n",(0,t.jsxs)(s.p,{children:["Reassure, by default, uses Node.js's ",(0,t.jsx)(s.code,{children:"--jitless"})," flag to disable its optimizing compiler to increase test stability. This flag prevents WebAssembly (WASM) from running because of internal Node.js architecture. In some cases, you might still allow your tests to include code depending on WASM, e.g., the ",(0,t.jsx)(s.code,{children:"fetch"})," method is implemented using WASM."]}),"\n",(0,t.jsxs)(s.p,{children:["In such cases, pass the ",(0,t.jsx)(s.code,{children:"--enable-wasm"})," flag to Reassure CLI:"]}),"\n",(0,t.jsx)(s.pre,{children:(0,t.jsx)(s.code,{className:"language-sh",children:"$ reassure --enable-wasm\n"})}),"\n",(0,t.jsxs)(s.p,{children:["This option will replace the Node.js ",(0,t.jsx)(s.code,{children:"--jitless"})," flag with alternative flags to achieve a similar stabilizing effect."]}),"\n",(0,t.jsx)(s.p,{children:"Note that this option is experimental and may negatively affect the stability of your tests."})]})}function u(e={}){const{wrapper:s}={...(0,o.a)(),...e.components};return s?(0,t.jsx)(s,{...e,children:(0,t.jsx)(d,{...e})}):d(e)}},1151:(e,s,n)=>{n.d(s,{Z:()=>a,a:()=>r});var t=n(7294);const o={},i=t.createContext(o);function r(e){const s=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function a(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),t.createElement(i.Provider,{value:s},e.children)}}}]);