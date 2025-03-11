// Initialize simulation
let cache = [];
const cacheSize = 4;
const ram = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
let stats = { hits: 0, misses: 0, total: 0 };

// Particle background
const canvas = document.getElementById('particle-bg');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * 1.5 - 0.75;
        this.shape = Math.random() > 0.5 ? 'circle' : 'hex';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.015;
    }
    draw() {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.6)';
        ctx.beginPath();
        if (this.shape === 'circle') {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        } else {
            const r = this.size * 2;
            ctx.moveTo(this.x + r * Math.cos(0), this.y + r * Math.sin(0));
            for (let i = 1; i <= 6; i++) {
                ctx.lineTo(this.x + r * Math.cos(i * Math.PI / 3), this.y + r * Math.sin(i * Math.PI / 3));
            }
        }
        ctx.fill();
    }
}

let particles = [];
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < 150) particles.push(new Particle());
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].size <= 0.2) particles.splice(i, 1);
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();

// Main simulation logic
async function requestData() {
    const data = document.getElementById('dataInput').value.toUpperCase();
    const policy = document.getElementById('policy').value;

    if (!ram.includes(data)) {
        alert(`Error: Data ${data} not in RAM!`);
        return;
    }

    stats.total++;
    drawConnectionLines();
    if (cache.includes(data)) {
        stats.hits++;
        alert(`Cache Hit: Data ${data} found in cache!`);
        await animateCacheHit(data);
    } else {
        stats.misses++;
        alert(`Cache Miss: Data ${data} not found in cache. Fetching from RAM...`);
        if (cache.length >= cacheSize) {
            await evictData(policy);
        }
        await animateDataTransfer(data);
        cache.push(data);
    }

    updateVisualization();
    updateStats();
}

async function evictData(policy) {
    let evictedItem;
    if (policy === 'LRU') {
        evictedItem = cache.shift();
    } else if (policy === 'FIFO') {
        evictedItem = cache.pop();
    }
    
    const itemElement = document.querySelector(`#cache-content .data-item[data-value="${evictedItem}"]`);
    itemElement.classList.add('evicted');
    await new Promise(resolve => setTimeout(resolve, 800));
}

async function animateCacheHit(data) {
    const itemElement = document.querySelector(`#cache-content .data-item[data-value="${data}"]`);
    createDataFlow(itemElement, document.getElementById('cpu'));
    itemElement.classList.add('moving');
    await new Promise(resolve => setTimeout(resolve, 800));
    itemElement.classList.remove('moving');
    document.getElementById('cpu-content').innerHTML = `<div class="data-item hexagon">${data}</div>`;
}

async function animateDataTransfer(data) {
    const ramItem = document.querySelector(`#ram-content .data-item[data-value="${data}"]`);
    createDataFlow(ramItem, document.getElementById('cache'));
    ramItem.classList.add('moving');
    await new Promise(resolve => setTimeout(resolve, 800));
    ramItem.classList.remove('moving');
    document.getElementById('cpu-content').innerHTML = `<div class="data-item hexagon">${data}</div>`;
}

function createDataFlow(fromElement, toElement) {
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
        const flow = document.createElement('div');
        flow.className = 'data-flow';
        flow.style.left = `${fromRect.left + fromRect.width/2 + (Math.random() - 0.5) * 20}px`;
        flow.style.top = `${fromRect.top + fromRect.height/2 + (Math.random() - 0.5) * 20}px`;
        document.body.appendChild(flow);
        
        const dx = toRect.left + toRect.width/2 - (fromRect.left + fromRect.width/2);
        const dy = toRect.top + toRect.height/2 - (fromRect.top + fromRect.height/2);
        flow.animate([
            { transform: 'translate(0, 0) scale(1)' },
            { transform: `translate(${dx}px, ${dy}px) scale(0.5)` }
        ], {
            duration: 1200,
            easing: 'ease-out',
            delay: i * 100
        }).onfinish = () => flow.remove();
    }
}

function drawConnectionLines() {
    document.querySelectorAll('.connection-line').forEach(line => line.remove());
    const containers = ['cpu', 'cache', 'ram'];
    for (let i = 0; i < containers.length - 1; i++) {
        const from = document.getElementById(containers[i]).getBoundingClientRect();
        const to = document.getElementById(containers[i + 1]).getBoundingClientRect();
        const line = document.createElement('div');
        line.className = 'connection-line';
        const length = Math.sqrt(Math.pow(to.left - from.left, 2) + Math.pow(to.top - from.top, 2));
        const angle = Math.atan2(to.top - from.top, to.left - from.left) * 180 / Math.PI;
        line.style.width = `${length}px`;
        line.style.left = `${from.left + from.width/2}px`;
        line.style.top = `${from.top + from.height/2}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 0';
        document.body.appendChild(line);
    }
}

function updateVisualization() {
    const cacheContent = document.getElementById('cache-content');
    const ramContent = document.getElementById('ram-content');
    
    cacheContent.innerHTML = '';
    ramContent.innerHTML = '';
    
    ram.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `data-item ${index % 2 === 0 ? 'hexagon' : ''}`;
        div.textContent = item;
        div.dataset.value = item;
        ramContent.appendChild(div);
    });
    
    cache.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `data-item ${index % 2 === 0 ? 'hexagon' : ''}`;
        div.textContent = item;
        div.dataset.value = item;
        div.style.transitionDelay = `${index * 0.15}s`;
        cacheContent.appendChild(div);
    });
}

function updateStats() {
    const hitRate = (stats.hits / stats.total * 100).toFixed(1);
    const missRate = (stats.misses / stats.total * 100).toFixed(1);
    document.getElementById('hit-rate').textContent = `Hit Rate: ${hitRate}%`;
    document.getElementById('miss-rate').textContent = `Miss Rate: ${missRate}%`;
}

// Initial setup
updateVisualization();
updateStats();
drawConnectionLines();