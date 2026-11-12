const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const stage = document.querySelector('#workflow-stage');
const edgeLayer = document.querySelector('#edges');
const panel = document.querySelector('#property-panel');
const nodes = [...document.querySelectorAll('.flow-node')];

const nodeDetails = {
  trigger: { title: 'Input', type: 'Trigger', variable: 'user_request', required: true },
  agent: { title: 'Plan', type: 'Agent', variable: 'plan_result', required: true },
  knowledge: { title: 'Retrieve', type: 'Knowledge', variable: 'context_pack', required: false },
  output: { title: 'Validate', type: 'Output', variable: 'verified_result', required: true },
};

function centerOf(node) {
  return {
    x: node.offsetLeft + node.offsetWidth / 2,
    y: node.offsetTop + node.offsetHeight / 2,
  };
}

function curve(from, to) {
  const a = centerOf(from);
  const b = centerOf(to);
  const bend = Math.max(55, Math.abs(b.x - a.x) * 0.45);
  return `M ${a.x + from.offsetWidth / 2 - 8} ${a.y} C ${a.x + bend} ${a.y}, ${b.x - bend} ${b.y}, ${b.x - to.offsetWidth / 2 + 8} ${b.y}`;
}

function drawEdges() {
  if (!stage || !edgeLayer) return;
  edgeLayer.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
  const pairs = [[0,1],[0,2],[1,3],[2,3]];
  edgeLayer.innerHTML = pairs.map(([a,b]) => `<path d="${curve(nodes[a],nodes[b])}" />`).join('');
}

function selectNode(node) {
  nodes.forEach((item) => item.classList.toggle('selected', item === node));
  const data = nodeDetails[node.dataset.node];
  panel.innerHTML = `<p>PROPERTIES</p><h4>${data.title}</h4><label>Node type<input value="${data.type}" readonly></label><label>Variable<input value="${data.variable}" readonly></label><label>Required<span class="toggle ${data.required ? 'on' : ''}"></span></label>`;
}

nodes.forEach((node) => {
  node.addEventListener('click', () => selectNode(node));
  node.addEventListener('pointerdown', (event) => {
    if (!stage) return;
    selectNode(node);
    node.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, left: node.offsetLeft, top: node.offsetTop };
    const move = (moveEvent) => {
      const maxX = stage.clientWidth - node.offsetWidth;
      const maxY = stage.clientHeight - node.offsetHeight;
      node.style.left = `${Math.max(0, Math.min(maxX, start.left + moveEvent.clientX - start.x))}px`;
      node.style.top = `${Math.max(0, Math.min(maxY, start.top + moveEvent.clientY - start.y))}px`;
      drawEdges();
    };
    const up = () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerup', up);
  });
});

window.addEventListener('resize', drawEdges);
requestAnimationFrame(drawEdges);
