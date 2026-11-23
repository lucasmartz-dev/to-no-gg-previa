/* To No GG — painel do dono: muda o cardápio do dia e gera o post pronto. */
(function () {
  const T = window.TONOGG, P = window.TONOGG_POST;
  const { esc } = T;
  let S = T.carregar();
  let formato = 'status';
  let confirmaReset = false;
  const $ = id => document.getElementById(id);
  const uid = () => 'p' + Math.random().toString(36).slice(2, 8);

  function aviso(t) { const el = $('aviso'); el.textContent = t; el.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => el.hidden = true, 2000); }
  function logoTopo() {
    const n = $('logo-nome'), t = $('logo-tipo');
    if (n) n.textContent = (S.nome || '').toUpperCase();
    if (t) t.textContent = (S.tipo || '').toUpperCase();
  }
  function guardar() {
    logoTopo();
    const ok = T.salvar(S);
    $('salvo').textContent = ok ? 'Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Não deu pra salvar: a foto ficou grande demais. Tente outra.';
    redesenhar();
  }

  // os três preços (pequena, média, grande) de um prato
  function camposPreco(p, lista) {
    return `<fieldset class="precos-prato"><legend>Preço de cada tamanho</legend><div class="tres">
      ${S.tamanhos.map(t => `<label for="pr-${p.id}-${t.id}">${esc(t.nome)}<span class="reais"><span aria-hidden="true">R$</span><input type="number" id="pr-${p.id}-${t.id}" inputmode="decimal" min="0" step="0.5" value="${T.preco(S, p, t.id)}" data-ed="preco" data-lista="${lista}" data-id="${p.id}" data-tam="${t.id}" aria-label="Preço da ${esc(t.nome.toLowerCase())} de ${esc(T.nomePrato(p))}"></span></label>`).join('')}
    </div></fieldset>`;
  }
  // prato novo começa com os preços do primeiro prato da mesma lista
  function precosIniciais(lista) {
    const ref = (S[lista] || [])[0];
    return Object.fromEntries(S.tamanhos.map(t => [t.id, T.preco(S, ref, t.id)]));
  }

  function render() {
    $('data').textContent = T.dataLonga();
    logoTopo();
    $('painel').innerHTML = `
      <section class="remendo bloco" aria-labelledby="h-pratos">
        <h2 id="h-pratos">Prato do dia</h2>
        <p class="dica">Vai no banner do topo do site e no post. A palavra em vermelho é a que aparece em pincel. Marque "Acabou" quando acabar: o site para de aceitar pedido desse prato.</p>
        ${S.pratos.map(p => `
          <div class="edit-prato campos">
            <div class="lado">
              <label for="d-${p.id}">Em vermelho<input type="text" id="d-${p.id}" value="${esc(p.destaque)}" data-ed="prato" data-id="${p.id}" data-f="destaque" placeholder="Baião"></label>
              <label for="c-${p.id}">Em branco<input type="text" id="c-${p.id}" value="${esc(p.complemento)}" data-ed="prato" data-id="${p.id}" data-f="complemento" placeholder="de dois"></label>
            </div>
            <label for="s-${p.id}">O que vem na marmita<input type="text" id="s-${p.id}" value="${esc(p.desc)}" data-ed="prato" data-id="${p.id}" data-f="desc"></label>
            ${camposPreco(p, 'pratos')}
            <div class="foto-edit">
              ${p.foto ? `<img src="${esc(p.foto)}" alt="Foto atual do prato">` : ''}
              <label for="f-${p.id}" class="botao claro pequeno" style="cursor:pointer">${p.foto ? 'Trocar a foto' : 'Pôr foto do prato'}
                <input type="file" id="f-${p.id}" accept="image/*" capture="environment" data-foto="${p.id}" style="position:absolute;width:1px;height:1px;opacity:0"></label>
              ${p.foto ? `<button type="button" class="botao contorno pequeno" data-act="sem-foto" data-id="${p.id}">Tirar a foto</button>` : ''}
            </div>
            <div class="checks">
              <label for="a-${p.id}"><input type="checkbox" id="a-${p.id}" ${p.ativo ? 'checked' : ''} data-ed="prato" data-id="${p.id}" data-f="ativo"> No cardápio hoje</label>
              <label for="k-${p.id}"><input type="checkbox" id="k-${p.id}" ${p.acabou ? 'checked' : ''} data-ed="prato" data-id="${p.id}" data-f="acabou"> Acabou</label>
              <button type="button" class="botao contorno pequeno" data-act="del-prato" data-id="${p.id}">Apagar prato</button>
            </div>
          </div>`).join('')}
        <div class="botoes" style="margin-top:14px"><button type="button" class="botao claro" data-act="add-prato">Pôr mais um prato do dia</button></div>
      </section>

      <section class="remendo bloco" aria-labelledby="h-fixos">
        <h2 id="h-fixos">Cardápio de todo dia</h2>
        <p class="dica">Os pratos que saem todo dia. Aparecem no site embaixo do banner, cada um com o seu preço.</p>
        ${(S.fixos || []).map(p => `
          <div class="edit-prato campos">
            <label for="fn-${p.id}">Prato<input type="text" id="fn-${p.id}" value="${esc(p.nome)}" data-ed="fixo" data-id="${p.id}" data-f="nome"></label>
            <label for="fd-${p.id}">O que acompanha<input type="text" id="fd-${p.id}" value="${esc(p.desc)}" data-ed="fixo" data-id="${p.id}" data-f="desc"></label>
            ${camposPreco(p, 'fixos')}
            <div class="checks">
              <label for="fa-${p.id}"><input type="checkbox" id="fa-${p.id}" ${p.ativo ? 'checked' : ''} data-ed="fixo" data-id="${p.id}" data-f="ativo"> No cardápio</label>
              <label for="fk-${p.id}"><input type="checkbox" id="fk-${p.id}" ${p.acabou ? 'checked' : ''} data-ed="fixo" data-id="${p.id}" data-f="acabou"> Acabou hoje</label>
              <button type="button" class="botao contorno pequeno" data-act="del-fixo" data-id="${p.id}">Apagar</button>
            </div>
          </div>`).join('')}
        <div class="botoes" style="margin-top:14px"><button type="button" class="botao claro" data-act="add-fixo">Pôr prato no cardápio</button></div>
      </section>

      <section class="remendo bloco" aria-labelledby="h-post">
        <h2 id="h-post">Post do dia</h2>
        <p class="dica">Sai pronto com o prato e os preços de hoje. Status serve pro WhatsApp e pros Stories; Feed é o post do Instagram.</p>
        <div class="formatos" role="group" aria-label="Formato do post">
          <button type="button" data-act="formato" data-f="status" aria-pressed="${formato === 'status'}">Status</button>
          <button type="button" data-act="formato" data-f="feed" aria-pressed="${formato === 'feed'}">Feed</button>
        </div>
        <div class="tela-post"><canvas id="post" width="1080" height="1920" hidden></canvas><img id="post-img" alt="Post do dia pronto, com o prato e os preços de hoje"></div>
        <div class="botoes" style="margin-top:14px">
          <button type="button" class="botao wa" data-act="baixar" style="width:auto">Baixar imagem</button>
          <button type="button" class="botao claro" data-act="compartilhar" id="btn-comp" hidden>Compartilhar</button>
        </div>
        <p class="dica" style="margin:10px 0 0">No celular, também dá pra tocar e segurar na imagem e escolher "Salvar".</p>
        <label for="txt-status" class="campos" style="display:flex;flex-direction:column;gap:6px;margin-top:16px;font:600 14px/1.2 var(--f-rotulo)">Texto pra mandar junto
          <textarea id="txt-status" readonly rows="7" style="width:100%;background:#FFFCF5;border:2px solid #CDB993;border-radius:8px;padding:12px;font:14px/1.45 var(--f-texto)">${esc(T.textoStatus(S))}</textarea></label>
        <div class="botoes" style="margin-top:10px"><button type="button" class="botao claro pequeno" data-act="copiar">Copiar texto</button></div>
      </section>

      <section class="remendo bloco campos" aria-labelledby="h-precos">
        <h2 id="h-precos">Bebidas e extras</h2>
        <p class="dica" style="margin:0 0 6px">Opcional. Aparecem no pedido, embaixo das marmitas.</p>
        ${S.extras.map(e => `<div class="linha-extra">
          <label for="en-${e.id}">Item<input type="text" id="en-${e.id}" value="${esc(e.nome)}" data-ed="extra" data-id="${e.id}" data-f="nome"></label>
          <label for="ep-${e.id}">Preço<input type="number" id="ep-${e.id}" inputmode="decimal" min="0" step="0.5" value="${e.preco}" data-ed="extra" data-id="${e.id}" data-f="preco"></label>
          <button type="button" class="botao contorno pequeno" data-act="del-extra" data-id="${e.id}" aria-label="Apagar ${esc(e.nome)}">Apagar</button></div>`).join('')}
        <div class="botoes"><button type="button" class="botao claro pequeno" data-act="add-extra">Pôr bebida ou extra</button></div>
      </section>

      <section class="remendo bloco campos" aria-labelledby="h-atend">
        <h2 id="h-atend">Atendimento</h2>
        <div class="lado">
          <label for="cfg-nome">Nome do restaurante<input type="text" id="cfg-nome" value="${esc(S.nome)}" data-ed="cfg" data-f="nome"></label>
          <label for="cfg-tipo">Embaixo do nome<input type="text" id="cfg-tipo" value="${esc(S.tipo)}" data-ed="cfg" data-f="tipo" placeholder="Restaurante"></label>
        </div>
        <label for="cfg-zap">WhatsApp que recebe os pedidos<input type="tel" id="cfg-zap" inputmode="tel" value="${esc(T.zapBonito(S))}" data-ed="cfg" data-f="whatsapp" placeholder="(11) 9 0000-0000">
          <span class="dica">Um número só, em todo lugar. Teste de outro celular antes de divulgar.</span></label>
        <div class="lado">
          <label for="cfg-hor">Horário<input type="text" id="cfg-hor" value="${esc(S.horario)}" data-ed="cfg" data-f="horario" placeholder="Seg a sáb, 11h às 14h"></label>
          <label for="cfg-ate">Pedidos até<input type="time" id="cfg-ate" value="${esc(S.pedidosAte)}" data-ed="cfg" data-f="pedidosAte"></label>
        </div>
        <div class="lado">
          <label for="cfg-taxa">Taxa de entrega (R$)<input type="number" id="cfg-taxa" inputmode="decimal" min="0" step="0.5" value="${S.taxa ?? ''}" data-ed="cfg" data-f="taxa" placeholder="Em branco = combinar"></label>
          <label for="cfg-link">Link do site (vai no post)<input type="text" id="cfg-link" value="${esc(S.link)}" data-ed="cfg" data-f="link" placeholder="quando estiver no ar"></label>
        </div>
        <div class="checks"><label for="cfg-ret"><input type="checkbox" id="cfg-ret" ${S.retirada ? 'checked' : ''} data-ed="cfg" data-f="retirada"> Aceita retirada no balcão</label></div>
        <label for="cfg-end">Endereço<input type="text" id="cfg-end" value="${esc(S.endereco)}" data-ed="cfg" data-f="endereco"></label>
        <label for="cfg-ref">Como achar<input type="text" id="cfg-ref" value="${esc(S.referencia)}" data-ed="cfg" data-f="referencia"></label>
      </section>

      <div class="botoes"><button type="button" class="botao perigo pequeno" data-act="reset">${confirmaReset ? 'Toque de novo pra voltar ao cardápio de exemplo' : 'Voltar ao cardápio de exemplo'}</button></div>`;
    const comp = $('btn-comp'); if (comp) comp.hidden = !(navigator.canShare && window.isSecureContext);
    redesenhar(true);
  }

  let tempo;
  function redesenhar(agora) {
    clearTimeout(tempo);
    const ir = async () => {
      const c = $('post');
      if (c) {
        await P.desenhar(c, S, formato);
        try {
          c.toBlob(b => {
            const im = $('post-img'); if (!im || !b) return;
            if (im.dataset.url) URL.revokeObjectURL(im.dataset.url);
            im.dataset.url = URL.createObjectURL(b); im.src = im.dataset.url;
          }, 'image/png');
        } catch (e) { c.hidden = false; } // se o navegador não deixar exportar, mostra o desenho direto
      }
      const t = $('txt-status'); if (t) t.value = T.textoStatus(S);
    };
    agora ? ir() : (tempo = setTimeout(ir, 300));
  }
  function nomeArquivo() { const n = new Date(); return `tonogg-cardapio-${n.getFullYear()}-${T.pad(n.getMonth() + 1)}-${T.pad(n.getDate())}-${formato}.png`; }
  function blob() { return new Promise(ok => $('post').toBlob(ok, 'image/png')); }

  async function fotoReduzida(file) {
    const url = URL.createObjectURL(file);
    const im = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = url; });
    const max = 1080, r = Math.min(1, max / Math.max(im.width, im.height));
    const c = document.createElement('canvas'); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    return c.toDataURL('image/jpeg', .82);
  }

  document.addEventListener('input', ev => {
    const el = ev.target, ed = el.dataset.ed; if (!ed) return;
    if (ed === 'prato') { const p = S.pratos.find(x => x.id === el.dataset.id); if (p) p[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; }
    if (ed === 'fixo') { const p = (S.fixos || []).find(x => x.id === el.dataset.id); if (p) p[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; }
    if (ed === 'preco') {
      const p = (S[el.dataset.lista] || []).find(x => x.id === el.dataset.id);
      if (p) { p.precos = p.precos || {}; p.precos[el.dataset.tam] = el.value === '' ? '' : (Number(el.value) || 0); }
    }
    if (ed === 'extra') { const e = S.extras.find(x => x.id === el.dataset.id); if (e) e[el.dataset.f] = el.dataset.f === 'preco' ? (Number(el.value) || 0) : el.value; }
    if (ed === 'cfg') {
      const f = el.dataset.f;
      if (f === 'retirada') S.retirada = el.checked;
      else if (f === 'taxa') S.taxa = el.value === '' ? null : Number(el.value);
      else if (f === 'whatsapp') S.whatsapp = el.value.replace(/\D/g, '');
      else S[f] = el.value;
    }
    guardar();
  });
  document.addEventListener('change', async ev => {
    const id = ev.target.dataset && ev.target.dataset.foto; if (!id || !ev.target.files[0]) return;
    try { const p = S.pratos.find(x => x.id === id); p.foto = await fotoReduzida(ev.target.files[0]); guardar(); render(); aviso('Foto trocada'); }
    catch (e) { aviso('Não deu pra abrir essa foto. Tente outra.'); }
  });
  document.addEventListener('click', async ev => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a !== 'reset') confirmaReset = false;
    if (a === 'add-prato') { S.pratos.push({ id: uid(), destaque: 'Prato', complemento: 'do dia', desc: '', foto: '', ativo: true, acabou: false, precos: precosIniciais('pratos') }); guardar(); render(); }
    if (a === 'del-prato') { S.pratos = S.pratos.filter(p => p.id !== b.dataset.id); guardar(); render(); }
    if (a === 'add-fixo') { S.fixos = S.fixos || []; S.fixos.push({ id: uid(), nome: 'Prato novo', desc: 'Arroz, feijão e salada', ativo: true, acabou: false, precos: precosIniciais('fixos') }); guardar(); render(); }
    if (a === 'del-fixo') { S.fixos = (S.fixos || []).filter(p => p.id !== b.dataset.id); guardar(); render(); }
    if (a === 'sem-foto') { const p = S.pratos.find(x => x.id === b.dataset.id); if (p) p.foto = ''; guardar(); render(); }
    if (a === 'add-extra') { S.extras.push({ id: uid(), nome: 'Refrigerante lata', preco: 0 }); guardar(); render(); }
    if (a === 'del-extra') { S.extras = S.extras.filter(e => e.id !== b.dataset.id); guardar(); render(); }
    if (a === 'formato') { formato = b.dataset.f; document.querySelectorAll('[data-act="formato"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.f === formato)); redesenhar(true); }
    if (a === 'baixar') { await P.desenhar($('post'), S, formato); const bl = await blob(); const u = URL.createObjectURL(bl); const l = document.createElement('a'); l.href = u; l.download = nomeArquivo(); document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); aviso('Imagem baixada'); }
    if (a === 'compartilhar') { const bl = await blob(); const f = new File([bl], nomeArquivo(), { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: T.textoStatus(S) }); } catch (e) {} } }
    if (a === 'copiar') { const t = T.textoStatus(S); try { await navigator.clipboard.writeText(t); aviso('Texto copiado'); } catch (e) { const ta = $('txt-status'); ta.focus(); ta.select(); aviso('Texto selecionado: é só copiar'); } }
    if (a === 'reset') { if (!confirmaReset) { confirmaReset = true; render(); return; } confirmaReset = false; S = T.restaurar(); render(); aviso('Voltou ao cardápio de exemplo'); }
  });

  render();
})();
