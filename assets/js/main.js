(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) closeDropdowns();
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        closeDropdowns();
      });
    });
  }

  function closeDropdowns(except) {
    document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
      if (d !== except) {
        d.classList.remove('open');
        var b = d.querySelector('.nav-dropbtn');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  }
  document.querySelectorAll('.nav-dropbtn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var dd = btn.closest('.nav-dropdown');
      var open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      closeDropdowns(open ? dd : null);
    });
  });
  document.addEventListener('click', function () { closeDropdowns(); });

  var items = document.querySelectorAll('.reveal');
  function revealNow(el) { el.classList.add('is-visible'); }
  if (!('IntersectionObserver' in window)) {
    items.forEach(revealNow);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revealNow(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.14 });
    items.forEach(function (el) { io.observe(el); });
  }

  var form = document.getElementById('gestion-form');
  if (!form) return;

  var STORAGE = 'kikyo-uhai-gestion-v1';
  var activeTab = 'commandes';
  var state = loadState();

  var els = {
    tabs: document.querySelectorAll('.tab[data-tab]'),
    search: document.getElementById('search-input'),
    filter: document.getElementById('filter-status'),
    btnNew: document.getElementById('btn-new'),
    btnCancel: document.getElementById('btn-cancel'),
    btnPrint: document.getElementById('btn-print'),
    head: document.getElementById('table-head'),
    body: document.getElementById('table-body'),
    empty: document.getElementById('empty-state'),
    hint: document.getElementById('form-hint'),
    toast: null,
    printArea: document.getElementById('print-area'),
    id: document.getElementById('record-id'),
    type: document.getElementById('record-type'),
    docNo: document.getElementById('doc-no'),
    client: document.getElementById('client'),
    telephone: document.getElementById('telephone'),
    produit: document.getElementById('produit'),
    quantite: document.getElementById('quantite'),
    prix: document.getElementById('prix'),
    montant: document.getElementById('montant'),
    date: document.getElementById('date'),
    echeance: document.getElementById('echeance'),
    statut: document.getElementById('statut'),
    adresse: document.getElementById('adresse'),
    livreur: document.getElementById('livreur'),
    notes: document.getElementById('notes'),
    fieldPrix: document.getElementById('field-prix'),
    fieldTotal: document.getElementById('field-total'),
    fieldEcheance: document.getElementById('field-echeance'),
    sCmd: document.getElementById('stat-commandes'),
    sLiv: document.getElementById('stat-livraisons'),
    sFac: document.getElementById('stat-factures'),
    sTrash: document.getElementById('stat-corbeille')
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) return parsed;
      }
    } catch (e) {}
    var today = new Date().toISOString().slice(0, 10);
    return {
      seq: 3,
      items: [
        { id: 1, kind: 'commande', docNo: 'BC-DEMO-0001', client: 'Pharmacie Lumière', telephone: '', produit: 'Eau potable 20L', quantite: 12, prix: 1, date: today, echeance: '', statut: 'Confirmée', adresse: 'Butembo, centre-ville', livreur: '', notes: 'Livraison matin', deleted: false },
        { id: 2, kind: 'livraison', docNo: 'BL-DEMO-0001', client: 'Hôtel Horizon', telephone: '', produit: 'Eau potable 1.5L (pack)', quantite: 8, prix: 2, date: today, echeance: '', statut: 'En livraison', adresse: 'Butembo, avenue principale', livreur: 'Equipe A', notes: '', deleted: false }
      ]
    };
  }
  function saveState() { try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (e) {} }
  function uid() { state.seq = (state.seq || 0) + 1; return state.seq; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function money(v) { var n = Number(v); return isFinite(n) ? n.toFixed(2) : '0.00'; }
  function totalOf(it) { return (Number(it.quantite) || 0) * (Number(it.prix) || 0); }
  function kindLabel(kind) { return kind === 'livraison' ? 'Bon de livraison' : kind === 'facture' ? 'Facture' : 'Bon de commande'; }
  function kindPrefix(kind) { return kind === 'livraison' ? 'BL' : kind === 'facture' ? 'FA' : 'BC'; }
  function nextDocNo(kind) {
    var n = state.items.filter(function (i) { return i.kind === kind && i.docNo; }).length + 1;
    var d = new Date();
    return kindPrefix(kind) + '-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(n).padStart(4, '0');
  }
  function badgeClass(status) {
    var map = { 'En attente': 's-attente', 'Confirmée': 's-confirmee', 'En préparation': 's-preparation', 'En livraison': 's-livraison', 'Livrée': 's-livree', 'Facturée': 's-facturee', 'Payée': 's-payee', 'Annulée': 's-annulee' };
    return map[status] || 's-attente';
  }
  function toast(msg) {
    if (!els.toast) {
      els.toast = document.createElement('div');
      els.toast.className = 'toast';
      els.toast.setAttribute('role', 'status');
      els.toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(els.toast);
    }
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(els.toast._t);
    els.toast._t = setTimeout(function () { els.toast.classList.remove('show'); }, 2400);
  }
  function updateTotal() {
    if (!els.montant) return;
    var t = (Number(els.quantite && els.quantite.value) || 0) * (Number(els.prix && els.prix.value) || 0);
    els.montant.value = t ? money(t) + ' USD' : '';
  }
  function syncFields() {
    var kind = activeTab === 'corbeille' ? (els.type.value || 'commande') : (activeTab === 'livraisons' ? 'livraison' : activeTab === 'factures' ? 'facture' : 'commande');
    var showMoney = kind === 'facture' || kind === 'commande' || kind === 'livraison';
    if (els.fieldPrix) els.fieldPrix.style.display = showMoney ? '' : 'none';
    if (els.fieldTotal) els.fieldTotal.style.display = showMoney ? '' : 'none';
    if (els.fieldEcheance) els.fieldEcheance.style.display = kind === 'facture' ? '' : 'none';
  }
  function itemsForTab() {
    var q = (els.search.value || '').toLowerCase().trim();
    var fs = els.filter.value || '';
    return state.items.filter(function (it) {
      if (activeTab === 'corbeille') { if (!it.deleted) return false; }
      else { if (it.deleted) return false; if (it.kind !== (activeTab === 'commandes' ? 'commande' : activeTab === 'livraisons' ? 'livraison' : 'facture')) return false; }
      if (fs && it.statut !== fs) return false;
      if (q) {
        var hay = [it.docNo, it.client, it.telephone, it.produit, it.adresse, it.livreur, it.notes, it.statut, it.kind].join(' ').toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')) || b.id - a.id; });
  }
  function renderStats() {
    var active = state.items.filter(function (i) { return !i.deleted; });
    var deleted = state.items.filter(function (i) { return i.deleted; });
    if (els.sCmd) els.sCmd.textContent = active.filter(function (i) { return i.kind === 'commande'; }).length;
    if (els.sLiv) els.sLiv.textContent = active.filter(function (i) { return i.kind === 'livraison'; }).length;
    if (els.sFac) els.sFac.textContent = active.filter(function (i) { return i.kind === 'facture'; }).length;
    if (els.sTrash) els.sTrash.textContent = deleted.length;
  }
  function render() {
    renderStats();
    var rows = itemsForTab();
    var trash = activeTab === 'corbeille';
    var facture = activeTab === 'factures';
    var cols = trash
      ? ['Type', 'N°', 'Client', 'Produit', 'Qté', 'Montant', 'Date', 'Statut', 'Actions']
      : facture
      ? ['N°', 'Client', 'Produit', 'Qté', 'P.U.', 'Total', 'Date', 'Échéance', 'Statut', 'Actions']
      : ['N°', 'Client', 'Téléphone', 'Produit', 'Qté', 'Date', 'Statut', 'Adresse', 'Actions'];
    els.head.innerHTML = '<tr>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
    if (!rows.length) {
      els.body.innerHTML = '';
      els.empty.hidden = false;
      return;
    }
    els.empty.hidden = true;
    els.body.innerHTML = rows.map(function (it) {
      var actions = trash
        ? '<button type="button" class="action-btn success" data-action="restore" data-id="' + it.id + '">Restaurer</button>' +
          '<button type="button" class="action-btn" data-action="print" data-id="' + it.id + '">Imprimer</button>' +
          '<button type="button" class="action-btn danger" data-action="purge" data-id="' + it.id + '">Supprimer</button>'
        : '<button type="button" class="action-btn" data-action="edit" data-id="' + it.id + '">Modifier</button>' +
          '<button type="button" class="action-btn" data-action="print" data-id="' + it.id + '">Imprimer</button>' +
          '<button type="button" class="action-btn danger" data-action="delete" data-id="' + it.id + '">Corbeille</button>';
      var statut = '<span class="badge ' + badgeClass(it.statut) + '">' + esc(it.statut) + '</span>';
      var actionCell = '<td><div class="actions">' + actions + '</div></td>';
      if (trash) return '<tr><td>' + esc(kindLabel(it.kind)) + '</td><td>' + esc(it.docNo) + '</td><td>' + esc(it.client) + '</td><td>' + esc(it.produit) + '</td><td>' + esc(it.quantite) + '</td><td>' + money(totalOf(it)) + ' USD</td><td>' + esc(it.date) + '</td><td>' + statut + '</td>' + actionCell + '</tr>';
      if (facture) return '<tr><td>' + esc(it.docNo) + '</td><td>' + esc(it.client) + '</td><td>' + esc(it.produit) + '</td><td>' + esc(it.quantite) + '</td><td>' + money(it.prix) + '</td><td>' + money(totalOf(it)) + ' USD</td><td>' + esc(it.date) + '</td><td>' + esc(it.echeance) + '</td><td>' + statut + '</td>' + actionCell + '</tr>';
      return '<tr><td>' + esc(it.docNo) + '</td><td>' + esc(it.client) + '</td><td>' + esc(it.telephone) + '</td><td>' + esc(it.produit) + '</td><td>' + esc(it.quantite) + '</td><td>' + esc(it.date) + '</td><td>' + statut + '</td><td>' + esc(it.adresse) + '</td>' + actionCell + '</tr>';
    }).join('');
  }
  function resetForm() {
    form.reset();
    els.id.value = '';
    var kind = activeTab === 'livraisons' ? 'livraison' : activeTab === 'factures' ? 'facture' : 'commande';
    if (activeTab === 'corbeille') kind = 'commande';
    els.type.value = kind;
    if (els.docNo) els.docNo.value = '';
    if (els.prix) els.prix.value = '';
    if (els.echeance) els.echeance.value = '';
    els.date.value = new Date().toISOString().slice(0, 10);
    els.quantite.value = 1;
    els.statut.value = kind === 'facture' ? 'Facturée' : 'En attente';
    if (els.btnPrint) els.btnPrint.hidden = true;
    syncFields();
    updateTotal();
    els.hint.textContent = 'Mode: ajout (' + kindLabel(kind) + '). Sélectionnez un élément dans le tableau pour le modifier ou l’imprimer.';
  }
  function fillForm(it) {
    els.id.value = it.id;
    els.type.value = it.kind;
    if (els.docNo) els.docNo.value = it.docNo || '';
    els.client.value = it.client || '';
    els.telephone.value = it.telephone || '';
    els.produit.value = it.produit || '';
    els.quantite.value = it.quantite || 1;
    if (els.prix) els.prix.value = it.prix == null ? '' : it.prix;
    els.date.value = it.date || '';
    if (els.echeance) els.echeance.value = it.echeance || '';
    els.statut.value = it.statut || 'En attente';
    els.adresse.value = it.adresse || '';
    els.livreur.value = it.livreur || '';
    els.notes.value = it.notes || '';
    syncFields();
    updateTotal();
    if (els.btnPrint) els.btnPrint.hidden = false;
    els.hint.textContent = 'Mode: modification ' + (it.docNo || ('#' + it.id)) + ' (' + kindLabel(it.kind) + ').';
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function activateTab(tabName) {
    activeTab = tabName;
    els.tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === tabName;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var canAdd = activeTab !== 'corbeille';
    if (els.btnNew) els.btnNew.style.visibility = canAdd ? 'visible' : 'hidden';
    form.style.display = canAdd ? '' : 'none';
    resetForm();
    render();
  }
  function printDoc(it) {
    if (!it || !els.printArea) return;
    var total = money(totalOf(it));
    els.printArea.innerHTML =
      '<div class="doc-sheet">' +
        '<div class="doc-head"><div><h1 class="doc-title">' + esc(kindLabel(it.kind)) + '</h1><div class="doc-meta"><p><strong>Kikyo Uhai</strong> — Usine du Centre Uhai Kikyo</p><p>Butembo, République Démocratique du Congo</p></div></div>' +
        '<div class="doc-meta"><p><strong>N°:</strong> ' + esc(it.docNo || ('#' + it.id)) + '</p><p><strong>Date:</strong> ' + esc(it.date) + '</p>' + (it.echeance ? '<p><strong>Échéance:</strong> ' + esc(it.echeance) + '</p>' : '') + '<p><strong>Statut:</strong> ' + esc(it.statut) + '</p></div></div>' +
        '<div class="doc-grid"><div class="doc-box"><h3>Client</h3><p><strong>' + esc(it.client) + '</strong></p><p>' + esc(it.telephone) + '</p><p>' + esc(it.adresse) + '</p></div>' +
        '<div class="doc-box"><h3>Opération</h3><p><strong>Type:</strong> ' + esc(kindLabel(it.kind)) + '</p><p><strong>Responsable:</strong> ' + esc(it.livreur || '—') + '</p><p><strong>Notes:</strong> ' + esc(it.notes || '—') + '</p></div></div>' +
        '<table class="doc-table"><thead><tr><th>Produit</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr></thead><tbody><tr><td>' + esc(it.produit) + '</td><td>' + esc(it.quantite) + '</td><td>' + money(it.prix) + ' USD</td><td>' + total + ' USD</td></tr></tbody></table>' +
        '<div class="doc-total">Montant total: ' + total + ' USD</div>' +
        '<div class="doc-foot"><div class="doc-sign">Signature client</div><div class="doc-sign">Signature Kikyo Uhai</div></div>' +
        '<div class="doc-credit">Dev.Bea-wa-Kayisavir Donnel — Réalisé avec Cloudinary</div>' +
      '</div>';
    window.print();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!els.client.value.trim() || !els.produit.value || !els.date.value) {
      toast('Veuillez remplir client, produit et date.');
      return;
    }
    var kind = activeTab === 'livraisons' ? 'livraison' : activeTab === 'factures' ? 'facture' : (els.type.value || 'commande');
    var data = {
      kind: kind,
      docNo: (els.docNo && els.docNo.value.trim()) || '',
      client: els.client.value.trim(),
      telephone: els.telephone.value.trim(),
      produit: els.produit.value,
      quantite: Math.max(1, parseInt(els.quantite.value, 10) || 1),
      prix: Number(els.prix && els.prix.value) || 0,
      date: els.date.value,
      echeance: els.echeance ? els.echeance.value : '',
      statut: els.statut.value,
      adresse: els.adresse.value.trim(),
      livreur: els.livreur.value.trim(),
      notes: els.notes.value.trim()
    };
    var id = els.id.value ? parseInt(els.id.value, 10) : 0;
    if (id) {
      var idx = state.items.findIndex(function (i) { return i.id === id; });
      if (idx !== -1) {
        data.id = id;
        data.kind = state.items[idx].kind;
        data.deleted = state.items[idx].deleted;
        if (!data.docNo) data.docNo = state.items[idx].docNo || nextDocNo(data.kind);
        state.items[idx] = data;
        toast('Enregistrement modifié.');
      }
    } else {
      data.id = uid();
      data.deleted = false;
      if (!data.docNo) data.docNo = nextDocNo(kind);
      state.items.push(data);
      toast(kindLabel(kind) + ' ajouté(e).');
    }
    saveState();
    resetForm();
    render();
  });
  els.body.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var id = parseInt(btn.getAttribute('data-id'), 10);
    var action = btn.getAttribute('data-action');
    var idx = state.items.findIndex(function (i) { return i.id === id; });
    if (idx === -1) return;
    var it = state.items[idx];
    if (action === 'edit') { fillForm(it); return; }
    if (action === 'print') { printDoc(it); return; }
    if (action === 'delete') {
      if (!confirm('Déplacer cet enregistrement dans la corbeille ?')) return;
      it.deleted = true; saveState(); resetForm(); render(); toast('Déplacé dans la corbeille.'); return;
    }
    if (action === 'restore') {
      it.deleted = false; saveState(); render(); toast('Enregistrement restauré.'); return;
    }
    if (action === 'purge') {
      if (!confirm('Supprimer définitivement cet enregistrement ?')) return;
      state.items.splice(idx, 1); saveState(); render(); toast('Supprimé définitivement.');
    }
  });
  els.tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activateTab(tab.getAttribute('data-tab')); });
  });
  document.querySelectorAll('[data-open-tab]').forEach(function (link) {
    link.addEventListener('click', function () {
      var tabName = link.getAttribute('data-open-tab');
      if (tabName) setTimeout(function () { activateTab(tabName); }, 0);
    });
  });
  if (els.quantite) els.quantite.addEventListener('input', updateTotal);
  if (els.prix) els.prix.addEventListener('input', updateTotal);
  if (els.btnPrint) els.btnPrint.addEventListener('click', function () {
    var id = els.id.value ? parseInt(els.id.value, 10) : 0;
    var it = state.items.find(function (i) { return i.id === id; });
    if (it) printDoc(it);
  });
  els.search.addEventListener('input', render);
  els.filter.addEventListener('change', render);
  els.btnNew.addEventListener('click', function () { resetForm(); els.client.focus(); });
  els.btnCancel.addEventListener('click', resetForm);

  resetForm();
  render();
})();
