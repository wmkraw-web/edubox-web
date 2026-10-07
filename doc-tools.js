// Wspólne narzędzia dla generatorów dokumentów EduBox (Asystent Pedagoga i kolejne):
// strumień z /api/chat, porządkowanie HTML od AI, wstawianie imienia LOKALNIE (nie trafia do AI),
// kopiowanie z formatowaniem do Worda / Dokumentów Google, prawdziwy plik .docx i czysty wydruk / PDF.
// Zwykły skrypt (bez Babela) – globalny obiekt window.EduDocTools.
(function (root) {
  'use strict';

  const DOCX_URL = 'https://cdn.jsdelivr.net/npm/docx@9.8.1/dist/index.iife.min.js';
  const PLACEHOLDER_RE = /\[(?:uzupełnij|propozycja|do decyzji|do ustalenia|imię i nazwisko)[^\]\n]{0,160}\]/gi;
  const NAME_RE = /\[imię i nazwisko(?: ucznia| dziecka)?\]/gi;
  const STREAM_ERROR = '<!--EDUBOX_STREAM_ERROR-->';

  // --- Strumień z /api/chat: onText(całyDotychczasowyTekst) wywoływane najwyżej co ~120 ms ---
  async function streamChat(payload, onText) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, payload, { stream: true }))
    });
    if (!res.ok) {
      let msg = 'Błąd serwera (' + res.status + ')';
      try { const j = await res.json(); msg = j.message || msg; } catch (e) {}
      if (res.status === 429) msg = 'Zbyt wiele zapytań w krótkim czasie. Spróbuj ponownie za kilka minut.';
      throw new Error(msg);
    }
    const type = res.headers.get('content-type') || '';
    const model = res.headers.get('x-edubox-model') || '';
    if (type.includes('application/json')) {
      const j = await res.json();
      const text = j.text || '';
      if (onText) onText(text);
      return { text, model: j.model || model, interrupted: false };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    let last = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      const now = Date.now();
      if (onText && now - last > 120) { last = now; onText(text); }
    }
    text += decoder.decode();
    const interrupted = text.includes(STREAM_ERROR);
    text = text.split(STREAM_ERROR).join('');
    if (onText) onText(text);
    return { text, model, interrupted };
  }

  // --- Porządkowanie odpowiedzi AI ---
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function normalize(raw) {
    let s = String(raw || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    s = s.replace(/^\s*```(?:html)?\s*/i, '').replace(/```\s*$/i, '');
    if (!/<(h1|h2|p|table|ul|ol)\b/i.test(s)) {
      // Model zapasowy oddał zwykły tekst – zamieniamy akapity i **pogrubienia** na HTML.
      s = s.split(/\n{2,}/).map(par => par.trim()).filter(Boolean).map(par => {
        const safe = escapeHtml(par).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        return /^#{1,3}\s/.test(par) ? '<h2>' + safe.replace(/^#{1,3}\s*/, '') + '</h2>' : '<p>' + safe + '</p>';
      }).join('\n');
    }
    return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  // Imię wstawiamy dopiero w przeglądarce – AI widzi tylko [imię i nazwisko ucznia].
  function fillName(html, name) {
    const n = String(name || '').trim();
    return n ? String(html).replace(NAME_RE, escapeHtml(n)) : String(html);
  }

  function markPlaceholders(html) {
    return String(html).replace(PLACEHOLDER_RE, m => '<mark>' + m + '</mark>');
  }

  function countPlaceholders(html) {
    return (String(html).match(PLACEHOLDER_RE) || []).length;
  }

  function headingsOf(html) {
    const out = [];
    String(html).replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (m, inner) => { out.push(inner.replace(/<[^>]+>/g, '').trim()); return m; });
    return out;
  }

  // --- Wersja z wbudowanymi stylami (Word i Dokumenty Google ignorują klasy przy wklejaniu) ---
  function styledHtml(html) {
    return String(html)
      .replace(/<table>/gi, '<table style="border-collapse:collapse;width:100%;margin:6pt 0">')
      .replace(/<th>/gi, '<th style="border:1px solid #808080;padding:4pt 6pt;background:#EEF2F7;text-align:left;vertical-align:top">')
      .replace(/<td>/gi, '<td style="border:1px solid #808080;padding:4pt 6pt;vertical-align:top">')
      .replace(/<mark>/gi, '<mark style="background:#FFF3A3">')
      .replace(/<h1>/gi, '<h1 style="font-size:16pt;text-align:center;margin:0 0 10pt">')
      .replace(/<h2>/gi, '<h2 style="font-size:13pt;margin:14pt 0 6pt;color:#1F3864">')
      .replace(/<h3>/gi, '<h3 style="font-size:11.5pt;margin:10pt 0 4pt">');
  }

  function plainText(html) {
    const box = document.createElement('div');
    box.innerHTML = String(html)
      .replace(/<\/(p|h1|h2|h3|li|tr)>/gi, '$&\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/t[dh]>/gi, '\t');
    return box.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }

  async function copyRich(html) {
    const rich = '<div style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4">' + styledHtml(html) + '</div>';
    const text = plainText(html);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([rich], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        })]);
        return true;
      }
    } catch (e) { /* przeglądarka bez ClipboardItem – niżej sposób zapasowy */ }
    const box = document.createElement('div');
    box.innerHTML = rich;
    box.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;color:#000';
    document.body.appendChild(box);
    const range = document.createRange();
    range.selectNodeContents(box);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const ok = document.execCommand('copy');
    sel.removeAllRanges();
    box.remove();
    return ok;
  }

  // --- Wydruk / PDF: dokument w osobnym kontenerze, reszta strony ukryta tylko na czas druku ---
  function printDoc(html, title) {
    let style = document.getElementById('edubox-print-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'edubox-print-style';
      style.textContent = '@media print{@page{size:A4;margin:18mm 16mm}html.edubox-printing body>*:not(#edubox-print-root){display:none!important}' +
        'html.edubox-printing,html.edubox-printing body{background:#fff!important;color:#000!important;padding:0!important;margin:0!important}' +
        '#edubox-print-root{display:block!important;font-family:Calibri,Carlito,Arial,sans-serif;font-size:11pt;line-height:1.4;color:#000}' +
        '#edubox-print-root table{page-break-inside:auto}#edubox-print-root tr{page-break-inside:avoid}#edubox-print-root h2,#edubox-print-root h3{page-break-after:avoid}' +
        '#edubox-print-root mark{background:#FFF3A3!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}' +
        '#edubox-print-root{display:none}';
      document.head.appendChild(style);
    }
    let rootEl = document.getElementById('edubox-print-root');
    if (!rootEl) { rootEl = document.createElement('div'); rootEl.id = 'edubox-print-root'; document.body.appendChild(rootEl); }
    rootEl.innerHTML = styledHtml(html);
    const prevTitle = document.title;
    if (title) document.title = title;
    document.documentElement.classList.add('edubox-printing');
    const done = () => {
      document.documentElement.classList.remove('edubox-printing');
      document.title = prevTitle;
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  }

  // --- Plik .docx (biblioteka docx ładowana dopiero po kliknięciu) ---
  let docxPromise = null;
  function loadDocx() {
    if (root.docx) return Promise.resolve(root.docx);
    if (!docxPromise) {
      docxPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = DOCX_URL;
        s.onload = () => root.docx ? resolve(root.docx) : reject(new Error('Biblioteka docx nie załadowała się.'));
        s.onerror = () => { docxPromise = null; reject(new Error('Nie udało się pobrać modułu eksportu do Worda. Sprawdź internet i spróbuj ponownie.')); };
        document.head.appendChild(s);
      });
    }
    return docxPromise;
  }

  function htmlToDocxBlocks(html, D, numbering, opts) {
    const o = opts || {};
    const ALIGN = { center: 'CENTER', right: 'RIGHT', justify: 'JUSTIFIED', left: 'LEFT' };
    const bodyAlign = ALIGN[o.align] ? D.AlignmentType[ALIGN[o.align]] : undefined;
    const doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    const container = doc.body.firstElementChild;

    const runsOf = (node, st) => {
      const runs = [];
      node.childNodes.forEach(ch => {
        if (ch.nodeType === 3) {
          const t = ch.textContent.replace(/\s+/g, ' ');
          if (t && t !== ' ' || (t === ' ' && runs.length)) {
            runs.push(new D.TextRun({ text: t, bold: !!st.bold, italics: !!st.italics, underline: st.underline ? {} : undefined, highlight: st.mark ? 'yellow' : undefined, size: st.size }));
          }
        } else if (ch.nodeType === 1) {
          const tag = ch.tagName.toLowerCase();
          if (tag === 'br') { runs.push(new D.TextRun({ text: '', break: 1 })); return; }
          runs.push(...runsOf(ch, {
            bold: st.bold || tag === 'strong' || tag === 'b',
            italics: st.italics || tag === 'em' || tag === 'i',
            underline: st.underline || tag === 'u',
            mark: st.mark || tag === 'mark',
            size: tag === 'small' ? 18 : st.size
          }));
        }
      });
      return runs;
    };

    const para = (node, opts, st) => new D.Paragraph(Object.assign({ spacing: { after: 100 }, children: runsOf(node, st || {}) }, opts || {}));

    const blocksOf = (parent, ctx) => {
      const out = [];
      parent.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          if (node.textContent.trim()) out.push(new D.Paragraph({ spacing: { after: 100 }, children: [new D.TextRun(node.textContent.trim())] }));
          return;
        }
        if (node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();
        if (tag === 'h1') out.push(para(node, { heading: D.HeadingLevel.HEADING_1, alignment: D.AlignmentType.CENTER, spacing: { after: 200 } }));
        else if (tag === 'h2') out.push(para(node, { heading: D.HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, keepNext: true }));
        else if (tag === 'h3' || tag === 'h4') out.push(para(node, { heading: D.HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 }, keepNext: true }));
        else if (tag === 'p' || tag === 'blockquote') out.push(para(node,
          Object.assign({}, tag === 'blockquote' ? { indent: { left: 567 } } : null, bodyAlign ? { alignment: bodyAlign } : null),
          { bold: false, italics: !!o.italic, size: ctx && ctx.small ? 18 : (o.size || undefined) }));
        else if (tag === 'ul' || tag === 'ol') {
          const level = ctx && ctx.level ? ctx.level : 0;
          const instance = numbering.next++;
          node.childNodes.forEach(li => {
            if (li.nodeType !== 1 || li.tagName.toLowerCase() !== 'li') return;
            const nested = Array.from(li.childNodes).filter(c => c.nodeType === 1 && /^(ul|ol)$/i.test(c.tagName));
            const inline = li.cloneNode(true);
            Array.from(inline.childNodes).forEach(c => { if (c.nodeType === 1 && /^(ul|ol)$/i.test(c.tagName)) c.remove(); });
            out.push(new D.Paragraph(Object.assign({ spacing: { after: 60 }, children: runsOf(inline, {}) },
              tag === 'ol' ? { numbering: { reference: 'edubox-num', level: Math.min(level, 2), instance } } : { bullet: { level: Math.min(level, 2) } })));
            nested.forEach(n => out.push(...blocksOf({ childNodes: [n] }, { level: level + 1 })));
          });
        } else if (tag === 'table') {
          const rows = Array.from(node.querySelectorAll('tr'));
          if (!rows.length) return;
          const cols = Math.max(...rows.map(r => r.children.length));
          const tableRows = rows.map((tr, ri) => {
            const isHeader = tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead' || Array.from(tr.children).every(c => c.tagName.toLowerCase() === 'th') && ri === 0;
            const cells = Array.from(tr.children);
            while (cells.length < cols) cells.push(null);
            return new D.TableRow({
              tableHeader: !!isHeader,
              cantSplit: true,
              children: cells.map(cell => {
                const isTh = cell && cell.tagName.toLowerCase() === 'th';
                const hasBlocks = cell && Array.from(cell.children).some(c => /^(p|ul|ol|table|h3|h4)$/i.test(c.tagName));
                const children = !cell ? [new D.Paragraph('')]
                  : hasBlocks ? blocksOf(cell, {})
                  : [new D.Paragraph({ children: runsOf(cell, { bold: isTh }) })];
                return new D.TableCell({
                  children: children.length ? children : [new D.Paragraph('')],
                  shading: isTh ? { fill: 'EEF2F7', type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
                  margins: { top: 60, bottom: 60, left: 100, right: 100 }
                });
              })
            });
          });
          out.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, rows: tableRows }));
          out.push(new D.Paragraph({ spacing: { after: 60 }, children: [] }));
        } else {
          out.push(...blocksOf(node, ctx));
        }
      });
      return out;
    };

    return blocksOf(container, {});
  }

  async function buildDocx(html, opts) {
    const o = opts || {};
    const D = await loadDocx();
    const numbering = { next: 1 };
    const children = htmlToDocxBlocks(html, D, numbering, { align: o.align, italic: o.italic, size: o.size });
    const document_ = new D.Document({
      creator: 'EduBox AI',
      title: o.title || 'Dokument',
      styles: {
        default: { document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 276 } } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: '000000' } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '1F3864' } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '000000' } }
        ]
      },
      numbering: {
        config: [{
          reference: 'edubox-num',
          levels: [0, 1, 2].map(level => ({
            level, format: D.LevelFormat.DECIMAL, text: level === 0 ? '%1.' : level === 1 ? '%2)' : '%3.',
            alignment: D.AlignmentType.START, style: { paragraph: { indent: { left: 567 * (level + 1), hanging: 340 } } }
          }))
        }]
      },
      sections: [{
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        footers: {
          default: new D.Footer({
            children: [new D.Paragraph({
              alignment: D.AlignmentType.CENTER,
              children: [new D.TextRun({ children: ['Strona ', D.PageNumber.CURRENT, ' z ', D.PageNumber.TOTAL_PAGES], size: 16, color: '666666' })]
            })]
          })
        },
        children
      }]
    });
    return D.Packer.toBlob(document_);
  }

  async function downloadDocx(html, opts) {
    const o = opts || {};
    const blob = await buildDocx(html, o);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (o.filename || 'dokument') + '.docx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  root.EduDocTools = {
    streamChat, normalize, fillName, markPlaceholders, countPlaceholders, headingsOf,
    styledHtml, plainText, copyRich, printDoc, buildDocx, downloadDocx, loadDocx
  };
})(typeof window !== 'undefined' ? window : globalThis);
