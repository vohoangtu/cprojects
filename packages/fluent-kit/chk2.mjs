const h={n100:'#f1f5f9',n50:'#f8fafc',w:'#ffffff',base:'#f4f6fb',n500:'#64748b',n600:'#475569',n700:'#334155',n900:'#0f172a'};
const lum=x=>{x=x.replace('#','');const a=[0,2,4].map(i=>parseInt(x.substr(i,2),16)).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4});return .2126*a[0]+.7152*a[1]+.0722*a[2]};
const R=(a,b)=>{const l1=lum(h[a]||a),l2=lum(h[b]||b);return +((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)).toFixed(2)};
for(const fg of ['n500','n600','n700'])for(const bg of ['w','n50','n100','base'])console.log(fg,'/',bg,'=',R(fg,bg), R(fg,bg)>=4.5?'PASS':'FAIL');
