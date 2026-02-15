'use strict';

// Version Bar — lazy-loads historical section content and displays it inline.
// Requires `defined_versionBarManifest` and `defined_versionBarDataDir` to be defined
// before this script runs (injected by the build).

(function () {
  if (typeof defined_versionBarManifest === 'undefined') return;

  var manifest = defined_versionBarManifest;
  var dataDir = typeof defined_versionBarDataDir === 'string' ? defined_versionBarDataDir : '';

  // Cache for fetched section data: sectionId -> { versionKey -> html }
  var sectionCache = {};

  function fetchSectionData(sectionId) {
    if (sectionCache[sectionId]) {
      return Promise.resolve(sectionCache[sectionId]);
    }
    var url = (dataDir ? dataDir + '/' : '') + 'version-bar-data/' + encodeURIComponent(sectionId) + '.json';
    return fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('Failed to fetch ' + url);
        return response.json();
      })
      .then(function (data) {
        sectionCache[sectionId] = data;
        return data;
      });
  }

  function findVersionLabel(versionKey) {
    for (var i = 0; i < manifest.versions.length; i++) {
      if (manifest.versions[i].key === versionKey) {
        return manifest.versions[i].label;
      }
    }
    return versionKey;
  }

  function getOrCreateViewer(versionBar) {
    var viewer = versionBar.nextElementSibling;
    if (viewer && viewer.classList.contains('version-viewer')) {
      return viewer;
    }
    viewer = document.createElement('div');
    viewer.className = 'version-viewer';
    versionBar.after(viewer);
    return viewer;
  }

  function removeViewer(versionBar) {
    var viewer = versionBar.nextElementSibling;
    if (viewer && viewer.classList.contains('version-viewer')) {
      viewer.remove();
    }
  }

  function clearSelection(versionBar) {
    var segments = versionBar.querySelectorAll('.version-segment.selected');
    for (var i = 0; i < segments.length; i++) {
      segments[i].classList.remove('selected');
    }
  }

  function handleSegmentClick(event) {
    var segment = event.target.closest('.version-segment');
    if (!segment) return;
    if (segment.classList.contains('version-segment--absent')) return;

    var versionBar = segment.closest('.version-bar');
    if (!versionBar) return;

    var sectionId = versionBar.getAttribute('data-section-id');
    var versionKey = segment.getAttribute('data-version');
    if (!sectionId || !versionKey) return;

    // Toggle: if already selected, deselect and close
    if (segment.classList.contains('selected')) {
      clearSelection(versionBar);
      removeViewer(versionBar);
      return;
    }

    clearSelection(versionBar);
    segment.classList.add('selected');

    var viewer = getOrCreateViewer(versionBar);
    var label = findVersionLabel(versionKey);
    viewer.innerHTML =
      '<div class="version-viewer-header">' +
        '<span>' + label + '</span>' +
        '<button class="version-viewer-close">&times;</button>' +
      '</div>' +
      '<div class="version-viewer-content">Loading...</div>';

    // Close button
    viewer.querySelector('.version-viewer-close').addEventListener('click', function () {
      clearSelection(versionBar);
      removeViewer(versionBar);
    });

    fetchSectionData(sectionId)
      .then(function (data) {
        var content = data[versionKey];
        var contentEl = viewer.querySelector('.version-viewer-content');
        if (contentEl) {
          contentEl.innerHTML = content || '<em>Content not available for this version.</em>';
        }
      })
      .catch(function () {
        var contentEl = viewer.querySelector('.version-viewer-content');
        if (contentEl) {
          contentEl.innerHTML = '<em>Failed to load content.</em>';
        }
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var bars = document.querySelectorAll('.version-bar');
    for (var i = 0; i < bars.length; i++) {
      bars[i].addEventListener('click', handleSegmentClick);
    }
  });
})();
