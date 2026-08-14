(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();async function e(e,t){let n=await e.arrayBuffer(),r=await t.decodeAudioData(n);return{fileName:e.name,buffer:r}}function t(e,t){if(t<=0||e.length===0)return[];let n=e.length/t,r=[];for(let i=0;i<t;i++){let t=Math.floor(i*n),a=Math.max(t+1,Math.floor((i+1)*n)),o=e[t]??0,s=e[t]??0;for(let n=t;n<a&&n<e.length;n++){let t=e[n];t<o&&(o=t),t>s&&(s=t)}r.push({min:o,max:s})}return r}function n(e,n){let r=e.getContext(`2d`);if(!r)return;let i=e.width,a=e.height,o=t(n.getChannelData(0),i),s=a/2;r.clearRect(0,0,i,a),r.fillStyle=`#1d4ed8`,o.forEach((e,t)=>{let n=s-e.max*s,i=s-e.min*s;r.fillRect(t,n,1,Math.max(1,i-n))})}function r(e,t,n){let r=e=>{let t=e?.[0];t&&n(t)};e.addEventListener(`click`,()=>t.click()),e.addEventListener(`dragover`,t=>{t.preventDefault(),e.classList.add(`is-dragover`)}),e.addEventListener(`dragleave`,()=>{e.classList.remove(`is-dragover`)}),e.addEventListener(`drop`,t=>{t.preventDefault(),e.classList.remove(`is-dragover`),r(t.dataTransfer?.files??null)}),t.addEventListener(`change`,()=>{r(t.files)})}var i=class{context;source=null;constructor(e){this.context=e}play(e,t){this.stop();let n=this.context.createBufferSource();n.buffer=e,n.connect(this.context.destination),n.onended=()=>t?.(),n.start(),this.source=n}stop(){if(this.source){try{this.source.stop()}catch{}this.source.disconnect(),this.source=null}}get isPlaying(){return this.source!==null}},a=.5;function o(e){return Math.min(2,Math.max(a,e))}function s({low:e,high:t}){if(e<=0)throw RangeError(`low must be greater than 0`);if(t<=e)throw RangeError(`high must be greater than low`);let n=Math.sqrt(e*t);return{frequency:n,Q:n/(t-e)}}function c(e,t){return t.map(t=>{let{frequency:n,Q:r}=s(t),i=e.createBiquadFilter();return i.type=`notch`,i.frequency.value=n,i.Q.value=r,i})}function l(e,t,n){let r=[e,...t,n];for(let e=0;e<r.length-1;e++)r[e].connect(r[e+1])}async function u(e,{playbackRate:t=1,bands:n=[]}={}){let r=Math.max(1,Math.ceil(e.length/t)),i=new OfflineAudioContext(e.numberOfChannels,r,e.sampleRate),a=i.createBufferSource();return a.buffer=e,a.playbackRate.value=t,l(a,c(i,n),i.destination),a.start(),i.startRendering()}var d=document.querySelector(`#app`);if(d){d.innerHTML=`
    <main>
      <h1>音声加工ツール</h1>
      <div id="drop-zone" class="drop-zone">
        <p>音声ファイルをドラッグ&ドロップ、またはクリックして選択</p>
        <input id="file-input" type="file" accept="audio/*" hidden />
      </div>
      <p id="file-info" class="file-info"></p>
      <canvas id="waveform" width="600" height="120"></canvas>
      <div class="controls">
        <button id="play-button" type="button" disabled>再生</button>
        <button id="stop-button" type="button" disabled>停止</button>
      </div>

      <section class="speed-section">
        <h2>再生スピード</h2>
        <label>
          <input id="speed-slider" type="range" min="0.5" max="2" step="0.05" value="1" />
          <span id="speed-value">1.00x</span>
        </label>
        <p class="hint">速度に連動してピッチも変化します(テープ早回しモード)</p>
      </section>

      <section class="band-section">
        <h2>カットする周波数帯域</h2>
        <div class="band-inputs">
          <label>下限(Hz) <input id="band-low" type="number" min="1" value="300" /></label>
          <label>上限(Hz) <input id="band-high" type="number" min="2" value="3000" /></label>
          <button id="add-band" type="button">帯域を追加</button>
        </div>
        <p id="band-error" class="band-error"></p>
        <ul id="band-list" class="band-list"></ul>
      </section>

      <button id="preview-button" type="button" disabled>加工後をプレビュー再生</button>
    </main>
  `;let t=document.querySelector(`#drop-zone`),a=document.querySelector(`#file-input`),s=document.querySelector(`#file-info`),c=document.querySelector(`#waveform`),l=document.querySelector(`#play-button`),f=document.querySelector(`#stop-button`),p=document.querySelector(`#speed-slider`),m=document.querySelector(`#speed-value`),h=document.querySelector(`#band-low`),g=document.querySelector(`#band-high`),_=document.querySelector(`#add-band`),v=document.querySelector(`#band-error`),y=document.querySelector(`#band-list`),b=document.querySelector(`#preview-button`),x=new AudioContext,S=new i(x),C=null,w=[],T=1,E=e=>{l.disabled=e||!C,f.disabled=!e,b.disabled=e||!C},D=()=>{y.innerHTML=w.map((e,t)=>`<li>${e.low}Hz - ${e.high}Hz <button type="button" data-index="${t}">削除</button></li>`).join(``)};r(t,a,async t=>{s.textContent=`読み込み中: ${t.name}`;try{C=await e(t,x);let{duration:r,sampleRate:i,numberOfChannels:a}=C.buffer;s.textContent=`${C.fileName} (${r.toFixed(2)}秒 / ${i}Hz / ${a}ch)`,n(c,C.buffer),E(!1)}catch{s.textContent=`${t.name} を音声として読み込めませんでした`,C=null,E(!1)}}),l.addEventListener(`click`,()=>{C&&(E(!0),S.play(C.buffer,()=>E(!1)))}),f.addEventListener(`click`,()=>{S.stop(),E(!1)}),p.addEventListener(`input`,()=>{T=o(Number(p.value)),m.textContent=`${T.toFixed(2)}x`}),_.addEventListener(`click`,()=>{let e=Number(h.value),t=Number(g.value);if(!(e>0)||!(t>e)){v.textContent=`下限は0より大きく、上限は下限より大きい値を指定してください`;return}v.textContent=``,w=[...w,{low:e,high:t}],D()}),y.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof HTMLButtonElement))return;let n=Number(t.dataset.index);w=w.filter((e,t)=>t!==n),D()}),b.addEventListener(`click`,async()=>{if(C){E(!0);try{let e=await u(C.buffer,{playbackRate:T,bands:w});S.play(e,()=>E(!1))}catch{v.textContent=`プレビューの生成に失敗しました`,E(!1)}}})}