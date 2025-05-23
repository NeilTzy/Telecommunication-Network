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
const datasetSelector = document.getElementById("datasetSelector");

const datasets = {
  "random": null,
  "luzon": {
    nodes: [
      { id: 0, name: "Manila", x: 150, y: 100 },
      { id: 1, name: "Baguio", x: 200, y: 60 },
      { id: 2, name: "Clark", x: 250, y: 120 },
      { id: 3, name: "Batangas", x: 150, y: 180 },
      { id: 4, name: "Laguna", x: 220, y: 200 },
      { id: 5, name: "Quezon", x: 300, y: 180 }
    ],
    edges: [
      { u: 0, v: 1, weight: 10 },
      { u: 0, v: 2, weight: 5 },
      { u: 0, v: 3, weight: 7 },
      { u: 1, v: 2, weight: 3 },
      { u: 3, v: 4, weight: 8 },
      { u: 4, v: 5, weight: 6 },
      { u: 2, v: 5, weight: 9 }
    ]
  },
  "visayas": {
    nodes: [
      { id: 0, name: "Cebu", x: 150, y: 100 },
      { id: 1, name: "Iloilo", x: 200, y: 60 },
      { id: 2, name: "Bacolod", x: 250, y: 120 },
      { id: 3, name: "Dumaguete", x: 150, y: 180 },
      { id: 4, name: "Tagbilaran", x: 220, y: 200 }
    ],
    edges: [
      { u: 0, v: 1, weight: 4 },
      { u: 1, v: 2, weight: 5 },
      { u: 2, v: 3, weight: 6 },
      { u: 3, v: 4, weight: 7 },
      { u: 4, v: 0, weight: 8 },
      { u: 0, v: 2, weight: 3 }
    ]
  },
  "mindanao": {
    nodes: [
      { id: 0, name: "Davao", x: 150, y: 100 },
      { id: 1, name: "Cagayan de Oro", x: 230, y: 80 },
      { id: 2, name: "Zamboanga", x: 90, y: 160 },
      { id: 3, name: "General Santos", x: 170, y: 200 },
      { id: 4, name: "Butuan", x: 260, y: 160 },
      { id: 5, name: "Iligan", x: 200, y: 140 }
    ],
    edges: [
      { u: 0, v: 1, weight: 6 },
      { u: 0, v: 3, weight: 5 },
      { u: 1, v: 4, weight: 7 },
      { u: 1, v: 5, weight: 4 },
      { u: 2, v: 5, weight: 8 },
      { u: 3, v: 4, weight: 9 },
      { u: 2, v: 0, weight: 10 }
    ]
  },
};

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

const towerImg = new Image();
towerImg.src = "static/tower.jpg";
towerImg.onload = () => {
  resetGraph();
};

document.getElementById("startBtn").addEventListener("click", startKruskal);
document.getElementById("stepBtn").addEventListener("click", stepForward);
document.getElementById("resetBtn").addEventListener("click", resetGraph);
speedSlider.addEventListener("input", e => {
  animationSpeed = 1000 / parseFloat(e.target.value);
});
datasetSelector.addEventListener("change", resetGraph);

// Export MST button
const exportBtn = document.createElement("button");
exportBtn.textContent = "📤 Export MST";
exportBtn.className = "btn";
exportBtn.onclick = exportMST;
document.querySelector(".controls").appendChild(exportBtn);

