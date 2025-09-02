function haptic(p=60){if("vibrate"in navigator)navigator.vibrate(p);}

// Tab navigation
function showTab(idx) {
  var tabs = document.querySelectorAll('.tab-section');
  var buttons = document.querySelectorAll('.tab-btn');
  tabs.forEach((tab,i)=>{
    tab.classList.toggle("visible",i===idx);
  });
  buttons.forEach((btn,i)=>{
    btn.classList.toggle("active",i===idx);
  });
  haptic([14,25]);
}
document.getElementById("tab-shrinkage").onclick=()=>showTab(0);
document.getElementById("tab-fit").onclick=()=>showTab(1);

// 1/8 round helpers
function snapEighth(v){return Math.round(v*8)/8;}
function fmtEighth(v){return snapEighth(v).toFixed(5);}

// Shrinkage calculator (all fields optional)
document.getElementById('shrinkageForm').addEventListener('submit',function(e){
  e.preventDefault();haptic([28,35,28]);
  let r='';const flds=[
    {label:'Length',before:'lengthBefore',after:'lengthAfter'},
    {label:'Waist',before:'waistBefore',after:'waistAfter'},
    {label:'Thigh',before:'thighBefore',after:'thighAfter'},
    {label:'Bottom',before:'bottomBefore',after:'bottomAfter'}
  ];let shrinkPercents={};
  flds.forEach(f=>{
    const b=parseFloat(document.getElementById(f.before).value);
    const a=parseFloat(document.getElementById(f.after).value);
    let s=(!isNaN(b)&&!isNaN(a)&&b>0)?((b-a)/b*100).toFixed(5):'';
    shrinkPercents[f.label.toLowerCase()]=s;
    r+=`<div class="result-card visible"><b>${f.label} Shrinkage:</b> ${s?s+'%':'—'}</div>`;
  });
  const res=document.getElementById('shrinkageResults');
  res.innerHTML=r; res.classList.add("visible");
  setTimeout(()=>{
    document.querySelectorAll('#shrinkageResults .result-card').forEach((el,i)=>{
      el.classList.remove("visible");
      setTimeout(()=>el.classList.add("visible"),80+i*50);
    });
  },20);
  window.s45ShrinkCache=shrinkPercents;
});
document.getElementById('sendToFit').onclick=function(){
  let c=window.s45ShrinkCache||{};
  ['waist','thigh','bottom'].forEach(f=>{
    if(c[f])document.getElementById('actual-'+f+'-shrinkage').value=c[f];
  });
  haptic([13,33,13]);showTab(1);
};

// --- FIT CONVERTER: Snap + show raw for Actual and Farma only ---
document.getElementById('fitForm').addEventListener('submit', function(e) {
  e.preventDefault(); haptic([31,33,26]);
  function beforeWash(t,s){
    s = s/100;
    if (!isFinite(t) || !isFinite(s) || s >= 1) return null;
    return t / (1 - s);
  }

  const fields = ['waist','thigh','bottom'],
        resultsActual = {},
        resultsFarma = {},
        snappedActual = {},
        snappedFarma = {},
        adjustments = {};

  const fs = parseFloat(document.getElementById('farma-shrinkage').value);
  let r='';

  fields.forEach(f=>{
    const t = parseFloat(document.getElementById(`target-${f}`).value);
    const as = parseFloat(document.getElementById(`actual-${f}-shrinkage`).value);
    // Calculate before-wash
    if(!isNaN(t)&&!isNaN(as)) resultsActual[f] = beforeWash(t,as);
    if(!isNaN(t)&&!isNaN(fs)) resultsFarma[f] = beforeWash(t,fs);
    // Snap to nearest 1/8"
    snappedActual[f] = (resultsActual[f] !== undefined) ? snapEighth(resultsActual[f]) : undefined;
    snappedFarma[f] = (resultsFarma[f] !== undefined) ? snapEighth(resultsFarma[f]) : undefined;
    // Adjustment as snapped difference
    if(snappedActual[f] !== undefined && snappedFarma[f] !== undefined) {
      adjustments[f] = +(snappedActual[f] - snappedFarma[f]).toFixed(3);
    }
  });

  r += '<div class="result-card visible"><h3>Before Wash (Actual)</h3>' +
          fields.map(f => `${f.charAt(0).toUpperCase()+f.slice(1)}: <b>${snappedActual[f] !== undefined ? snappedActual[f].toFixed(3) : '—'}</b> <span style="color:#888;font-size:.97em;">${resultsActual[f] !== undefined ? '(raw: ' + resultsActual[f].toFixed(3) + ')' : ''}</span>`).join('<br>') +
        '</div>';
  r += '<div class="result-card visible"><h3>Before Wash (Farma)</h3>' +
          fields.map(f => `${f.charAt(0).toUpperCase()+f.slice(1)}: <b>${snappedFarma[f] !== undefined ? snappedFarma[f].toFixed(3) : '—'}</b> <span style="color:#888;font-size:.97em;">${resultsFarma[f] !== undefined ? '(raw: ' + resultsFarma[f].toFixed(3) + ')' : ''}</span>`).join('<br>') +
        '</div>';
  r += '<div class="result-card visible"><h3>Adjustment</h3>' +
          fields.map(f => `${f.charAt(0).toUpperCase()+f.slice(1)}: <b>${adjustments[f] !== undefined ? adjustments[f].toFixed(3) : '—'}</b>`).join('<br>') +
        '</div>';

  const res = document.getElementById('results');
  res.innerHTML = r; res.classList.add("visible");
  setTimeout(()=>{
    document.querySelectorAll('#results .result-card').forEach((el,i)=>{
      el.classList.remove("visible");
      setTimeout(()=>el.classList.add("visible"),80+i*60);
    });
  },28);
});
document.getElementById('clear-bin').addEventListener('click', function() {
  // Clear ALL input fields in ALL tabs
  document.querySelectorAll('.floating-group input').forEach(input => input.value = '');

  // Hide ALL result display areas and cards everywhere
  document.querySelectorAll('.result-area, .result-card').forEach(el => el.classList.remove('visible'));

  // Optional: clear dynamic result HTML if needed
  // document.querySelectorAll('.result-area').forEach(el => el.innerHTML = '');

  // Haptic feedback for action
  haptic([32, 20]);
});
