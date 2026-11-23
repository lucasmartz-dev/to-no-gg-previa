/* To No GG — página do cliente: cardápio do dia + pedido montado pro WhatsApp. */
(function () {
  const T = window.TONOGG;
  const { esc, brl, brlCurto } = T;
  let S = T.carregar();
  let cart = [];          // {k, tipo:'m'|'e', id, tam?, qtd}
  let enviado = null;     // {cliente, msg, link}
  let pin = null;

  const $ = id => document.getElementById(id);
  const tam = id => S.tamanhos.find(t => t.id === id);
  const prato = id => T.acharPrato(S, id);
  const extra = id => S.extras.find(e => e.id === id);
  const temTaxa = () => S.taxa !== null && S.taxa !== '' && !isNaN(Number(S.taxa));

  function aviso(t) { const el = $('aviso'); el.textContent = t; el.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => el.hidden = true, 1800); }

  /* ---------- cardápio ---------- */
  function renderCardapio() { renderLogo(); renderDia(); renderFixos(); }
  function renderLogo() {
    const n = $('logo-nome'), t = $('logo-tipo');
    if (n) n.textContent = (S.nome || '').toUpperCase();
    if (t) t.textContent = (S.tipo || '').toUpperCase();
  }

  function renderFixos() {
    const fx = T.fixosAtivos(S);
    $('cardapio').hidden = !fx.length;
    $('fixos').innerHTML = fx.map(p => `
      <article class="fixo remendo ${p.acabou ? 'acabou' : ''}" id="prato-${esc(p.id)}">
        <h3 class="fixo-nome">${esc(p.nome)}</h3>
        ${p.desc ? `<p class="fixo-desc">${esc(p.desc)}</p>` : ''}
        ${p.acabou ? `<p class="selo">Acabou hoje</p>` : ''}
        <div class="fixo-tams" role="group" aria-label="Tamanhos de ${esc(p.nome)}">
          ${S.tamanhos.map(t => `
            <button type="button" class="chip-tam" data-act="add" data-prato="${esc(p.id)}" data-tam="${esc(t.id)}" ${p.acabou ? 'disabled' : ''}
              aria-label="Pedir marmita ${esc(t.nome.toLowerCase())} de ${esc(p.nome)}, ${brl(T.preco(S, p, t.id))}">
              <span>${esc(t.nome)}</span><b>${brlCurto(T.preco(S, p, t.id))}</b>
            </button>`).join('')}
        </div>
      </article>`).join('');
  }

  function renderDia() {
    $('data').textContent = T.dataLonga() + (S.pedidosAte ? ' · pedidos até ' + S.pedidosAte : '');
    const pratos = T.pratosDoDia(S);
    $('prato-dia').innerHTML = pratos.length ? pratos.map(p => `
      <article class="prato" id="prato-${esc(p.id)}">
        <div class="lousa">
          <h2 class="nome-prato"><span class="destaque">${esc(p.destaque)}</span>${p.complemento ? `<span class="complemento">${esc(p.complemento)}</span>` : ''}</h2>
          ${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}
        </div>
        <div class="precos" role="group" aria-label="Tamanhos de ${esc(T.nomePrato(p))}">
          ${S.tamanhos.map(t => `
            <button type="button" class="preco" data-act="add" data-prato="${esc(p.id)}" data-tam="${esc(t.id)}" ${p.acabou ? 'disabled' : ''}
              aria-label="Pedir marmita ${esc(t.nome.toLowerCase())} de ${esc(T.nomePrato(p))}, ${brl(T.preco(S, p, t.id))}">
              <span><span class="tam">${esc(t.nome)}:</span><br><span class="val">${brlCurto(T.preco(S, p, t.id))}</span></span>
              <span class="mais" aria-hidden="true">${p.acabou ? 'Acabou' : 'Pedir'}</span>
            </button>`).join('')}
        </div>
        ${p.foto ? `<figure class="foto"><img src="${esc(p.foto)}" alt="Foto do ${esc(T.nomePrato(p))} de hoje" loading="lazy"><figcaption>${esc(T.nomePrato(p))}</figcaption></figure>`
          : S.demo ? `<figure class="foto sem-foto"><div class="foto-vazia">Foto do prato de hoje<small>o dono tira no painel</small></div><figcaption>${esc(T.nomePrato(p))}</figcaption></figure>` : ''}
        ${p.acabou ? `<div class="carimbo" aria-label="Acabou hoje">Acabou hoje</div>` : ''}
      </article>`).join('')
      : `<div class="lousa vazio"><p class="complemento">Já já sai</p><p class="desc">O prato do dia ainda não foi publicado. O cardápio de todo dia está logo abaixo.</p></div>`;
  }

  /* ---------- pedido ---------- */
  function linhas() {
    return cart.map(c => {
      if (c.tipo === 'm') { const p = prato(c.id), t = tam(c.tam); if (!p || !t) return null;
        return { k: c.k, txt: `Marmita ${t.nome.toLowerCase()}`, sub: T.nomePrato(p), qtd: c.qtd, preco: T.preco(S, p, t.id) }; }
      const e = extra(c.id); if (!e) return null;
      return { k: c.k, txt: e.nome, sub: '', qtd: c.qtd, preco: e.preco };
    }).filter(Boolean);
  }
  const subtotal = () => linhas().reduce((s, l) => s + l.qtd * l.preco, 0);
  const qtd = () => cart.reduce((s, c) => s + c.qtd, 0);
  const modo = () => (document.querySelector('input[name="modo"]:checked') || {}).value || 'entrega';
  const pag = () => (document.querySelector('input[name="pag"]:checked') || {}).value || 'Pix';

  function renderPedido() {
    const box = $('form-card');
    if (enviado) {
      box.innerHTML = `
        <p style="margin:0 0 10px;font:600 22px/1.2 var(--f-rotulo)">Pedido montado, ${esc(enviado.cliente)}!</p>
        <p class="dica" style="margin:0 0 12px">${enviado.link ? 'O WhatsApp abriu com a mensagem abaixo. É só tocar em enviar. Se não abriu, use o botão.' : 'É esta a mensagem que chega no WhatsApp do restaurante, já montada. Na demonstração não tem número cadastrado.'}</p>
        <pre class="mensagem" id="msg">${esc(enviado.msg)}</pre>
        <div class="botoes" style="margin-top:14px">
          ${enviado.link ? `<a class="botao wa" href="${esc(enviado.link)}" target="_blank" rel="noopener">Abrir no WhatsApp</a>` : ''}
          <button type="button" class="botao claro pequeno" data-act="novo">Fazer outro pedido</button>
        </div>`;
      atualizarSacola(); return;
    }
    const ls = linhas();
    const ex = S.extras;
    box.innerHTML = `
      ${ls.length ? `<div class="itens">${ls.map(l => `
        <div class="item"><div class="nm">${l.qtd}× ${esc(l.txt)}<small>${esc(l.sub ? l.sub + ' · ' : '')}${brl(l.preco)} cada</small></div>
          <div class="passo"><button type="button" aria-label="Tirar um" data-act="qtd" data-k="${l.k}" data-d="-1">−</button><output>${l.qtd}</output><button type="button" aria-label="Pôr mais um" data-act="qtd" data-k="${l.k}" data-d="1">+</button></div></div>`).join('')}</div>`
        : `<p class="dica" style="margin:0">Toque em <b>Pedir</b> no tamanho que você quer, lá no cardápio.</p>`}
      ${ex.length ? `<hr class="linha"><div class="itens">${ex.map(e => { const c = cart.find(x => x.tipo === 'e' && x.id === e.id); return `
        <div class="item"><div class="nm">${esc(e.nome)}<small>${brl(e.preco)}</small></div>
          <div class="passo"><button type="button" aria-label="Tirar ${esc(e.nome)}" data-act="extra" data-id="${esc(e.id)}" data-d="-1">−</button><output>${c ? c.qtd : 0}</output><button type="button" aria-label="Pôr ${esc(e.nome)}" data-act="extra" data-id="${esc(e.id)}" data-d="1">+</button></div></div>`; }).join('')}</div>` : ''}
      <hr class="linha">
      <form class="campos" id="f-pedido" novalidate>
        <fieldset class="escolha">
          <legend>Como você quer receber?</legend>
          <label><input type="radio" name="modo" id="modo-entrega" value="entrega" checked> Entrega${temTaxa() ? ' (' + brl(S.taxa) + ')' : ''}</label>
          ${S.retirada ? `<label><input type="radio" name="modo" id="modo-retirada" value="retirada"> Retiro no balcão</label>` : ''}
        </fieldset>
        <label for="c-nome">Seu nome<input type="text" id="c-nome" autocomplete="name" placeholder="Ex.: Ana"></label>
        <div id="bloco-end" class="campos" style="gap:14px;display:flex;flex-direction:column">
          <label for="c-end">Endereço<input type="text" id="c-end" autocomplete="street-address" placeholder="Rua e número, ou o nome da chácara"></label>
          <label for="c-ref">Ponto de referência<input type="text" id="c-ref" placeholder="Ex.: portão azul, depois da igreja">
            <span class="dica">A numeração aqui é confusa. Com a referência, a marmita chega quente.</span></label>
          <div class="botoes"><button type="button" class="botao claro pequeno" data-act="pin" id="btn-pin">${pin ? 'Localização incluída ✓' : 'Mandar minha localização'}</button></div>
          <p class="dica" id="pin-msg" hidden></p>
        </div>
        <fieldset class="escolha">
          <legend>Pagamento</legend>
          <label><input type="radio" name="pag" id="pag-pix" value="Pix" checked> Pix</label>
          <label><input type="radio" name="pag" id="pag-din" value="Dinheiro"> Dinheiro</label>
          <label><input type="radio" name="pag" id="pag-cartao" value="Cartão na entrega"> Cartão</label>
        </fieldset>
        <label for="c-troco" id="bloco-troco" hidden>Troco pra quanto?<input type="number" id="c-troco" inputmode="numeric" min="0" placeholder="Ex.: 50"></label>
        <label for="c-obs">Alguma observação?<textarea id="c-obs" placeholder="Ex.: sem cebola, capricha no feijão"></textarea></label>
        <div class="totais" id="totais"></div>
        <p class="erro" id="f-erro" hidden></p>
        <button class="botao wa" type="submit">Enviar pedido no WhatsApp</button>
      </form>`;
    atualizarSacola();
  }

  function atualizarTotais() {
    const el = $('totais'); if (!el) return;
    const entrega = modo() === 'entrega';
    const taxa = entrega && temTaxa() ? Number(S.taxa) : 0;
    el.innerHTML = `
      <div class="item"><span>Marmitas e extras</span><span>${brl(subtotal())}</span></div>
      <div class="item"><span>Entrega</span><span>${!entrega ? 'retira no balcão' : temTaxa() ? brl(taxa) : 'a combinar'}</span></div>
      <div class="item total"><span>Total</span><span>${brl(subtotal() + taxa)}</span></div>`;
    const be = $('bloco-end'); if (be) be.hidden = !entrega;
    const bt = $('bloco-troco'); if (bt) bt.hidden = pag() !== 'Dinheiro';
  }
  function atualizarSacola() {
    const n = qtd();
    $('sacola').hidden = !n || !!enviado;
    if (n) $('sacola-btn').innerHTML = `<span>Ver meu pedido · ${n} ${n > 1 ? 'itens' : 'item'}</span><span>${brl(subtotal())}</span>`;
    atualizarTotais();
  }
  function rerender() {
    const guarda = {}; ['c-nome', 'c-end', 'c-ref', 'c-troco', 'c-obs'].forEach(id => { const el = $(id); if (el) guarda[id] = el.value; });
    const m = modo(), p = pag();
    renderPedido();
    Object.entries(guarda).forEach(([id, v]) => { const el = $(id); if (el) el.value = v; });
    const rm = document.querySelector(`input[name="modo"][value="${m}"]`); if (rm) rm.checked = true;
    const rp = document.querySelector(`input[name="pag"][value="${p}"]`); if (rp) rp.checked = true;
    atualizarTotais();
  }

  function mensagem(o) {
    const L = [`*Pedido · ${S.nome}*`, ''];
    o.itens.forEach(i => L.push(`${i.qtd}x ${i.txt}${i.sub ? ' · ' + i.sub : ''} (${brl(i.qtd * i.preco)})`));
    L.push('');
    if (o.modo === 'entrega') {
      L.push(`*Entregar em:* ${o.endereco}`);
      if (o.ref) L.push(`*Referência:* ${o.ref}`);
      if (o.pin) L.push(`📍 ${o.pin}`);
      if (!temTaxa()) L.push('*Taxa de entrega:* a combinar');
    } else L.push('*Vou retirar no balcão*');
    L.push(`*Pagamento:* ${o.pag}${o.pag === 'Dinheiro' && o.troco ? ', troco pra ' + brl(o.troco) : ''}`);
    if (o.obs) L.push(`*Obs.:* ${o.obs}`);
    L.push(`*Total:* ${brl(o.total)}${o.taxa ? ` (com entrega de ${brl(o.taxa)})` : ''}`);
    L.push(`Nome: ${o.cliente}`);
    return L.join('\n');
  }

  function enviar(ev) {
    ev.preventDefault();
    const err = $('f-erro'); err.hidden = true;
    const nome = $('c-nome').value.trim(), m = modo();
    const endereco = ($('c-end') || {}).value ? $('c-end').value.trim() : '';
    const ref = ($('c-ref') || {}).value ? $('c-ref').value.trim() : '';
    const falta = !cart.length ? 'Escolha pelo menos uma marmita no cardápio.' : !nome ? 'Escreva seu nome.' : (m === 'entrega' && !endereco) ? 'Escreva o endereço da entrega.' : '';
    if (falta) { err.textContent = falta; err.hidden = false; return; }
    const its = linhas();
    const taxa = m === 'entrega' && temTaxa() ? Number(S.taxa) : 0;
    const o = { cliente: nome, modo: m, endereco, ref, pin: pin ? `https://maps.google.com/?q=${pin.lat},${pin.lng}` : '',
      pag: pag(), troco: ($('c-troco') || {}).value || '', obs: $('c-obs').value.trim(), itens: its, taxa,
      total: its.reduce((s, l) => s + l.qtd * l.preco, 0) + taxa };
    const msg = mensagem(o);
    const temZap = T.zap(S).length >= 10;
    const link = temZap ? 'https://wa.me/55' + T.zap(S) + '?text=' + encodeURIComponent(msg) : '';
    enviado = { cliente: nome, msg, link };
    cart = []; pin = null;
    if (temZap) { const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
    renderPedido();
    $('pedido').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- contato ---------- */
  function renderContato() {
    const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${S.endereco}, ${S.bairro}`);
    const zapLink = 'https://wa.me/55' + T.zap(S) + '?text=' + encodeURIComponent(`Oi! Vi o cardápio de hoje no site do ${S.nome}.`);
    $('painel-contato').innerHTML = `
      <div class="tel">
        <span class="circ" aria-hidden="true"><svg viewBox="0 0 24 24" fill="#fff"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg></span>
        <div><span>Pedidos pelo WhatsApp</span><b>${T.zap(S).length >= 10 ? esc(T.zapBonito(S)) : '(00) 0 0000-0000'}</b></div>
      </div>
      ${T.zap(S).length >= 10 ? `<a class="botao wa" href="${esc(zapLink)}" target="_blank" rel="noopener">Chamar no WhatsApp</a>` : `<p class="dica" style="color:var(--creme-2);margin:0">O número do restaurante entra no painel do dono.</p>`}
      <dl>
        <div><dt>Onde fica</dt><dd>${esc(S.endereco)}, ${esc(S.bairro)}<br>${esc(S.referencia)}<br><a href="${esc(mapa)}" target="_blank" rel="noopener">Ver no mapa</a></dd></div>
        ${S.horario ? `<div><dt>Horário</dt><dd>${esc(S.horario)}</dd></div>` : ''}
        <div><dt>Entrega</dt><dd>${temTaxa() ? 'Taxa de ' + esc(brl(S.taxa)) : 'Taxa combinada pelo WhatsApp'}${S.retirada ? '. Ou retire no balcão.' : '.'}</dd></div>
      </dl>`;
    $('rod-end').textContent = S.endereco;
    $('rod-ref').textContent = S.referencia;
  }

  /* ---------- eventos ---------- */
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'add') {
      const k = 'm-' + b.dataset.prato + '-' + b.dataset.tam; const c = cart.find(x => x.k === k);
      if (c) c.qtd++; else cart.push({ k, tipo: 'm', id: b.dataset.prato, tam: b.dataset.tam, qtd: 1 });
      enviado = null; aviso(`Marmita ${tam(b.dataset.tam).nome.toLowerCase()} de ${T.nomePrato(prato(b.dataset.prato)).toLowerCase()} no pedido`); rerender();
    }
    if (a === 'extra') {
      const id = b.dataset.id, d = +b.dataset.d, k = 'e-' + id; let c = cart.find(x => x.k === k);
      if (!c && d > 0) { c = { k, tipo: 'e', id, qtd: 0 }; cart.push(c); }
      if (c) { c.qtd += d; if (c.qtd <= 0) cart = cart.filter(x => x !== c); }
      rerender();
    }
    if (a === 'qtd') { const c = cart.find(x => x.k === b.dataset.k); if (c) { c.qtd += +b.dataset.d; if (c.qtd <= 0) cart = cart.filter(x => x !== c); } rerender(); }
    if (a === 'ir-pedido') $('pedido').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (a === 'novo') { enviado = null; renderPedido(); }
    if (a === 'pin') {
      const msg = $('pin-msg');
      const falhou = () => { msg.textContent = 'Não deu pra pegar a localização. Escreva a referência que a gente acha.'; msg.hidden = false; };
      if (!navigator.geolocation || !window.isSecureContext) return falhou();
      b.textContent = 'Pegando a localização…';
      navigator.geolocation.getCurrentPosition(p => {
        pin = { lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) };
        b.textContent = 'Localização incluída ✓'; msg.hidden = true;
      }, () => { b.textContent = 'Mandar minha localização'; falhou(); }, { timeout: 8000, enableHighAccuracy: true });
    }
  });
  document.addEventListener('change', ev => { if (ev.target.name === 'modo' || ev.target.name === 'pag') atualizarTotais(); });
  document.addEventListener('submit', ev => { if (ev.target.id === 'f-pedido') enviar(ev); });
  // se o dono mudar o cardápio em outra aba, a página acompanha
  window.addEventListener('storage', ev => { if (ev.key === T.CHAVE) { S = T.carregar(); renderCardapio(); renderContato(); rerender(); } });

  renderCardapio(); renderPedido(); renderContato();
})();
