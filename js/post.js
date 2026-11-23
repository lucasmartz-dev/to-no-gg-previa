/* To No GG — desenha o post do "Cardápio do dia" no canvas, com a identidade do post original.
   Formatos: feed 1080x1350 (Instagram), status 1080x1920 (WhatsApp e Stories), og 1200x630 (prévia do link). */
(function (g) {
  const T = g.TONOGG;
  const C = {
    cafe: '#2B1E15', tinta: '#3A2A1E', lousa: '#1D1A17', vermelho: '#BE2A21', vermelhoEsc: '#8F1D16',
    creme: '#EEE3CD', creme2: '#DCCBA9', ouro: '#F2CF96', rotulo: '#F8E9CF', giz: '#F6F1E7', pincel: '#D5342A'
  };
  const F = { titulo: 'Anton', pincel: '"Permanent Marker"', rotulo: 'Oswald', texto: 'Montserrat' };
  const TAM = { feed: [1080, 1350], status: [1080, 1920], og: [1200, 630] };
  const cache = {};
  // usa a versão embutida (js/imagens.js) quando existe: assim o canvas pode ser baixado mesmo aberto pelo arquivo
  const img = src => {
    const emb = g.TONOGG_IMG && g.TONOGG_IMG[src.replace(/^.*?(img\/)/, '$1')];
    const real = emb || src;
    return cache[real] || (cache[real] = new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = real; }));
  };
  const FONE = new Path2D('M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z');
  const PINO = new Path2D('M12 0C5.4 0 0 5.2 0 11.7 0 20.4 12 30 12 30s12-9.6 12-18.3C24 5.2 18.6 0 12 0zm0 16a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z');

  async function fontes() {
    const lista = [`400 100px ${F.titulo}`, `400 100px ${F.pincel}`, `700 100px ${F.rotulo}`, `600 100px ${F.rotulo}`, `500 100px ${F.rotulo}`, `800 100px ${F.texto}`, `500 100px ${F.texto}`];
    try { await Promise.all(lista.map(f => document.fonts.load(f, 'ÁÃÇ0123'))); await document.fonts.ready; } catch (e) {}
  }
  function cabe(ctx, txt, peso, fam, max, larg) {
    let s = max;
    for (; s > 16; s -= 2) { ctx.font = `${peso} ${s}px ${fam}`; if (ctx.measureText(txt).width <= larg) break; }
    return s;
  }
  function espaco(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }

  /* ---------- peças ---------- */
  function fundo(ctx, w, h, textura, cor) {
    ctx.fillStyle = textura ? ctx.createPattern(textura, 'repeat') : cor; ctx.fillRect(0, 0, w, h);
  }
  function faixa(ctx, x, y, w, h, textura) { // juta escura com borda de baixo picotada
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h);
    const dente = 26;
    for (let px = x + w; px > x; px -= dente) { ctx.lineTo(px - dente / 2, y + h - 13); ctx.lineTo(px - dente, y + h); }
    ctx.closePath();
    ctx.fillStyle = textura ? ctx.createPattern(textura, 'repeat') : '#4A3626'; ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(240,220,190,.45)'; ctx.lineWidth = 3; ctx.setLineDash([16, 10]);
    ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x + w, y + 16); ctx.stroke(); ctx.restore();
  }
  function remendo(ctx, x, y, w, h, cor, costura) {
    ctx.save();
    ctx.shadowColor = 'rgba(40,25,10,.35)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = costura; ctx.lineWidth = 3; ctx.setLineDash([14, 9]);
    ctx.beginPath(); ctx.roundRect(x + 12, y + 12, w - 24, h - 24, 4); ctx.stroke(); ctx.restore();
  }
  function xis(ctx, cx, cy, s, cor, rot) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * Math.PI / 180);
    ctx.strokeStyle = cor; ctx.lineCap = 'round'; ctx.lineWidth = s * .17;
    ctx.beginPath(); ctx.moveTo(-s / 2, -s / 2); ctx.lineTo(s / 2, s / 2); ctx.moveTo(s / 2, -s / 2); ctx.lineTo(-s / 2, s / 2); ctx.stroke();
    ctx.restore();
  }
  function gasto(ctx, txt, x, base, fonte, cor, alinha, mascara, sombra) {
    ctx.font = fonte; const m = ctx.measureText(txt);
    const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent, w = m.width;
    const off = document.createElement('canvas'); off.width = Math.ceil(w + 40); off.height = Math.ceil(asc + desc + 40);
    const o = off.getContext('2d'); o.font = fonte; o.fillStyle = cor; o.fillText(txt, 20, 20 + asc);
    if (mascara) { o.globalCompositeOperation = 'destination-in'; o.fillStyle = o.createPattern(mascara, 'repeat'); o.fillRect(0, 0, off.width, off.height); }
    const dx = alinha === 'center' ? x - w / 2 - 20 : alinha === 'right' ? x - w - 20 : x - 20;
    ctx.save();
    if (sombra) { ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowOffsetY = 6; }
    ctx.drawImage(off, dx, base - asc - 20); ctx.restore();
    return w;
  }
  function logo(ctx, cx, y, w, h, icone, nome, tipo) {
    remendo(ctx, cx - w / 2, y, w, h, C.creme, 'rgba(90,62,36,.55)');
    const iw = w * .42, ih = iw * 110 / 300;
    if (icone) ctx.drawImage(icone, cx - iw / 2, y + h * .14, iw, ih);
    ctx.fillStyle = C.tinta; ctx.textAlign = 'center';
    const n = (nome || '').toUpperCase(), sn = cabe(ctx, n, 800, F.texto, Math.round(h * .2), w - 60);
    ctx.font = `800 ${sn}px ${F.texto}`; ctx.fillText(n, cx, y + h * .73);
    espaco(ctx, Math.round(h * .03)); ctx.font = `500 ${Math.round(h * .072)}px ${F.texto}`; ctx.fillText((tipo || '').toUpperCase(), cx, y + h * .86); espaco(ctx, 0);
    ctx.textAlign = 'left';
  }
  function lousa(ctx, x, y, w, h, p, mascara) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.lousa; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.restore();
    const cx = x + w / 2;
    const destaque = (p.destaque || '').toUpperCase(), comp = (p.complemento || '').toUpperCase();
    const s1 = cabe(ctx, destaque, 400, F.pincel, Math.min(160, h * .44), w - 150);
    ctx.font = `400 ${s1}px ${F.pincel}`; const w1 = ctx.measureText(destaque).width;
    const b1 = comp ? y + h * .47 : y + h * .62;
    ctx.fillStyle = C.pincel; ctx.textAlign = 'center'; ctx.fillText(destaque, cx, b1); ctx.textAlign = 'left';
    ctx.fillStyle = C.pincel; const yb = b1 - s1 * .32;
    [[cx - w1 / 2 - 58, cx - w1 / 2 - 16], [cx + w1 / 2 + 16, cx + w1 / 2 + 58]].forEach(([a, b]) => {
      ctx.beginPath(); ctx.roundRect(a, yb - 10, b - a, 7, 3); ctx.roundRect(a + 6, yb + 4, b - a - 6, 7, 3); ctx.fill();
    });
    if (comp) { const s2 = cabe(ctx, comp, 400, F.titulo, Math.min(130, h * .36), w - 60); gasto(ctx, comp, cx, y + h * .84, `400 ${s2}px ${F.titulo}`, C.giz, 'center', mascara, false); }
  }
  function precos(ctx, x, y, w, h, tamanhos, deitado) {
    ctx.save(); ctx.shadowColor = 'rgba(60,10,5,.35)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.vermelho; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(246,225,190,.6)'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]);
    ctx.beginPath(); ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 6); ctx.stroke();
    const n = Math.max(1, tamanhos.length);
    ctx.textAlign = 'center';
    tamanhos.forEach((t, i) => {
      let cx, top, cw, ch;
      if (deitado) { cw = (w - 20) / n; ch = h - 20; cx = x + 10 + cw * i + cw / 2; top = y + 10; if (i) { ctx.beginPath(); ctx.moveTo(x + 10 + cw * i, y + 26); ctx.lineTo(x + 10 + cw * i, y + h - 26); ctx.stroke(); } }
      else { cw = w - 20; ch = (h - 20) / n; cx = x + w / 2; top = y + 10 + ch * i; if (i) { ctx.beginPath(); ctx.moveTo(x + 30, top); ctx.lineTo(x + w - 30, top); ctx.stroke(); } }
      const sl = Math.min(46, ch * .3), sv = Math.min(80, ch * .5);
      ctx.fillStyle = C.rotulo; ctx.font = `600 ${sl}px ${F.rotulo}`; ctx.fillText((t.nome || '').toUpperCase() + ':', cx, top + ch * .42);
      const val = T.brlCurto(t.preco); const svv = cabe(ctx, val, 700, F.rotulo, sv, cw - 30);
      ctx.fillStyle = C.ouro; ctx.font = `700 ${svv}px ${F.rotulo}`; ctx.fillText(val, cx, top + ch * .42 + svv * 1.0);
    });
    ctx.textAlign = 'left'; ctx.restore();
  }
  function cobrir(ctx, im, x, y, w, h) {
    const r = Math.max(w / im.width, h / im.height); const sw = w / r, sh = h / r;
    ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
  }
  function polaroid(ctx, im, x, y, w, h, rot, vazio) {
    if (!im && !vazio) return;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot * Math.PI / 180);
    ctx.shadowColor = 'rgba(40,25,10,.4)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#F7F1E4'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowColor = 'transparent';
    const m = Math.max(10, w * .03);
    if (im) cobrir(ctx, im, -w / 2 + m, -h / 2 + m, w - 2 * m, h - 2 * m);
    else {
      ctx.strokeStyle = '#CDB993'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.strokeRect(-w / 2 + m, -h / 2 + m, w - 2 * m, h - 2 * m); ctx.setLineDash([]);
      ctx.fillStyle = C.tinta; ctx.textAlign = 'center'; ctx.font = `400 ${Math.round(h * .14)}px ${F.pincel}`; ctx.fillText('Foto do prato de hoje', 0, h * .05); ctx.textAlign = 'left';
    }
    ctx.fillStyle = 'rgba(226,211,180,.85)'; ctx.rotate(-4 * Math.PI / 180); ctx.fillRect(-70, -h / 2 - 16, 140, 32);
    ctx.restore();
  }
  function contato(ctx, x, y, w, h, S) {
    ctx.save(); ctx.shadowColor = 'rgba(30,18,8,.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.fillStyle = C.cafe; ctx.beginPath(); ctx.roundRect(x, y, w, h, 28); ctx.fill(); ctx.restore();
    const r = Math.min(48, h * .3), cx = x + 26 + r, cy = y + h / 2;
    ctx.fillStyle = C.vermelho; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(cx - r * .55, cy - r * .55); ctx.scale(r * 1.1 / 24, r * 1.1 / 24); ctx.fillStyle = '#fff'; ctx.fill(FONE); ctx.restore();
    const tx = cx + r + 24, larg = x + w - tx - 20;
    ctx.fillStyle = C.creme2; ctx.font = `500 ${Math.round(h * .17)}px ${F.rotulo}`;
    ctx.fillText('PEDIDOS PELO WHATSAPP', tx, y + h * .33);
    const num = T.zapBonito(S) || '(00) 0 0000-0000'; const sn = cabe(ctx, num, 700, F.rotulo, Math.round(h * .4), larg);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${sn}px ${F.rotulo}`; ctx.fillText(num, tx, y + h * .68);
    if (S.link) { const sl = cabe(ctx, 'ou pelo site: ' + S.link, 500, F.rotulo, Math.round(h * .15), larg); ctx.fillStyle = C.ouro; ctx.font = `500 ${sl}px ${F.rotulo}`; ctx.fillText('ou pelo site: ' + S.link, tx, y + h * .87); }
  }
  function fita(ctx, x, y, w, h, txt, rot) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot * Math.PI / 180);
    const p = [[0, .08], [.04, 0], [.96, .06], [1, 0], [.98, .5], [1, 1], [.95, .92], [.05, 1], [0, .94], [.02, .5]];
    ctx.beginPath(); p.forEach(([a, b], i) => { const px = -w / 2 + a * w, py = -h / 2 + b * h; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.closePath();
    ctx.fillStyle = C.vermelho; ctx.fill();
    const s = cabe(ctx, txt, 600, F.rotulo, h * .62, w - 50);
    ctx.fillStyle = '#fff'; ctx.font = `600 ${s}px ${F.rotulo}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 0, 2);
    ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  function rodape(ctx, y, w, h, S, linha) {
    ctx.fillStyle = C.creme; ctx.fillRect(0, y, w, h);
    ctx.save(); ctx.strokeStyle = 'rgba(90,62,36,.45)'; ctx.lineWidth = 3; ctx.setLineDash([14, 9]);
    ctx.beginPath(); ctx.moveTo(0, y + 10); ctx.lineTo(w, y + 10); ctx.stroke(); ctx.restore();
    const ph = h * .58, px = 46;
    ctx.save(); ctx.translate(px, y + (h - ph) / 2 + 4); ctx.scale(ph / 30, ph / 30); ctx.fillStyle = C.vermelho; ctx.fill(PINO); ctx.restore();
    const tx = px + ph * .8 + 22;
    const l1 = (linha || S.endereco).toUpperCase();
    const s1 = cabe(ctx, l1, 700, F.rotulo, h * .4, w - tx - 30);
    ctx.fillStyle = C.tinta; ctx.font = `700 ${s1}px ${F.rotulo}`; ctx.fillText(l1, tx, y + h * .52);
    const l2 = (S.referencia || '').toUpperCase();
    const s2 = cabe(ctx, l2, 500, F.rotulo, h * .24, w - tx - 30);
    ctx.font = `500 ${s2}px ${F.rotulo}`; ctx.fillText(l2, tx, y + h * .83);
  }

  /* ---------- montagem ---------- */
  async function desenhar(canvas, S, formato) {
    const [w, h] = TAM[formato] || TAM.feed;
    canvas.width = w; canvas.height = h;
    const base = canvas.dataset.base || '';
    await fontes();
    const [clara, escura, mascara, icone, chapeu] = await Promise.all(
      ['img/juta-clara.jpg', 'img/juta-escura.jpg', 'img/gasto.png', 'img/logo-icone.svg', 'img/chapeu.svg'].map(s => img(base + s)));
    const p = S.pratos.find(x => x.ativo && !x.acabou) || S.pratos.find(x => x.ativo) || S.pratos[0];
    const foto = p && p.foto ? await img(p.foto.startsWith('data:') ? p.foto : base + p.foto) : null;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic'; espaco(ctx, 0);
    const data = T.dataCurta().toUpperCase();

    if (formato === 'og') {
      fundo(ctx, w, h, escura, '#4A3626');
      xis(ctx, 1150, 560, 40, C.vermelho, 12);
      logo(ctx, 240, -14, 380, 196, icone, S.nome, S.tipo);
      const s = cabe(ctx, 'CARDÁPIO', 400, F.titulo, 150, 600);
      gasto(ctx, 'CARDÁPIO', 56, 360, `400 ${s}px ${F.titulo}`, C.giz, 'left', mascara, true);
      gasto(ctx, 'DO DIA!', 56, 520, `400 ${s}px ${F.titulo}`, C.giz, 'left', mascara, true);
      if (chapeu) { ctx.save(); ctx.translate(520, 410); ctx.rotate(-9 * Math.PI / 180); ctx.drawImage(chapeu, -80, -50, 160, 95); ctx.restore(); }
      polaroid(ctx, foto, 690, 64, 460, 330, 3, !!S.demo);
      fita(ctx, 660, 432, 500, 66, 'MARMITAS COM ENTREGA', -2);
      rodape(ctx, 548, w, 82, S, [S.endereco, (S.bairro || '').split(',')[0]].filter(Boolean).join(' · '));
      return canvas;
    }

    const status = formato === 'status';
    fundo(ctx, w, h, clara, '#B7946A');
    const Y = status
      ? { logo: 180, logoH: 210, faixa: 360, faixaH: 520, data: 412, l1: 672, l2: 868, chapeu: [800, 690], lousa: [60, 905, 960, 300], precos: [60, 1230, 960, 190], foto: [190, 1440, 700, 230], contato: [70, 1610, 940, 140], fita: null, rod: [1765, 84] }
      : { logo: -14, logoH: 200, faixa: 168, faixaH: 478, data: 214, l1: 448, l2: 628, chapeu: [800, 460], lousa: [50, 668, 560, 340], precos: [630, 652, 400, 392], foto: [600, 1066, 430, 196], contato: [40, 1044, 528, 160], fita: [64, 1200, 430, 54], rod: [1272, 78] };

    xis(ctx, 104, status ? 120 : 96, 66, C.vermelho, 10);
    xis(ctx, 990, status ? 140 : 104, 46, C.tinta, -6);
    faixa(ctx, -10, Y.faixa, w + 20, Y.faixaH, escura);
    logo(ctx, w / 2, Y.logo, 420, Y.logoH, icone, S.nome, S.tipo);
    ctx.fillStyle = C.creme2; ctx.font = `600 30px ${F.rotulo}`; espaco(ctx, 2); ctx.textAlign = 'center'; ctx.fillText(data, w / 2, Y.data + (status ? 0 : 0)); ctx.textAlign = 'left'; espaco(ctx, 0);
    const st = cabe(ctx, 'CARDÁPIO', 400, F.titulo, status ? 230 : 205, w - 110);
    gasto(ctx, 'CARDÁPIO', w / 2, Y.l1, `400 ${st}px ${F.titulo}`, C.giz, 'center', mascara, true);
    gasto(ctx, 'DO DIA!', w / 2 - 40, Y.l2, `400 ${st}px ${F.titulo}`, C.giz, 'center', mascara, true);
    if (chapeu) { ctx.save(); ctx.translate(Y.chapeu[0] + 105, Y.chapeu[1] + 60); ctx.rotate(-9 * Math.PI / 180); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6; ctx.drawImage(chapeu, -105, -62, 210, 124); ctx.restore(); }
    xis(ctx, 46, Y.lousa[1] + 20, 40, C.tinta, 8);
    xis(ctx, w - 40, Y.lousa[1] + Y.lousa[3] + 30, 42, C.vermelho, -10);
    if (p) lousa(ctx, ...Y.lousa, p, mascara);
    precos(ctx, ...Y.precos, S.tamanhos.map(t => ({ nome: t.nome, preco: T.preco(S, p, t.id) })), status);
    polaroid(ctx, foto, ...Y.foto, status ? -2 : 3, !!S.demo);
    contato(ctx, ...Y.contato, S);
    if (Y.fita) fita(ctx, ...Y.fita, 'FAÇA JÁ O SEU PEDIDO!', -1.5);
    rodape(ctx, Y.rod[0], w, Y.rod[1], S);
    if (p && p.acabou) { ctx.save(); ctx.translate(w / 2, Y.lousa[1] + Y.lousa[3] / 2); ctx.rotate(-12 * Math.PI / 180); ctx.strokeStyle = C.vermelho; ctx.lineWidth = 10; ctx.fillStyle = 'rgba(246,241,231,.92)'; ctx.beginPath(); ctx.roundRect(-260, -70, 520, 140, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = C.vermelho; ctx.font = `400 96px ${F.titulo}`; ctx.textAlign = 'center'; ctx.fillText('ACABOU HOJE', 0, 34); ctx.restore(); }
    return canvas;
  }

  g.TONOGG_POST = { desenhar, TAM };
})(window);
