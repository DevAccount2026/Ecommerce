document.addEventListener(
  "DOMContentLoaded",
  initMarketingSegmentsPage
);

function initMarketingSegmentsPage() {
  renderSegments();
}

function renderSegments() {
  const segments = getMarketingSegments();

  renderSummaryCards(segments);
  renderSegmentsTable(segments);
}

function renderSummaryCards(segments) {
  const grid = document.querySelector("#segmentsSummaryGrid");

  grid.innerHTML = segments.map(segment => `
    <article class="segment-card">
      <h3>${segment.name}</h3>
      <strong>${segment.customers.length}</strong>
    </article>
  `).join("");
}

function renderSegmentsTable(segments) {
  const body = document.querySelector("#segmentsTableBody");

  body.innerHTML = segments.map(segment => `
    <div class="segment-row">
      <span>${segment.name}</span>
      <span>${segment.customers.length}</span>

      <span>
        <button
          class="segment-view-btn"
          onclick="viewSegment('${segment.id}')">
          View
        </button>
      </span>
    </div>
  `).join("");
}

function viewSegment(segmentId) {
  alert(`Segment: ${segmentId}`);
}