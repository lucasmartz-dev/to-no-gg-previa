/* To No GG — dados do cardápio e utilidades comuns ao site e ao painel do dono.
   Nesta versão local, o que o dono muda fica guardado no navegador (localStorage).
   Na versão publicada, o mesmo objeto passa a morar no Supabase. */
(function (g) {
  // Uma versão pode trazer os próprios dados (js/padrao.js define window.CARDAPIO_PADRAO), como a demonstração
  // sem marca. Sem isso, valem os dados de reserva abaixo (os do To No GG).
  const CHAVE = (g.CARDAPIO_PADRAO && g.CARDAPIO_PADRAO.chave) || 'tonogg-cardapio-v1';

  // Só o que está confirmado pelo post do restaurante. O resto fica vazio até o dono preencher.
  const PADRAO = g.CARDAPIO_PADRAO || {
    nome: 'To No GG',
    tipo: 'Restaurante',
    whatsapp: '11976430686', // [CONFIRMAR] o post traz 3 números; este é o primeiro
    endereco: 'Rua Minas Gerais, 48',
    referencia: "Nos prédios amarelos, perto do Mercado Marily's",
    bairro: 'Chácara Guanabara, Mogi das Cruzes',
    horario: '',      // ex.: "Seg a sáb, das 11h às 14h"
    pedidosAte: '',   // ex.: "10:30"
    taxa: null,       // null = combinar pelo WhatsApp
    retirada: true,
    link: '',         // link do cardápio pra aparecer no post (quando o site estiver no ar)
    tamanhos: [
      { id: 'P', nome: 'Pequena', preco: 30 },
      { id: 'M', nome: 'Média', preco: 35 },
      { id: 'G', nome: 'Grande', preco: 40 }
    ],
    // prato do dia: o que muda todo dia e vira o banner e o post
    pratos: [
      { id: 'baiao', destaque: 'Baião', complemento: 'de dois',
        desc: 'Arroz, feijão, calabresa, queijo e cheiro-verde',
        foto: 'img/prato-baiao.jpg', ativo: true, acabou: false, precos: { P: 30, M: 35, G: 40 } }
    ],
    // cardápio principal: tem todo dia. Acompanhamentos e preços [CONFIRMAR] com o dono
    fixos: [
      { id: 'bife', nome: 'Bife acebolado', desc: 'Arroz, feijão, batata frita e salada', ativo: true, acabou: false, precos: { P: 30, M: 35, G: 40 } },
      { id: 'frango', nome: 'Frango', desc: 'Arroz, feijão, farofa e salada', ativo: true, acabou: false, precos: { P: 30, M: 35, G: 40 } },
      { id: 'bisteca', nome: 'Bisteca', desc: 'Arroz, feijão, mandioca e salada', ativo: true, acabou: false, precos: { P: 30, M: 35, G: 40 } },
      { id: 'linguica', nome: 'Linguiça toscana', desc: 'Arroz, feijão, vinagrete e farofa', ativo: true, acabou: false, precos: { P: 30, M: 35, G: 40 } }
    ],
    extras: []
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  function carregar() {
    try {
      const s = JSON.parse(localStorage.getItem(CHAVE));
      if (s && Array.isArray(s.pratos)) return Object.assign(clone(PADRAO), s);
    } catch (e) {}
    return clone(PADRAO);
  }
  function salvar(S) {
    try { localStorage.setItem(CHAVE, JSON.stringify(S)); return true; }
    catch (e) { return false; } // foto grande demais pro navegador
  }
  function restaurar() { try { localStorage.removeItem(CHAVE); } catch (e) {} return clone(PADRAO); }

  const pad = n => String(n).padStart(2, '0');
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  g.TONOGG = {
    CHAVE, PADRAO, carregar, salvar, restaurar,
    brl: v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    brlCurto: v => 'R$' + (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    pad,
    zap: S => (S.whatsapp || '').replace(/\D/g, ''),
    zapBonito: S => {
      const d = (S.whatsapp || '').replace(/\D/g, '');
      if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
      if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return S.whatsapp || '';
    },
    dataCurta: () => { const n = new Date(); return DIAS[n.getDay()] + ', ' + pad(n.getDate()) + '/' + pad(n.getMonth() + 1); },
    dataLonga: () => { const n = new Date(); const d = DIAS[n.getDay()]; return d.charAt(0).toUpperCase() + d.slice(1) + ', ' + n.getDate() + ' de ' + MESES[n.getMonth()]; },
    pratosDoDia: S => S.pratos.filter(p => p.ativo),
    fixosAtivos: S => (S.fixos || []).filter(p => p.ativo),
    acharPrato: (S, id) => S.pratos.find(p => p.id === id) || (S.fixos || []).find(p => p.id === id),
    nomePrato: p => p.nome || [p.destaque, p.complemento].filter(Boolean).join(' '),
    // preço do prato naquele tamanho; prato sem preço próprio usa o do tamanho
    preco: (S, p, tamId) => {
      const v = p && p.precos ? p.precos[tamId] : undefined;
      if (v !== undefined && v !== null && v !== '' && !isNaN(Number(v))) return Number(v);
      const t = S.tamanhos.find(x => x.id === tamId); return t ? Number(t.preco) || 0 : 0;
    },
    precosTexto: (S, p) => S.tamanhos.map(t => `${t.id} ${g.TONOGG.brl(g.TONOGG.preco(S, p, t.id))}`).join(' · '),
    textoStatus: S => {
      const T = g.TONOGG;
      const L = [`*${S.nome} · Cardápio do dia (${T.dataCurta()})*`, ''];
      S.pratos.filter(p => p.ativo && !p.acabou).forEach(p => {
        L.push(`*Prato do dia: ${T.nomePrato(p)}*${p.desc ? ' (' + p.desc.toLowerCase() + ')' : ''}`);
        L.push(T.precosTexto(S, p));
      });
      const fx = (S.fixos || []).filter(p => p.ativo && !p.acabou);
      if (fx.length) { L.push(''); L.push('*Todo dia tem:*'); fx.forEach(p => L.push(`${p.nome}: ${T.precosTexto(S, p)}`)); }
      L.push('');
      if (S.pedidosAte) L.push(`Pedidos até ${S.pedidosAte}`);
      L.push(`Peça pelo WhatsApp: ${g.TONOGG.zapBonito(S) || "(número do restaurante)"}`);
      if (S.link) L.push(S.link);
      return L.join('\n');
    }
  };
})(window);
