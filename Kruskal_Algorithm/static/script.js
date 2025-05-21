const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 500;
canvas.height = 480;

let nodes = [];
let edges = [];
let mst = [];
let parent = [];
let stepIndex = 0;
let sortedEdges = [];
let mstCost = 0;
let animationSpeed = 1000;

const logOutput = document.getElementById("logOutput");
const speedSlider = document.getElementById("speedSlider");

document.getElementById("startBtn").addEventListener("click", startKruskal);
document.getElementById("stepBtn").addEventListener("click", stepForward);
document.getElementById("resetBtn").addEventListener("click", resetGraph);
speedSlider.addEventListener("input", e => {
  animationSpeed = 1000 / parseFloat(e.target.value);
});

function log(message) {
  const entry = document.createElement("p");
  entry.textContent = message;
  logOutput.appendChild(entry);
  logOutput.scrollTop = logOutput.scrollHeight;
}

function updateGraphInfo() {
  const infoSpans = document.querySelectorAll("#graphInfo span");
  infoSpans[0].textContent = nodes.length;
  infoSpans[1].textContent = edges.length;
  infoSpans[2].textContent = mstCost;
  infoSpans[3].textContent = mst.length;
}

// Tower icon
const towerImg = new Image();
towerImg.src = "static/tower.jpg"; // Flask static path
towerImg.onload = () => {
  resetGraph(); // Start only when image loads
};

// Export button
const exportBtn = document.createElement("button");
exportBtn.textContent = "📤 Export MST";
exportBtn.className = "btn";
exportBtn.onclick = exportMST;
document.querySelector(".controls").appendChild(exportBtn);

function exportMST() {
  const data = {
    totalCost: mstCost,
    mstEdges: mst.map(e => ({
      from: "T" + e.u,
      to: "T" + e.v,
      weight: e.weight
    }))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "kruskal_mst_telecom.json";
  a.click();
}

function resetGraph() {
  nodes = [];
  edges = [];
  mst = [];
  mstCost = 0;
  stepIndex = 0;
  logOutput.innerHTML = "";
  generateGraph();
  drawGraph();
  updateGraphInfo();
}

function generateGraph() {
  const nodeCount = 6;
  const radius = 180;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI / nodeCount) * i;
    const x = canvas.width / 2 + radius * Math.cos(angle);
    const y = canvas.height / 2 + radius * Math.sin(angle);
    nodes.push({ id: i, x, y });
  }

  edges = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < 0.5) {
        edges.push({
          u: i,
          v: j,
          weight: Math.floor(Math.random() * 20 + 1),
          selected: false
        });
      }
    }
  }
}

function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  edges.forEach(edge => {
    const u = nodes[edge.u];
    const v = nodes[edge.v];
    ctx.strokeStyle = edge.selected ? "#27ae60" : "#B0BEC5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();

    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    ctx.fillStyle = "#1B263B";
    ctx.font = "14px Poppins";
    ctx.fillText(edge.weight, midX - 10, midY - 5);
  });

  // Draw towers
  nodes.forEach(node => {
    ctx.drawImage(towerImg, node.x - 16, node.y - 32, 32, 32);
    ctx.fillStyle = "#1B263B";
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`T${node.id}`, node.x, node.y + 20);
  });
}

function find(u) {
  if (parent[u] !== u) parent[u] = find(parent[u]);
  return parent[u];
}

function union(u, v) {
  parent[find(u)] = find(v);
}

function startKruskal() {
  parent = Array.from({ length: nodes.length }, (_, i) => i);
  mst = [];
  mstCost = 0;
  stepIndex = 0;
  sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
  log("🔄 Starting Kruskal’s Algorithm for Telecom Network...");
  updateGraphInfo();
}

function stepForward() {
  if (stepIndex >= sortedEdges.length) {
    log("✅ MST Construction Complete.");
    return;
  }

  const edge = sortedEdges[stepIndex++];
  const rootU = find(edge.u);
  const rootV = find(edge.v);

  if (rootU !== rootV) {
    union(edge.u, edge.v);
    edge.selected = true;
    mst.push(edge);
    mstCost += edge.weight;
    log(`✔️ Connected T${edge.u} to T${edge.v} — cost: ${edge.weight}`);
    animateEdge(edge.u, edge.v, drawGraph);
  } else {
    log(`❌ Skipped T${edge.u} - T${edge.v} (Cycle detected)`);
    drawGraph();
  }

  updateGraphInfo();
}

function animateEdge(uIdx, vIdx, callback) {
  const u = nodes[uIdx];
  const v = nodes[vIdx];
  let progress = 0;
  const duration = animationSpeed;
  const start = performance.now();

  function step(timestamp) {
    progress = (timestamp - start) / duration;
    if (progress > 1) progress = 1;

    drawGraph(); // Clear and redraw everything
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(
      u.x + (v.x - u.x) * progress,
      u.y + (v.y - u.y) * progress
    );
    ctx.stroke();

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      callback();
    }
  }

  requestAnimationFrame(step);
}
