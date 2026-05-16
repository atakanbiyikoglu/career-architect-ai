let groupChart;
let deptChart;
let goalChart;

const ADMIN_PASSWORD_KEY = 'adminPassword';

function getAdminPassword() {
    let password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);

    if (!password) {
        password = prompt('Lütfen Admin Şifresini Girin:')?.trim() || '';
        if (password) {
            sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
        }
    }

    return password;
}

function clearAdminSession(message) {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    if (message) {
        alert(message);
    }
    location.reload();
}

function buildAdminHeaders() {
    const password = getAdminPassword();
    if (!password) {
        throw new Error('Admin şifresi gerekli.');
    }

    return {
        'x-admin-password': password
    };
}

function toPieData(mapObj) {
    const labels = Object.keys(mapObj || {});
    const values = labels.map((k) => mapObj[k]);
    return { labels, values };
}

function renderCharts(data) {
    const groupCtx = document.getElementById('groupChart');
    const deptCtx = document.getElementById('deptChart');
    const goalCtx = document.getElementById('goalChart');

    if (groupChart) groupChart.destroy();
    if (deptChart) deptChart.destroy();
    if (goalChart) goalChart.destroy();

    groupChart = new Chart(groupCtx, {
        type: 'bar',
        data: {
            labels: ['Grup A (AI Destekli)', 'Grup B (Kural Tabanli)'],
            datasets: [{
                label: 'Ortalama Memnuniyet',
                data: [data.satisfactionByGroup.A.average, data.satisfactionByGroup.B.average],
                backgroundColor: ['#2563eb', '#10b981']
            }]
        },
        options: { responsive: true, scales: { y: { beginAtZero: true, max: 5 } } }
    });

    const dept = toPieData(data.demographics.department);
    deptChart = new Chart(deptCtx, {
        type: 'pie',
        data: { labels: dept.labels, datasets: [{ data: dept.values }] },
        options: { responsive: true }
    });

    const goals = toPieData(data.demographics.goal);
    goalChart = new Chart(goalCtx, {
        type: 'doughnut',
        data: { labels: goals.labels, datasets: [{ data: goals.values }] },
        options: { responsive: true }
    });
}

async function fetchMetrics() {
    const headers = buildAdminHeaders();

    const response = await fetch('/api/admin/metrics', { headers });
    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401) {
            clearAdminSession('Hatalı şifre');
            return null;
        }
        throw new Error(data.error || 'Metrikler alinamadi.');
    }

    return data;
}

async function refreshDashboard() {
    try {
        const data = await fetchMetrics();
        if (!data) {
            return;
        }
        document.getElementById('kpi-participants').textContent = data.totals.participants;
        document.getElementById('kpi-feedback').textContent = data.totals.feedbackCount;
        renderCharts(data);
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById('refresh-btn').addEventListener('click', refreshDashboard);
refreshDashboard();

// CSV download handler
document.getElementById('download-csv').addEventListener('click', async () => {
    try {
        const headers = buildAdminHeaders();
        const resp = await fetch('/api/admin/export-csv', { headers });
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            if (resp.status === 401) {
                clearAdminSession('Hatalı şifre');
                return;
            }
            throw new Error(err.error || 'CSV indirilemedi.');
        }

        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kariyer_mimari_veri_seti.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        if (e.message === 'Admin şifresi gerekli.') {
            clearAdminSession('Admin şifresi gerekli.');
            return;
        }
        alert(e.message);
    }
});
