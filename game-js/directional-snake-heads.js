// Four raised-head views. Direction changes the drawing, never the neck's rotation.
(function () {
  'use strict';
  const names = ['front', 'left', 'right', 'back'];
  const angles = {right:0, front:Math.PI/2, left:Math.PI, back:-Math.PI/2};
  const delta = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
  window.updateSnakeHeadDirection = function (el, angle) {
    if (!el || !Number.isFinite(angle)) return;
    const old = el.dataset.headDirection;
    if (old && Math.abs(delta(angle, angles[old])) < Math.PI/4 + 0.10) return;
    const x=Math.cos(angle), y=Math.sin(angle);
    el.dataset.headDirection = Math.abs(x)>Math.abs(y) ? (x>0?'right':'left') : (y>0?'front':'back');
  };
  const image = new Image();
  image.onload = function () {
    const rects = [[89,82,360,564],[612,83,362,563],[1198,83,363,563],[1727,82,354,564]];
    const style=document.createElement('style');
    let css='';
    rects.forEach(([x,y,w,h],i)=>{
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext('2d');ctx.drawImage(image,x,y,w,h,0,0,w,h);
      const original=ctx.getImageData(0,0,w,h);
      // Anchor the narrow neck, not the wider asymmetrical face, over the body.
      let sum=0,count=0;
      for(let yy=Math.floor(h*.85);yy<Math.floor(h*.95);yy++)for(let xx=0;xx<w;xx++){
        if(original.data[(yy*w+xx)*4+3]>128){sum+=xx;count++;}
      }
      const anchor=count?sum/count:w/2;
      for(const palette of ['', 'yellow','red']){
        const pixels=new ImageData(new Uint8ClampedArray(original.data),w,h);
        if(palette)for(let k=0;k<pixels.data.length;k+=4){
          const r=pixels.data[k],g=pixels.data[k+1],b=pixels.data[k+2];
          if(g>45 && g>r*1.12 && g>b*1.12){
            // Recolor green scales only; preserve eyes, cheeks and dark outline.
            pixels.data[k]=g;
            pixels.data[k+1]=palette==='yellow'?Math.round(g*.83):Math.round(r*.35);
            pixels.data[k+2]=Math.round(b*.5);
          }
        }
        ctx.putImageData(pixels,0,0);
        const selector='#frog-game>.snake-head[data-head-direction="'+names[i]+'"]'+(palette?'[data-shed-palette="'+palette+'"]':':not([data-shed-palette="yellow"]):not([data-shed-palette="red"])')+'::before';
        css+=selector+'{background-image:url("'+canvas.toDataURL()+'");background-size:100% 100%;background-position:center;width:'+(40.7303*w/h)+'px;height:40.7303px;transform:translate(-'+(anchor/w*100)+'%,-100%);}\n';
      }
    });
    style.textContent=css;document.head.appendChild(style);
  };
  image.src='game-assets/sprites/snake-head-directions.png';
})();
