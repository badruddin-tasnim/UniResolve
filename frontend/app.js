// app.js
// Common Frontend Logic, API Injections & UI Interactions

// Helper to format badging
function getStatusBadge(status) {
    const labels = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'resolved': 'Resolved'
    };
    return `<span class="badge badge-${status || 'pending'}">${labels[status || 'pending']}</span>`;
}

// Format date
function formatDate(dateString) {
    if(!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

// Global Filter/Search state
let activeStatus = 'all';
let activeCategory = 'all';
let activeSearch = '';

// Apply filters on the complaints table (for both student and admin view)
function applyFilters() {
    const tbodyId = document.getElementById('admin-complaints-tbody') ? 'admin-complaints-tbody' : 'my-complaints-tbody';
    const rows = document.querySelectorAll(`#${tbodyId} tr`);
    rows.forEach(row => {
        const rowStatus = row.dataset.status || '';
        const rowCategory = row.dataset.category || '';
        const rowStudent = (row.dataset.student || '').toLowerCase();
        const titleEl = row.querySelector('.td-title');
        const rowTitle = titleEl ? titleEl.textContent.toLowerCase() : '';

        const matchStatus = activeStatus === 'all' || rowStatus === activeStatus;
        const matchCategory = activeCategory === 'all' || rowCategory === activeCategory;
        const matchSearch = activeSearch === '' || rowTitle.includes(activeSearch) || rowStudent.includes(activeSearch);

        row.style.display = (matchStatus && matchCategory && matchSearch) ? '' : 'none';
    });
}

// Filter by Status Tab click
window.filterComplaints = function(status, btn) {
    activeStatus = status;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    applyFilters();
};

// Filter by Category selector
window.filterByCategory = function(category) {
    activeCategory = category;
    applyFilters();
};

// Filter by Search input query
window.searchComplaints = function(query) {
    activeSearch = query.toLowerCase().trim();
    applyFilters();
};

// Toggle password visibility helper
window.togglePassword = function(fieldId, btn) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';

    btn.innerHTML = isHidden
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
           <line x1="1" y1="1" x2="23" y2="23"></line>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
           <circle cx="12" cy="12" r="3"></circle>
         </svg>`;
};

// Role picker for Login page
let currentRole = 'student';
window.selectRole = function(role) {
    currentRole = role;

    const studentBtn = document.getElementById('role-student');
    const adminBtn   = document.getElementById('role-admin');
    const roleInput  = document.getElementById('selected-role');
    const emailInput = document.getElementById('email');
    const authDivider = document.getElementById('auth-divider');
    const authRegisterLink = document.getElementById('auth-register-link');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    if (roleInput) roleInput.value = role;

    if (emailInput) {
        if (role === 'student') {
            emailInput.placeholder = 'student@university.edu';
        } else {
            emailInput.placeholder = 'Enter admin email here';
        }
    }

    if (authDivider) {
        authDivider.style.display = (role === 'student') ? 'flex' : 'none';
    }
    if (authRegisterLink) {
        authRegisterLink.style.display = (role === 'student') ? 'block' : 'none';
    }
    if (forgotPasswordLink) {
        forgotPasswordLink.style.display = (role === 'student') ? 'inline-block' : 'none';
    }


    if (studentBtn && adminBtn) {
        if (role === 'student') {
            studentBtn.style.background  = 'var(--bg-white)';
            studentBtn.style.color       = 'var(--primary)';
            studentBtn.style.boxShadow   = '0 1px 4px rgba(15,45,92,0.1)';
            adminBtn.style.background    = 'transparent';
            adminBtn.style.color         = 'var(--text-muted)';
            adminBtn.style.boxShadow     = 'none';
        } else {
            adminBtn.style.background    = 'var(--bg-white)';
            adminBtn.style.color         = 'var(--primary)';
            adminBtn.style.boxShadow     = '0 1px 4px rgba(15,45,92,0.1)';
            studentBtn.style.background  = 'transparent';
            studentBtn.style.color       = 'var(--text-muted)';
            studentBtn.style.boxShadow   = 'none';
        }
    }
};

// Admin status picker helper
window.setCurrentStatus = function(status) {
    const radio = document.getElementById('status-' + status);
    if (radio) {
        radio.checked = true;
        const commentBox = document.getElementById('comment-box');
        if (commentBox) {
            commentBox.style.display = (status === 'in_progress' || status === 'resolved') ? 'block' : 'none';
        }
    }

    const badge = document.getElementById('detail-status-badge');
    if (badge) {
        badge.className = 'badge badge-' + status;
        const labels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' };
        badge.textContent = labels[status] || status;
    }
};

// Timeline update helper
function updateTimeline(status) {
    const dotProgress = document.getElementById('dot-progress');
    const dotResolved = document.getElementById('dot-resolved');
    if (!dotProgress || !dotResolved) return;

    [dotProgress, dotResolved].forEach(d => {
        d.classList.remove('done', 'active');
    });

    if (status === 'pending') {
        dotProgress.classList.add('active');
    } else if (status === 'in_progress') {
        dotProgress.classList.add('done');
        dotProgress.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        dotResolved.classList.add('active');
    } else if (status === 'resolved') {
        [dotProgress, dotResolved].forEach(d => {
            d.classList.add('done');
            d.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        });
    }
}

// Admin dashboard breakdown bar updater
function updateBreakdown(pending, inProgress, resolved) {
    const total = pending + inProgress + resolved;
    if (total === 0) return;

    const pPct  = Math.round((pending    / total) * 100);
    const iPct  = Math.round((inProgress / total) * 100);
    const rPct  = Math.round((resolved   / total) * 100);

    const barPending = document.getElementById('bar-pending');
    const barInProgress = document.getElementById('bar-inprogress');
    const barResolved = document.getElementById('bar-resolved');

    if (barPending) barPending.style.width = pPct + '%';
    if (barInProgress) barInProgress.style.width = iPct + '%';
    if (barResolved) barResolved.style.width = rPct + '%';

    const lPendingCount = document.getElementById('legend-pending-count');
    const lPendingPct = document.getElementById('legend-pending-pct');
    const lProgressCount = document.getElementById('legend-progress-count');
    const lProgressPct = document.getElementById('legend-progress-pct');
    const lResolvedCount = document.getElementById('legend-resolved-count');
    const lResolvedPct = document.getElementById('legend-resolved-pct');

    if (lPendingCount) lPendingCount.textContent = pending;
    if (lPendingPct) lPendingPct.textContent = pPct + '%';
    if (lProgressCount) lProgressCount.textContent = inProgress;
    if (lProgressPct) lProgressPct.textContent = iPct + '%';
    if (lResolvedCount) lResolvedCount.textContent = resolved;
    if (lResolvedPct) lResolvedPct.textContent = rPct + '%';
}

// Toast helper
window.showToast = function(message, isError = false) {
    let toast = document.getElementById('toast');
    let toastMsg = document.getElementById('toast-msg');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        
        toastMsg = document.createElement('span');
        toastMsg.id = 'toast-msg';
        toast.appendChild(toastMsg);
        
        document.body.appendChild(toast);
    }
    
    if (isError) {
        toast.style.background = '#dc2626'; // Red for errors
    } else {
        toast.style.background = '#16a34a'; // Green for successes
    }
    
    toastMsg.textContent = message;
    toast.classList.add('show');
    
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }
    
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Protect Authenticated Routes ---
    const path = window.location.pathname;
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const storedName = localStorage.getItem('name') || 'User';
    
    const isPublicPage = path.endsWith('index.html') || path.endsWith('/') || 
                         path.endsWith('login.html') || path.endsWith('register.html') || 
                         path.endsWith('forgot-password.html') || path.endsWith('reset-password.html');
    
    if (!isPublicPage && !token) {
        showToast('You must log in to access this page.', true);
        window.location.href = 'login.html';
        return;
    }


    // Set user profile chips/names globally if elements exist
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarName) sidebarName.innerText = storedName;
    if (sidebarAvatar) {
        sidebarAvatar.innerText = storedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // --- My Complaints (Student) Table ---
    const myComplaintsTable = document.getElementById('my-complaints-tbody');
    if (myComplaintsTable) {
        try {
            const response = await fetch('/api/complaints', { headers });
            if (!response.ok) throw new Error('Failed to fetch complaints');
            
            const complaints = await response.json();
            
            // Set counts
            const countAll = document.getElementById('count-all');
            const countPending = document.getElementById('count-pending');
            const countInProgress = document.getElementById('count-in_progress');
            const countResolved = document.getElementById('count-resolved');

            if (countAll) countAll.innerText = complaints.length;
            if (countPending) countPending.innerText = complaints.filter(c => c.status === 'pending').length;
            if (countInProgress) countInProgress.innerText = complaints.filter(c => c.status === 'in_progress').length;
            if (countResolved) countResolved.innerText = complaints.filter(c => c.status === 'resolved').length;

            if (complaints.length === 0) {
                myComplaintsTable.innerHTML = `<tr class="empty-row"><td colspan="5">No complaints found.</td></tr>`;
            } else {
                myComplaintsTable.innerHTML = complaints.map(c => `
                    <tr data-status="${c.status}" data-category="${c.category}">
                        <td>
                            <p class="td-title">${c.title}</p>
                            <p class="td-meta">#CMP-00${c.id}</p>
                        </td>
                        <td><span class="category-chip">${c.category}</span></td>
                        <td>${getStatusBadge(c.status)}</td>
                        <td style="color:var(--text-muted); font-size:0.85rem;">${formatDate(c.date)}</td>
                        <td style="text-align:right;">
                            <a href="complaint-details.html?id=${c.id}" class="btn-table-action">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                View
                            </a>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.error(err);
            myComplaintsTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Failed to load complaints.</td></tr>`;
        }
    }

    // Update stats on Student Dashboard
    const totalStat = document.getElementById('stat-total');
    const pendingStat = document.getElementById('stat-pending');
    const inprogressStat = document.getElementById('stat-inprogress');
    const resolvedStat = document.getElementById('stat-resolved');
    
    if (totalStat || pendingStat || inprogressStat || resolvedStat) {
        try {
            const response = await fetch('/api/stats', { headers });
            if (response.ok) {
                const stats = await response.json();
                if (totalStat) totalStat.innerText = stats.total;
                if (pendingStat) pendingStat.innerText = stats.pending;
                if (inprogressStat) inprogressStat.innerText = stats.in_progress || 0;
                if (resolvedStat) resolvedStat.innerText = stats.resolved;
            }
        } catch (err) {
            console.error('Failed to load student stats:', err);
        }
    }

    // Load Recent Activity on Student Dashboard
    const recentActivityList = document.getElementById('recent-activity-list');
    if (recentActivityList) {
        try {
            const response = await fetch('/api/complaints', { headers });
            if (response.ok) {
                const complaints = await response.json();
                const recent = complaints.slice(0, 3);
                if (recent.length === 0) {
                    recentActivityList.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No recent activity.</div>`;
                } else {
                    recentActivityList.innerHTML = recent.map(c => `
                        <div class="activity-item">
                            <div class="activity-icon" style="${
                                c.status === 'pending' ? 'background:#fff7e6; color:#b45309;' : 
                                c.status === 'resolved' ? 'background:#f0fdf4; color:#15803d;' : ''
                            }">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <div class="activity-info">
                                <strong>${c.title}</strong>
                                <span>${c.category} · ${formatDate(c.date)}</span>
                            </div>
                            ${getStatusBadge(c.status)}
                        </div>
                    `).join('');
                }
            }
        } catch (err) {
            console.error('Failed to load recent activity:', err);
        }
    }

    // --- Admin Complaints Table ---
    const adminComplaintsTable = document.getElementById('admin-complaints-tbody');
    if (adminComplaintsTable) {
        try {
            const response = await fetch('/api/complaints', { headers });
            if (!response.ok) throw new Error('Failed to fetch complaints');
            
            const complaints = await response.json();
            
            const totalCount = document.getElementById('total-count');
            const countAll = document.getElementById('count-all');
            const countPending = document.getElementById('count-pending');
            const countInProgress = document.getElementById('count-in_progress');
            const countResolved = document.getElementById('count-resolved');

            if (totalCount) totalCount.innerText = complaints.length;
            if (countAll) countAll.innerText = complaints.length;
            if (countPending) countPending.innerText = complaints.filter(c => c.status === 'pending').length;
            if (countInProgress) countInProgress.innerText = complaints.filter(c => c.status === 'in_progress').length;
            if (countResolved) countResolved.innerText = complaints.filter(c => c.status === 'resolved').length;

            if (complaints.length === 0) {
                adminComplaintsTable.innerHTML = `<tr><td colspan="6" style="text-align:center">No complaints found.</td></tr>`;
            } else {
                adminComplaintsTable.innerHTML = complaints.map(c => {
                    const initials = (c.user || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return `
                        <tr data-status="${c.status}" data-category="${c.category}" data-student="${c.user || 'Unknown'}">
                            <td>
                                <p class="td-title">${c.title}</p>
                                <p class="td-meta">#CMP-00${c.id}</p>
                            </td>
                            <td>
                                <div class="student-chip">
                                    <div class="student-avatar">${initials}</div>
                                    <span class="student-name">${c.user || 'Unknown'}</span>
                                </div>
                            </td>
                            <td><span class="category-chip">${c.category}</span></td>
                            <td>${getStatusBadge(c.status)}</td>
                            <td style="font-size:0.85rem; color:var(--text-muted);">${formatDate(c.date)}</td>
                            <td style="text-align:right;">
                                <a href="admin-complaint-details.html?id=${c.id}" class="btn-table-action">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Review
                                </a>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        } catch (err) {
            console.error(err);
            adminComplaintsTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color: red;">Failed to load complaints.</td></tr>`;
        }
    }

    // Update stats and breakdowns on Admin Dashboard
    const aTotalStat = document.getElementById('admin-stat-total');
    const aPendingStat = document.getElementById('admin-stat-pending');
    const aProgressStat = document.getElementById('admin-stat-in_progress');
    const aResolvedStat = document.getElementById('admin-stat-resolved');
    const adminRecentTable = document.getElementById('admin-recent-tbody');
    
    if (aTotalStat || aPendingStat || aProgressStat || aResolvedStat || adminRecentTable) {
        try {
            const response = await fetch('/api/complaints', { headers });
            if (response.ok) {
                const complaints = await response.json();
                const pending = complaints.filter(c => c.status === 'pending').length;
                const inProgress = complaints.filter(c => c.status === 'in_progress').length;
                const resolved = complaints.filter(c => c.status === 'resolved').length;

                if (aTotalStat) aTotalStat.innerText = complaints.length;
                if (aPendingStat) aPendingStat.innerText = pending;
                if (aProgressStat) aProgressStat.innerText = inProgress;
                if (aResolvedStat) aResolvedStat.innerText = resolved;

                updateBreakdown(pending, inProgress, resolved);

                if (adminRecentTable) {
                    const recent = complaints.slice(0, 4);
                    if (recent.length === 0) {
                        adminRecentTable.innerHTML = `<tr><td colspan="5" style="text-align:center">No complaints found.</td></tr>`;
                    } else {
                        adminRecentTable.innerHTML = recent.map(c => `
                            <tr>
                                <td>
                                    <p class="td-title">${c.title}</p>
                                    <p class="td-meta">${c.category}</p>
                                </td>
                                <td style="font-size:0.875rem; color:var(--text-body);">${c.user || 'Unknown'}</td>
                                <td>${getStatusBadge(c.status)}</td>
                                <td style="font-size:0.85rem; color:var(--text-muted);">${formatDate(c.date)}</td>
                                <td style="text-align:right;">
                                    <a href="admin-complaint-details.html?id=${c.id}" class="btn-table-action">Review</a>
                                </td>
                            </tr>
                        `).join('');
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load admin stats & recent table:', err);
        }
    }

    // --- Complaint Details ---
    const detailTitle = document.getElementById('detail-title');
    if (detailTitle) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (!id) {
            detailTitle.innerText = "No complaint ID provided.";
        } else {
            try {
                const response = await fetch(`/api/complaints/${id}`, { headers });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to fetch details');
                }
                
                const complaint = await response.json();
                
                detailTitle.innerText = complaint.title;
                
                const detailStatusBadge = document.getElementById('detail-status-badge');
                if (detailStatusBadge) {
                    detailStatusBadge.className = 'badge badge-' + complaint.status;
                    detailStatusBadge.innerHTML = getStatusBadge(complaint.status);
                }

                const detailId = document.getElementById('detail-id');
                if (detailId) detailId.innerText = `#CMP-00${complaint.id}`;

                const detailUser = document.getElementById('detail-user');
                if (detailUser) detailUser.innerText = complaint.user || 'Unknown';

                const detailDate = document.getElementById('detail-date');
                if (detailDate) detailDate.innerText = formatDate(complaint.date);

                const detailCategory = document.getElementById('detail-category');
                if (detailCategory) detailCategory.innerText = complaint.category;

                const detailDescription = document.getElementById('detail-description');
                if (detailDescription) detailDescription.innerText = complaint.description || "No description provided.";

                // Populate Admin Comment for student view
                const adminCommentSection = document.getElementById('admin-comment-section');
                const adminCommentText = document.getElementById('admin-comment-text');
                if (adminCommentSection && adminCommentText) {
                    if (complaint.admin_comment && complaint.admin_comment.trim() !== '') {
                        adminCommentText.innerText = complaint.admin_comment;
                        adminCommentSection.style.display = 'block';
                    } else {
                        adminCommentSection.style.display = 'none';
                    }
                }

                // Pre-populate Admin Comment field in admin view
                const adminCommentInput = document.getElementById('admin-comment');
                if (adminCommentInput) {
                    adminCommentInput.value = complaint.admin_comment || '';
                }
                
                
                // Timeline and student details setups
                const timelineSubmitted = document.getElementById('timeline-submitted-date');
                if (timelineSubmitted) timelineSubmitted.innerText = formatDate(complaint.date);
                
                const timelineProgress = document.getElementById('timeline-progress-date');
                if (timelineProgress && (complaint.status === 'in_progress' || complaint.status === 'resolved')) {
                    timelineProgress.innerText = 'Actively reviewed';
                }

                const timelineResolved = document.getElementById('timeline-resolved-date');
                if (timelineResolved && complaint.status === 'resolved') {
                    timelineResolved.innerText = 'Resolved successfully';
                }

                updateTimeline(complaint.status);
                setCurrentStatus(complaint.status);

                // Admin Sidebar student details
                const studentAvatarInitials = document.getElementById('student-avatar-initials');
                if (studentAvatarInitials) {
                    studentAvatarInitials.innerText = (complaint.user || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                }

                const studentInfoName = document.getElementById('student-info-name');
                if (studentInfoName) studentInfoName.innerText = complaint.user || 'Unknown';

                const studentInfoEmail = document.getElementById('student-info-email');
                if (studentInfoEmail) studentInfoEmail.innerText = complaint.email || 'student@uni.edu';

                const studentInfoRoll = document.getElementById('student-info-roll');
                if (studentInfoRoll) studentInfoRoll.innerText = complaint.roll || '—';

                const studentInfoDate = document.getElementById('student-info-date');
                if (studentInfoDate) studentInfoDate.innerText = formatDate(complaint.date);

            } catch (err) {
                console.error(err);
                detailTitle.innerText = "Error loading details.";
            }
        }
    }

    // Update welcome message dynamically
    const welcomeUser = document.getElementById('welcome-username');
    if (welcomeUser) {
        welcomeUser.innerText = `Welcome back, ${storedName} 👋`;
    }

    // --- Dynamic Character Counters (Submit Complaint) ---
    const issueTitle = document.getElementById('issue-title');
    const issueDesc = document.getElementById('issue-desc');
    if (issueTitle) {
        issueTitle.addEventListener('input', function () {
            const count = document.getElementById('title-count');
            if (count) count.textContent = this.value.length;
        });
    }
    if (issueDesc) {
        issueDesc.addEventListener('input', function () {
            const count = document.getElementById('desc-count');
            if (count) count.textContent = this.value.length;
        });
    }

    // --- Admin comments text toggle on change ---
    const statusOptions = document.querySelectorAll('input[name="status"]');
    statusOptions.forEach(radio => {
        radio.addEventListener('change', function() {
            const commentBox = document.getElementById('comment-box');
            if (commentBox) {
                commentBox.style.display = (this.value === 'in_progress' || this.value === 'resolved') ? 'block' : 'none';
            }
        });
    });

    // --- Form Submissions ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    showToast(data.error || 'Login failed. Please try again.', true);
                    return;
                }
                
                // Store JWT token and user details in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.user.role);
                localStorage.setItem('name', data.user.name);
                localStorage.setItem('email', data.user.email);
                
                // Redirect based on role
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                console.error('Login error:', err);
                showToast('Connection error. Is the server running?', true);
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        // Dynamic password matching verification message UI hook
        const passInput    = document.getElementById('reg-password');
        const confirmInput = document.getElementById('confirm-password');
        const matchMsg     = document.getElementById('password-match-msg');

        if (confirmInput && passInput && matchMsg) {
            confirmInput.addEventListener('input', function () {
                if (confirmInput.value === '') {
                    matchMsg.style.display = 'none';
                    return;
                }
                if (confirmInput.value === passInput.value) {
                    matchMsg.textContent    = '✓ Passwords match';
                    matchMsg.style.color    = 'var(--status-resolved-text)';
                    matchMsg.style.display  = 'block';
                } else {
                    matchMsg.textContent    = '✗ Passwords do not match';
                    matchMsg.style.color    = '#dc2626';
                    matchMsg.style.display  = 'block';
                }
            });
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const roll = document.getElementById('roll').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                showToast('Passwords do not match.', true);
                return;
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, roll })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    showToast(data.error || 'Registration failed.', true);
                    return;
                }
                
                showToast('Account registered successfully! Please log in.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (err) {
                console.error('Registration error:', err);
                showToast('Connection error. Is the server running?', true);
            }
        });
    }

    const submitForm = document.getElementById('submit-complaint-form');
    if (submitForm) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('issue-title').value;
            const description = document.getElementById('issue-desc').value;
            
            // Get selected category radio button
            const selectedCategory = document.querySelector('input[name="category"]:checked');
            const category = selectedCategory ? selectedCategory.value : 'Other';
            
            try {
                const response = await fetch('/api/complaints', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ title, category, description })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    showToast(data.error || 'Submission failed.', true);
                    return;
                }
                
                showToast('Your complaint has been submitted successfully.');
                setTimeout(() => {
                    window.location.href = 'my-complaints.html';
                }, 1500);
            } catch (err) {
                console.error('Submit complaint error:', err);
                showToast('Connection error. Failed to submit.', true);
            }
        });
    }
    
    const adminUpdateForm = document.getElementById('admin-update-form');
    if (adminUpdateForm) {
        adminUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            
            const selectedStatusRadio = document.querySelector('input[name="status"]:checked');
            if (!selectedStatusRadio) {
                showToast('Please select a status first.');
                return;
            }
            const status = selectedStatusRadio.value;
            
            const commentEl = document.getElementById('admin-comment');
            const comment = commentEl ? commentEl.value.trim() : '';
            
            if (!id) {
                showToast('No complaint ID found.', true);
                return;
            }
            
            try {
                const response = await fetch(`/api/complaints/${id}/status`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ status, comment })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    showToast(data.error || 'Failed to update status.', true);
                    return;
                }
                
                const labels = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' };
                showToast('Status updated to "' + labels[status] + '" successfully!');
                
                // Delay redirect slightly so user sees the toast
                setTimeout(() => {
                    window.location.href = 'admin-complaints.html';
                }, 1000);
            } catch (err) {
                console.error('Update status error:', err);
                showToast('Connection error. Failed to update status.', true);
            }
        });
    }

    // --- Forgot Password Form Handler ---
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const roll = document.getElementById('roll').value;
            
            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, roll })
                });
                const data = await response.json();
                
                if (!response.ok) {
                    showToast(data.error || 'Password reset request failed.');
                    return;
                }
                
                showToast(data.message || 'Password reset link generated.');
                
                forgotPasswordForm.reset();


            } catch (err) {
                console.error('Forgot password error:', err);
                showToast('Connection error. Is the server running?');
            }
        });
    }


    // --- Reset Password Form Handler ---
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        // Parse token from query string
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        const tokenInput = document.getElementById('reset-token');
        if (tokenInput && token) {
            tokenInput.value = token;
        } else if (!token) {
            showToast('Reset token is missing from the link. Please request a new one.');
        }
        
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const resetTokenVal = document.getElementById('reset-token').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match.');
                return;
            }
            
            if (!resetTokenVal) {
                showToast('Reset token is missing. Please request a new link.');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: resetTokenVal, newPassword })
                });
                const data = await response.json();
                
                if (!response.ok) {
                    showToast(data.error || 'Password reset failed.');
                    return;
                }
                
                showToast(data.message || 'Password reset successfully!');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 3000);
            } catch (err) {
                console.error('Reset password error:', err);
                showToast('Connection error. Is the server running?');
            }
        });
    }
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    window.location.href = 'index.html';
}