function exportMST() {
  const data = {
    totalCost: mstCost,
    mstEdges: mst.map(e => ({
      from: nodes[e.u].name || `T${e.u + 1}`,
      to: nodes[e.v].name || `T${e.v + 1}`,
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
  const selectedDataset = datasetSelector.value;
  logOutput.innerHTML = "";
  mst = [];
  mstCost = 0;
  stepIndex = 0;

  if (selectedDataset === "random" || !datasets[selectedDataset]) {
    generateRandomGraph();
  } else {
    const dataset = datasets[selectedDataset];
    nodes = dataset.nodes.map(n => ({ ...n }));
    edges = dataset.edges.map(e => ({ ...e, selected: false }));
    normalizeStaticDataset();  // 💡 Normalize static dataset
  }
  drawGraph();
  updateGraphInfo();
}


function generateRandomGraph() {
  nodes = [];
  edges = [];
  const nodeCount = 6;
  const radius = 180;
  for (let i = 0; i < nodeCount; i++) {
    const angle = (2 * Math.PI / nodeCount) * i;
    const x = canvas.width / 2 + radius * Math.cos(angle);
    const y = canvas.height / 2 + radius * Math.sin(angle);
    nodes.push({ id: i, x, y });
  }
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

function normalizeStaticDataset() {
  const padding = 40;
  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y));

  const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
  const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1);
  const scale = Math.min(scaleX, scaleY);

  nodes = nodes.map(n => ({
    ...n,
    x: (n.x - minX) * scale + padding,
    y: (n.y - minY) * scale + padding
  }));
}


function drawGraph() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  nodes.forEach(node => {
    ctx.drawImage(towerImg, node.x - 16, node.y - 32, 32, 32);
    ctx.fillStyle = "#1B263B";
    ctx.font = "12px Poppins";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.name || `T${node.id + 1}`, node.x, node.y + 20);
  });
}

function animateEdge(edge, callback) {
  const u = nodes[edge.u];
  const v = nodes[edge.v];
  const steps = 20;
  let step = 0;

  function drawStep() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw all existing edges, including selected ones
    edges.forEach(e => {
      const a = nodes[e.u];
      const b = nodes[e.v];
      ctx.strokeStyle = e.selected ? "#27ae60" : "#B0BEC5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      ctx.fillStyle = "#1B263B";
      ctx.font = "14px Poppins";
      ctx.fillText(e.weight, midX - 10, midY - 5);
    });

    // 2. Draw current animated edge (partially)
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    const progressX = u.x + ((v.x - u.x) * step) / steps;
    const progressY = u.y + ((v.y - u.y) * step) / steps;
    ctx.lineTo(progressX, progressY);
    ctx.stroke();

    // 3. Draw all nodes
    nodes.forEach(node => {
      ctx.drawImage(towerImg, node.x - 16, node.y - 32, 32, 32);
      ctx.fillStyle = "#1B263B";
      ctx.font = "12px Poppins";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(node.name || `T${node.id + 1}`, node.x, node.y + 20);
    });

    step++;
    if (step <= steps) {
      setTimeout(drawStep, animationSpeed / steps);
    } else {
      callback(); // Call after animation completes
    }
  }

  drawStep();
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

let isAnimating = false;

function stepForward() {
  if (isAnimating) return; // Prevent overlapping animations

  if (stepIndex >= sortedEdges.length) {
    log("✅ MST Construction Complete.");
    return;
  }

  const edge = sortedEdges[stepIndex++];
  const rootU = find(edge.u);
  const rootV = find(edge.v);

  if (rootU !== rootV) {
    union(edge.u, edge.v);
    mst.push(edge);
    mstCost += edge.weight;
    const nameU = nodes[edge.u].name || `T${edge.u + 1}`;
    const nameV = nodes[edge.v].name || `T${edge.v + 1}`;
    log(`✔️ Connecting ${nameU} to ${nameV} — cost: ${edge.weight}`);

    isAnimating = true;

    // Animate connection
    animateEdge(edge, () => {
      edge.selected = true;
      drawGraph();
      updateGraphInfo();
      isAnimating = false;
    });
  } else {
    const nameU = nodes[edge.u].name || `T${edge.u + 1}`;
    const nameV = nodes[edge.v].name || `T${edge.v + 1}`;
    log(`❌ Skipped ${nameU} - ${nameV} (Cycle detected)`);

    drawGraph();
    updateGraphInfo();
  }
}
