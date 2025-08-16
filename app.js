// BOOart — وظائف الواجهة الأمامية
// تخزين محلي: الأعمال الفنية تحفظ في localStorage (بدون خادم)
const q = (s, r=document) => r.querySelector(s);
const qa = (s, r=document) => [...r.querySelectorAll(s)];
const $gallery = q('.gallery');
const $uploadDialog = q('#uploadDialog');
const $viewer = q('#viewerDialog');
const $viewerImg = q('#viewerImg');
const $viewerTitle = q('#viewerTitle');
const $viewerDesc = q('#viewerDesc');
const $viewerTags = q('#viewerTags');
const $likeBtn = q('#likeBtn');
const $likeCount = q('#likeCount');

const state = {
  items: [], // {id, title, artist, category, tags[], desc, src, date, likes}
  filtered: []
};

// عينات أولية (بما فيها شعار BOOart)
const samples = [
  {
    id: 'boo-logo',
    title: 'شعار BOOart',
    artist: 'BOO',
    category: 'شعارات',
    tags: ['boo','art','cute','logo'],
    desc: 'الشبح اللطيف BOO — توقيع المنصة.',
    src: 'assets/logo.png',
    date: Date.now()-86400000*3,
    likes: 21
  }
];

function saveToStorage(){
  localStorage.setItem('booart_items', JSON.stringify(state.items));
}
function loadFromStorage(){
  const raw = localStorage.getItem('booart_items');
  if(raw){
    try{ state.items = JSON.parse(raw); }catch{ state.items = []; }
  } else {
    state.items = samples;
    saveToStorage();
  }
}

function createCard(item){
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <div class="thumb">
      <img src="${item.src}" alt="${item.title}">
    </div>
    <div class="meta">
      <h3>${item.title}</h3>
      <p class="sub">${item.artist ? 'بواسطة '+item.artist+' · ' : ''}${item.category}</p>
      <div class="tags">${item.tags.map(t=>`<span class="tag">#${t}</span>`).join('')}</div>
    </div>
  `;
  el.addEventListener('click', ()=> openViewer(item));
  return el;
}

function render(list){
  $gallery.innerHTML = '';
  list.forEach(item => $gallery.appendChild(createCard(item)));
}

function filterAndSort(){
  const qText = q('#searchInput').value.trim().toLowerCase();
  const cat = q('#categoryFilter').value;
  const sort = q('#sortSelect').value;

  let res = state.items.filter(it => {
    const inCat = !cat || it.category === cat;
    const hay = [it.title, it.artist, it.category, (it.tags||[]).join(' '), it.desc].join(' ').toLowerCase();
    const inSearch = !qText || hay.includes(qText);
    return inCat && inSearch;
  });

  res.sort((a,b)=>{
    if(sort==='newest') return b.date - a.date;
    if(sort==='oldest') return a.date - b.date;
    if(sort==='az') return a.title.localeCompare(b.title, 'ar');
    if(sort==='za') return b.title.localeCompare(a.title, 'ar');
    if(sort==='likes') return (b.likes||0) - (a.likes||0);
    return 0;
  });

  state.filtered = res;
  render(res);
}

function openViewer(item){
  $viewerImg.src = item.src;
  $viewerTitle.textContent = item.title;
  $viewerDesc.textContent = item.desc || '';
  $viewerTags.innerHTML = item.tags.map(t=>`<span class="tag">#${t}</span>`).join('');
  $likeCount.textContent = item.likes||0;
  $likeBtn.onclick = () => {
    item.likes = (item.likes||0) + 1;
    $likeCount.textContent = item.likes;
    saveToStorage();
    filterAndSort();
  };
  if(typeof $viewer.showModal === 'function'){ $viewer.showModal(); }
}

function initUpload(){
  const openBtn = q('#openUpload');
  const fileInput = q('#fileInput');
  const previewBox = q('#uploadPreview');
  const saveBtn = q('#saveArtwork');

  openBtn.addEventListener('click', ()=> $uploadDialog.showModal());

  fileInput.addEventListener('change', ()=>{
    const f = fileInput.files[0];
    previewBox.innerHTML = '';
    if(!f) return;
    const img = new Image();
    img.onload = () => previewBox.appendChild(img);
    img.src = URL.createObjectURL(f);
  });

  saveBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const f = fileInput.files[0];
    if(!f) { alert('من فضلك اختر صورة.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const item = {
        id: 'id_'+Math.random().toString(16).slice(2),
        title: q('#titleInput').value || f.name,
        artist: q('#artistInput').value.trim(),
        category: q('#categoryInput').value || 'أخرى',
        tags: (q('#tagsInput').value||'').split(',').map(s=>s.trim()).filter(Boolean),
        desc: q('#descInput').value.trim(),
        src: reader.result, // DataURL
        date: Date.now(),
        likes: 0
      };
      state.items.unshift(item);
      saveToStorage();
      filterAndSort();
      $uploadDialog.close();
      // تنظيف
      q('#uploadForm').reset();
      q('#uploadPreview').innerHTML='';
    };
    reader.readAsDataURL(f);
  });
}

function simpleTextDialog(title, content){
  q('#textDialogTitle').textContent = title;
  q('#textDialogBody').innerHTML = content;
  q('#textDialog').showModal();
}

function initStaticDialogs(){
  q('#openAbout').addEventListener('click', ()=>{
    simpleTextDialog('عن BOOart', `
      <p>منصة خفيفة لعرض أعمالك الفنية بدون خادم. تُحفظ البيانات في جهازك (localStorage).</p>
      <p>يمكنك لاحقًا ربطها بواجهة برمجة أو لوحة تحكم حسب الحاجة.</p>
    `);
  });
  q('#openTerms').addEventListener('click', ()=>{
    simpleTextDialog('الشروط', '<p>المحتوى المرفوع يجب أن يكون مملوكًا لك ويوافق القوانين.</p>');
  });
  q('#openPrivacy').addEventListener('click', ()=>{
    simpleTextDialog('الخصوصية', '<p>لا يتم إرسال بياناتك لأي خادم — كل شيء محليًا على جهازك.</p>');
  });
  q('#exportData').addEventListener('click', ()=>{
    const data = JSON.stringify(state.items, null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'booart-data.json'; a.click();
    URL.revokeObjectURL(url);
  });
}

function init(){
  loadFromStorage();
  filterAndSort();
  initUpload();
  initStaticDialogs();

  q('#searchInput').addEventListener('input', filterAndSort);
  q('#categoryFilter').addEventListener('change', filterAndSort);
  q('#sortSelect').addEventListener('change', filterAndSort);
  q('#viewerDialog .close')?.addEventListener('click', ()=> $viewer.close());
}

document.addEventListener('DOMContentLoaded', init);