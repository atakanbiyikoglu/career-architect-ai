let groupChart;
let deptChart;
let goalChart;

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
    const token = document.getElementById('admin-token').value.trim();
    const headers = token ? { 'x-admin-token': token } : {};

    const response = await fetch('/api/admin/metrics', { headers });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Metrikler alinamadi.');
    }

    return data;
}

async function refreshDashboard() {
    try {
        const data = await fetchMetrics();
        document.getElementById('kpi-participants').textContent = data.totals.participants;
        document.getElementById('kpi-feedback').textContent = data.totals.feedbackCount;
        renderCharts(data);
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById('refresh-btn').addEventListener('click', refreshDashboard);
refreshDashboard();
