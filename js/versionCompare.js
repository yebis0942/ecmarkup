'use strict';

// Version compare widget: adds a per-clause button that links to ecma262-compare
// for viewing diffs between ECMAScript spec versions.

let definedVersions = [
  { label: 'ES2016', hash: 'b154ce84698377ab53fe88c889633263607f4423' },
  { label: 'ES2017', hash: '7301daf5ab1f0959b203c2e63ecccb21fe13d5e5' },
  { label: 'ES2018', hash: '0d37f42998733743c294209884120d722384f095' },
  { label: 'ES2019', hash: 'bc6fd169661d8737d7087bb822ef2a9c7148ac0b' },
  { label: 'ES2020', hash: 'dfd5ea2ec5862de21b005737650ba08bc57271fa' },
  { label: 'ES2021', hash: 'fc85c50181b2b8d7d75f034800528d87fda6b654' },
  { label: 'ES2022', hash: '9d440aefa584bcc0d76dd4de611eabcc4f687043' },
  { label: 'ES2023', hash: '2ac367880d620c49258c9a045833b28c3944b982' },
  { label: 'ES2024', hash: '24eed9a02d509081571d35212d24bebcdc9e66fd' },
  { label: 'ES2025', hash: '5117d4f48a3fd9adea8fd2883ec70019836fc1e8' },
];

let versionCompareState = {
  openPanel: null, // the currently open panel element, or null
  fromIndex: definedVersions.length - 2, // default: one before latest
  toIndex: definedVersions.length - 1, // default: latest
  selectingEndpoint: 'from', // 'from' or 'to'
};

function initVersionCompare() {
  let clauses = document.querySelectorAll('emu-clause[id], emu-annex[id]');
  for (let i = 0; i < clauses.length; i++) {
    let clause = clauses[i];
    let h1 = clause.querySelector('h1');
    if (!h1) continue;
    // Only attach to direct h1 children of this clause
    if (h1.parentNode !== clause) continue;

    let btn = document.createElement('button');
    btn.className = 'version-compare-btn';
    btn.textContent = 'compare';
    btn.title = 'Compare versions of this section';
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel(btn, clause.id);
    });
    h1.appendChild(btn);
  }

  // Close panel on outside click
  document.addEventListener('click', e => {
    if (
      versionCompareState.openPanel &&
      !versionCompareState.openPanel.contains(e.target) &&
      !e.target.classList.contains('version-compare-btn')
    ) {
      closePanel();
    }
  });
}

function togglePanel(btn, sectionId) {
  if (versionCompareState.openPanel && versionCompareState.openPanel._sectionId === sectionId) {
    closePanel();
    return;
  }
  closePanel();
  openPanel(btn, sectionId);
}

function closePanel() {
  if (versionCompareState.openPanel) {
    versionCompareState.openPanel.remove();
    versionCompareState.openPanel = null;
  }
}

