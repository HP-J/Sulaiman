!function(e){var t={};function n(r){if(t[r])return t[r].exports;var u=t[r]={i:r,l:!1,exports:{}};return e[r].call(u.exports,u,u.exports,n),u.l=!0,u.exports}n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:r})},n.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="/",n(n.s=1)}([function(e,t){e.exports=require("electron")},function(e,t,n){"use strict";n.r(t);var r,u=n(0),o=u.remote.getCurrentWindow(),l=u.screen.getPrimaryDisplay().workAreaSize,i=void 0,a=void 0,c={x:d(l.width,50),yFull:d(l.height,70),yBar:d(l.height,7),yClient:function(){return this.yFull-this.yBar}},s={x:Math.floor((l.width-c.x)/2),y:Math.floor((l.height-c.yFull)/2)};function d(e,t){return Math.floor(e*(t/100))}function p(){i.focus()}function y(){o.hide(),i.value="",f()}function f(){var e,t,n;a.value.length>0?a.value=i.value+(e=a.current,t=0,n=i.value.length,e.substring(0,t)+e.substring(n)):a.value=a.current=a.default}o.setSize(c.x,c.yFull),o.setPosition(s.x,s.y),function(){i=document.createElement("input"),(a=document.createElement("input")).className="placeholder",i.setAttribute("type","text"),a.setAttribute("type","text"),a.readOnly=!0,document.body.appendChild(i),document.body.appendChild(a),a.value=a.current=a.default="Search";var e,t,n,r=parseInt((e=i,t="left",n="",document.defaultView&&document.defaultView.getComputedStyle?n=document.defaultView.getComputedStyle(e,"").getPropertyValue(t):e.currentStyle&&(t=t.replace(/-(\w)/g,function(e,t){return t.toUpperCase()}),n=e.currentStyle[t]),n).replace(/\D/g,""));i.style.width=a.style.width=c.x-2*r+"px",i.style.height=a.style.height=c.yBar+"px",i.style.fontSize=a.style.fontSize=c.yBar/2+"px"}(),i.oninput=f,o.on("focus",p),o.on("blur",y),window.onkeyup=function(e){},(r=document.createElement("div")).className="button",r.innerHTML="Hello",r.style.position="absolute",r.style.left="1px",r.style.top=c.yBar+"px",r.style.width=c.x-1+"px",r.style.height="100px",document.body.appendChild(r)}]);