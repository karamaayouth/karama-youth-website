// API Base URL
const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentRoom = 'general';

// Socket.io Connection
const socket = io('http://localhost:3000');

// Load Activities
async function loadActivities() {
    try {
        const response = await fetch(`${API_URL}/activities`);
        const activities = await response.json();
        
        const container = document.getElementById('activities-list');
        container.innerHTML = activities.map(activity => `
            <div class="activity-card">
                <div class="activity-icon">${activity.icon}</div>
                <h3>${activity.title}</h3>
                <p>${activity.description}</p>
                <small>${new Date(activity.date).toLocaleDateString('ar-EG')}</small>
            </div>
        `).join('');
    } catch (err) {
        console.error('خطأ في تحميل الأنشطة:', err);
    }
}

// Load Team Members
async function loadTeam() {
    try {
        const response = await fetch(`${API_URL}/team`);
        const members = await response.json();
        
        const container = document.getElementById('team-list');
        container.innerHTML = members.map(member => `
            <div class="team-card">
                <div class="team-avatar">${member.avatar}</div>
                <h3>${member.name}</h3>
                <p>${member.position}</p>
            </div>
        `).join('');
    } catch (err) {
        console.error('خطأ في تحميل الفريق:', err);
    }
}

// Load Visitor Count
async function loadVisitorCount() {
    try {
        const response = await fetch(`${API_URL}/visitors/count`);
        const data = await response.json();
        document.getElementById('visitor-count').textContent = (data.totalVisitors || 1000) + '+';
    } catch (err) {
        console.error('خطأ في تحميل عدد الزوار:', err);
    }
}

// Open Login Modal
function openLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}

// Close Login Modal
function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

// Switch Between Tabs
function switchTab(tab) {
    const forms = document.querySelectorAll('.auth-form');
    const buttons = document.querySelectorAll('.tab-btn');
    
    forms.forEach(form => form.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`${tab}-form`).classList.add('active');
    event.target.classList.add('active');
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            closeLoginModal();
            alert('تم الدخول بنجاح!');
            showDashboard();
        } else {
            document.getElementById('login-error').textContent = data.message || 'فشل الدخول';
        }
    } catch (err) {
        document.getElementById('login-error').textContent = 'حدث خطأ: ' + err.message;
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            closeLoginModal();
            alert('تم التسجيل بنجاح!');
            showDashboard();
        } else {
            document.getElementById('register-error').textContent = data.message || 'فشل التسجيل';
        }
    } catch (err) {
        document.getElementById('register-error').textContent = 'حدث خطأ: ' + err.message;
    }
}

// Show Dashboard
function showDashboard() {
    document.getElementById('dashboard').style.display = 'flex';
    joinRoom(currentRoom);
}

// Join Chat Room
function joinRoom(room) {
    currentRoom = room;
    socket.emit('join-room', room);
    document.getElementById('messages').innerHTML = '';
}

// Send Message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (message) {
        socket.emit('send-message', {
            room: currentRoom,
            message: message,
            userId: token,
            senderName: 'أنت'
        });
        input.value = '';
    }
}

// Receive Message
socket.on('receive-message', (data) => {
    const messagesDiv = document.getElementById('messages');
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    messageEl.innerHTML = `
        <strong>${data.sender}:</strong> ${data.content}
        <small>${new Date().toLocaleTimeString('ar-EG')}</small>
    `;
    messagesDiv.appendChild(messageEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Logout
function logout() {
    token = null;
    localStorage.removeItem('token');
    document.getElementById('dashboard').style.display = 'none';
    alert('تم تسجيل الخروج بنجاح');
}

// Close Modal on Outside Click
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    loadActivities();
    loadTeam();
    loadVisitorCount();
    
    // Check if user is already logged in
    if (token) {
        showDashboard();
    }
    
    // Add event listeners
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    // Close button in modal
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.onclick = closeLoginModal;
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