function openPanel(btn, sectionId) {
  let panel = document.createElement('div');
  panel.className = 'version-compare-panel';
  panel._sectionId = sectionId;

  // Endpoint selectors
  let endpoints = document.createElement('div');
  endpoints.className = 'version-compare-endpoints';

  let fromBtn = document.createElement('button');
  fromBtn.className = 'version-compare-endpoint';
  if (versionCompareState.selectingEndpoint === 'from') {
    fromBtn.classList.add('active');
  }
  fromBtn.addEventListener('click', e => {
    e.stopPropagation();
    versionCompareState.selectingEndpoint = 'from';
    updatePanel(panel);
  });

  let toBtn = document.createElement('button');
  toBtn.className = 'version-compare-endpoint';
  if (versionCompareState.selectingEndpoint === 'to') {
    toBtn.classList.add('active');
  }
  toBtn.addEventListener('click', e => {
    e.stopPropagation();
    versionCompareState.selectingEndpoint = 'to';
    updatePanel(panel);
  });

  endpoints.appendChild(fromBtn);
  endpoints.appendChild(toBtn);
  panel.appendChild(endpoints);

  // Version bar
  let bar = document.createElement('div');
  bar.className = 'version-compare-bar';

  for (let v = 0; v < definedVersions.length; v++) {
    let cell = document.createElement('button');
    cell.className = 'version-compare-cell';
    cell.textContent = definedVersions[v].label;
    cell.dataset.index = v;
    cell.addEventListener('click', function (e) {
      e.stopPropagation();
      let idx = parseInt(this.dataset.index);
      if (versionCompareState.selectingEndpoint === 'from') {
        versionCompareState.fromIndex = idx;
        // Auto-switch to 'to' after selecting 'from'
        versionCompareState.selectingEndpoint = 'to';
      } else {
        versionCompareState.toIndex = idx;
        // Auto-switch to 'from' after selecting 'to'
        versionCompareState.selectingEndpoint = 'from';
      }
      updatePanel(panel);
    });
    bar.appendChild(cell);
  }

  panel.appendChild(bar);

  // Open button
  let openBtn = document.createElement('button');
  openBtn.className = 'version-compare-open-btn';
  openBtn.addEventListener('click', e => {
    e.stopPropagation();
    let fromHash = definedVersions[versionCompareState.fromIndex].hash;
    let toHash = definedVersions[versionCompareState.toIndex].hash;
    let url =
      'https://arai-a.github.io/ecma262-compare/?from=' +
      encodeURIComponent(fromHash) +
      '&to=' +
      encodeURIComponent(toHash) +
      '&id=' +
      encodeURIComponent(sectionId);
    window.open(url, '_blank');
  });
  panel.appendChild(openBtn);

  // Close button
  let closeBtn = document.createElement('button');
  closeBtn.className = 'version-compare-close-btn';
  closeBtn.textContent = '\u2716';
  closeBtn.title = 'Close';
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    closePanel();
  });
  panel.appendChild(closeBtn);

  updatePanel(panel);

  // Position relative to button
  btn.style.position = 'relative';
  btn.parentNode.style.position = 'relative';
  btn.parentNode.appendChild(panel);

  versionCompareState.openPanel = panel;
}

function updatePanel(panel) {
  // Update endpoint buttons
  let endpointBtns = panel.querySelectorAll('.version-compare-endpoint');
  let fromBtn = endpointBtns[0];
  let toBtn = endpointBtns[1];

  fromBtn.textContent = 'From: ' + definedVersions[versionCompareState.fromIndex].label;
  fromBtn.classList.toggle('active', versionCompareState.selectingEndpoint === 'from');
  toBtn.textContent = 'To: ' + definedVersions[versionCompareState.toIndex].label;
  toBtn.classList.toggle('active', versionCompareState.selectingEndpoint === 'to');

  // Update version cells
  let cells = panel.querySelectorAll('.version-compare-cell');
  for (let i = 0; i < cells.length; i++) {
    let idx = parseInt(cells[i].dataset.index);
    cells[i].classList.remove('selected-from', 'selected-to', 'in-range');
    if (idx === versionCompareState.fromIndex) {
      cells[i].classList.add('selected-from');
    }
    if (idx === versionCompareState.toIndex) {
      cells[i].classList.add('selected-to');
    }
    let lo = Math.min(versionCompareState.fromIndex, versionCompareState.toIndex);
    let hi = Math.max(versionCompareState.fromIndex, versionCompareState.toIndex);
    if (idx > lo && idx < hi) {
      cells[i].classList.add('in-range');
    }
  }

  // Update open button
  let openBtn = panel.querySelector('.version-compare-open-btn');
  openBtn.textContent =
    'Compare ' +
    definedVersions[versionCompareState.fromIndex].label +
    ' \u2192 ' +
    definedVersions[versionCompareState.toIndex].label;
}

document.addEventListener('DOMContentLoaded', initVersionCompare);
