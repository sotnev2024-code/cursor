/**
 * Модуль статистики
 */
class StatisticsModule {
    constructor(api, appState, notifications) {
        this.api = api;
        this.appState = appState;
        this.notifications = notifications;
        this.revenueChart = null;
        this.servicesChart = null;
        this.specialistsChart = null;
        this.currentPeriod = 'month';
    }

    /**
     * Рендерит HTML-разметку вкладки статистики
     */
    render() {
        const container = document.getElementById('statistics');
        if (!container) return;

        container.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0"><i class="bi bi-bar-chart"></i> Статистика</h5>
                                <div class="btn-group">
                                    <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'day' ? 'active' : ''}" 
                                            onclick="window.statisticsModule.setPeriod('day')">День</button>
                                    <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'week' ? 'active' : ''}" 
                                            onclick="window.statisticsModule.setPeriod('week')">Неделя</button>
                                    <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'month' ? 'active' : ''}" 
                                            onclick="window.statisticsModule.setPeriod('month')">Месяц</button>
                                    <button class="btn btn-sm btn-outline-primary ${this.currentPeriod === 'year' ? 'active' : ''}" 
                                            onclick="window.statisticsModule.setPeriod('year')">Год</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stat-card primary">
                        <div class="card-body text-center">
                            <h3 id="totalRevenue">0 ₽</h3>
                            <p class="mb-0">Общая выручка</p>
                            <small id="totalBookings">0 записей</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                        <div class="card-body text-center">
                            <h3 id="avgCheck">0 ₽</h3>
                            <p class="mb-0">Средний чек</p>
                            <small id="completedBookings">0 завершено</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
                        <div class="card-body text-center">
                            <h3 id="totalClients">0</h3>
                            <p class="mb-0">Уникальных клиентов</p>
                            <small id="newClients">0 новых</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;">
                        <div class="card-body text-center">
                            <h3 id="repeatRate">0%</h3>
                            <p class="mb-0">Повторные обращения</p>
                            <small id="repeatClients">0 клиентов</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-graph-up"></i> Выручка по месяцам</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="revenueChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-pie-chart"></i> Популярность услуг</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="servicesChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0"><i class="bi bi-people"></i> Статистика по специалистам</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="specialistsChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Отчеты</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-outline-primary" onclick="window.generateDailyReport()">
                                            <i class="bi bi-file-earmark-text"></i> Ежедневный отчет
                                        </button>
                                        <button class="btn btn-outline-success" onclick="window.generateMonthlyReport()">
                                            <i class="bi bi-file-earmark-bar-graph"></i> Ежемесячный отчет
                                        </button>
                                        <button class="btn btn-outline-warning" onclick="window.generateSpecialistReport()">
                                            <i class="bi bi-person-lines-fill"></i> Отчет по специалистам
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <div id="reportOutput" class="p-3 border rounded" style="min-height: 200px;">
                                        <p class="text-muted">Выберите тип отчета для генерации</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async load() {
        try {
            // Если контейнер пустой, сначала рендерим разметку
            const container = document.getElementById('statistics');
            if (container && !container.querySelector('.row')) {
                this.render();
            }

            const url = `${CONFIG.ENDPOINTS.STATISTICS}?period=${this.currentPeriod}`;
            const data = await this.api.get(url);
            if (data.success) {
                this.updateStats(data.data);
                await this.loadRevenueByMonth(data.data);
                this.renderCharts(data.data);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            this.notifications.error(error.message, 'Ошибка загрузки статистики');
        }
    }

    /**
     * Устанавливает период для статистики
     */
    setPeriod(period) {
        this.currentPeriod = period;
        this.load();
    }

    /**
     * Загружает данные о выручке по месяцам
     */
    async loadRevenueByMonth(baseData) {
        // Загружаем статистику за год для графика выручки по месяцам
        try {
            const yearData = await this.api.get(`${CONFIG.ENDPOINTS.STATISTICS}?period=year`);
            if (yearData.success && yearData.data) {
                // Получаем все записи за год для построения графика по месяцам
                const bookingsResult = await this.api.get(CONFIG.ENDPOINTS.BOOKINGS);
                if (bookingsResult.success && bookingsResult.data) {
                    const bookings = bookingsResult.data.filter(b => b.status === 'COMPLETED');
                    const revenueByMonth = this.calculateRevenueByMonth(bookings);
                    baseData.revenueByMonth = revenueByMonth;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки данных по месяцам:', error);
        }
    }

    /**
     * Вычисляет выручку по месяцам
     */
    calculateRevenueByMonth(bookings) {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const revenueByMonth = {};
        
        bookings.forEach(booking => {
            if (booking.date) {
                const date = new Date(booking.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = `${months[date.getMonth()]} ${date.getFullYear()}`;
                
                if (!revenueByMonth[monthKey]) {
                    revenueByMonth[monthKey] = {
                        month: monthLabel,
                        revenue: 0
                    };
                }
                revenueByMonth[monthKey].revenue += booking.price || 0;
            }
        });
        
        // Сортируем по ключу (дате) и возвращаем массив
        return Object.keys(revenueByMonth)
            .sort()
            .map(key => revenueByMonth[key])
            .slice(-12); // Последние 12 месяцев
    }

    updateStats(data) {
        const totalRevenue = document.getElementById('totalRevenue');
        const avgCheck = document.getElementById('avgCheck');
        const totalClients = document.getElementById('totalClients');
        const repeatRate = document.getElementById('repeatRate');
        const totalBookings = document.getElementById('totalBookings');
        const completedBookings = document.getElementById('completedBookings');
        const newClients = document.getElementById('newClients');
        const repeatClients = document.getElementById('repeatClients');

        // Форматируем выручку
        if (totalRevenue) {
            totalRevenue.textContent = this.formatCurrency(data.total_revenue || 0);
        }
        
        // Вычисляем средний чек
        const avgCheckValue = data.completed_bookings > 0 
            ? (data.total_revenue / data.completed_bookings) 
            : 0;
        if (avgCheck) {
            avgCheck.textContent = this.formatCurrency(avgCheckValue);
        }
        
        if (totalClients) {
            totalClients.textContent = data.total_clients || 0;
        }
        
        // Вычисляем процент повторных обращений
        // (клиенты с более чем одной записью)
        const repeatRateValue = data.total_clients > 0 
            ? Math.round((data.repeat_clients || 0) / data.total_clients * 100) 
            : 0;
        if (repeatRate) {
            repeatRate.textContent = repeatRateValue + '%';
        }
        
        if (totalBookings) {
            totalBookings.textContent = `${data.total_bookings || 0} записей`;
        }
        
        if (completedBookings) {
            completedBookings.textContent = `${data.completed_bookings || 0} завершено`;
        }
        
        if (newClients) {
            newClients.textContent = `${data.new_clients || 0} новых`;
        }
        
        if (repeatClients) {
            repeatClients.textContent = `${data.repeat_clients || 0} клиентов`;
        }
    }

    /**
     * Форматирует валюту
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    }

    renderCharts(data) {
        // График выручки по месяцам
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            if (this.revenueChart) {
                this.revenueChart.destroy();
            }
            
            const revenueData = data.revenueByMonth || [];
            if (revenueData.length > 0) {
                this.revenueChart = new Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: revenueData.map(m => m.month),
                        datasets: [{
                            label: 'Выручка (₽)',
                            data: revenueData.map(m => m.revenue),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: true
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        return `Выручка: ${this.formatCurrency(context.parsed.y)}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => {
                                        return this.formatCurrency(value);
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                revenueCtx.parentElement.innerHTML = '<p class="text-center text-muted">Нет данных для отображения</p>';
            }
        }

        // График популярности услуг
        const servicesCtx = document.getElementById('servicesChart');
        if (servicesCtx && data.services) {
            if (this.servicesChart) {
                this.servicesChart.destroy();
            }
            
            const servicesData = data.services.filter(s => s.bookings_count > 0).slice(0, 10);
            if (servicesData.length > 0) {
                this.servicesChart = new Chart(servicesCtx, {
                    type: 'bar',
                    data: {
                        labels: servicesData.map(s => s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name),
                        datasets: [{
                            label: 'Количество записей',
                            data: servicesData.map(s => s.bookings_count),
                            backgroundColor: 'rgba(54, 162, 235, 0.6)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: true
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            } else {
                servicesCtx.parentElement.innerHTML = '<p class="text-center text-muted">Нет данных для отображения</p>';
            }
        }

        // График по специалистам
        const specialistsCtx = document.getElementById('specialistsChart');
        if (specialistsCtx && data.specialists) {
            if (this.specialistsChart) {
                this.specialistsChart.destroy();
            }
            
            const specialistsData = data.specialists.filter(s => s.bookings_count > 0).slice(0, 10);
            if (specialistsData.length > 0) {
                this.specialistsChart = new Chart(specialistsCtx, {
                    type: 'bar',
                    data: {
                        labels: specialistsData.map(s => s.name),
                        datasets: [{
                            label: 'Количество записей',
                            data: specialistsData.map(s => s.bookings_count),
                            backgroundColor: 'rgba(255, 99, 132, 0.6)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        }, {
                            label: 'Выручка (₽)',
                            data: specialistsData.map(s => s.revenue),
                            backgroundColor: 'rgba(153, 102, 255, 0.6)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1,
                            yAxisID: 'y1',
                            type: 'line'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: true
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        if (context.datasetIndex === 0) {
                                            return `Записей: ${context.parsed.y}`;
                                        } else {
                                            return `Выручка: ${this.formatCurrency(context.parsed.y)}`;
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                beginAtZero: true
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                beginAtZero: true,
                                grid: {
                                    drawOnChartArea: false
                                },
                                ticks: {
                                    callback: (value) => {
                                        return this.formatCurrency(value);
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                specialistsCtx.parentElement.innerHTML = '<p class="text-center text-muted">Нет данных для отображения</p>';
            }
        }
    }

    async generateDailyReport() {
        const output = document.getElementById('reportOutput');
        if (!output) return;

        try {
            const data = await this.api.get(`${CONFIG.ENDPOINTS.STATISTICS}?period=day`);
            if (data.success) {
                const stats = data.data;
                const today = new Date().toLocaleDateString('ru-RU', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                });
                
                output.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Ежедневный отчет за ${today}</h6>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.statisticsModule.exportReport('daily')">
                            <i class="bi bi-download"></i> Экспорт
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <tr><td><strong>Всего записей:</strong></td><td>${stats.total_bookings || 0}</td></tr>
                            <tr><td><strong>Завершено:</strong></td><td>${stats.completed_bookings || 0}</td></tr>
                            <tr><td><strong>Выручка:</strong></td><td>${this.formatCurrency(stats.total_revenue || 0)}</td></tr>
                            <tr><td><strong>Уникальных клиентов:</strong></td><td>${stats.total_clients || 0}</td></tr>
                            <tr><td><strong>Средний чек:</strong></td><td>${this.formatCurrency(stats.completed_bookings > 0 ? (stats.total_revenue / stats.completed_bookings) : 0)}</td></tr>
                        </table>
                    </div>
                `;
            }
        } catch (error) {
            output.innerHTML = `<div class="alert alert-danger">Ошибка генерации отчета: ${error.message}</div>`;
        }
    }

    async generateMonthlyReport() {
        const output = document.getElementById('reportOutput');
        if (!output) return;

        try {
            const data = await this.api.get(`${CONFIG.ENDPOINTS.STATISTICS}?period=month`);
            if (data.success) {
                const stats = data.data;
                const month = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
                
                let servicesHtml = '';
                if (stats.services && stats.services.length > 0) {
                    servicesHtml = '<h6 class="mt-3">Топ услуг:</h6><ul class="list-group">';
                    stats.services.slice(0, 5).forEach(service => {
                        servicesHtml += `<li class="list-group-item d-flex justify-content-between">
                            <span>${escapeHtml(service.name)}</span>
                            <span><strong>${service.bookings_count}</strong> записей, ${this.formatCurrency(service.revenue)}</span>
                        </li>`;
                    });
                    servicesHtml += '</ul>';
                }
                
                output.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Ежемесячный отчет за ${month}</h6>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.statisticsModule.exportReport('monthly')">
                            <i class="bi bi-download"></i> Экспорт
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <tr><td><strong>Всего записей:</strong></td><td>${stats.total_bookings || 0}</td></tr>
                            <tr><td><strong>Завершено:</strong></td><td>${stats.completed_bookings || 0}</td></tr>
                            <tr><td><strong>Выручка:</strong></td><td>${this.formatCurrency(stats.total_revenue || 0)}</td></tr>
                            <tr><td><strong>Уникальных клиентов:</strong></td><td>${stats.total_clients || 0}</td></tr>
                            <tr><td><strong>Средний чек:</strong></td><td>${this.formatCurrency(stats.completed_bookings > 0 ? (stats.total_revenue / stats.completed_bookings) : 0)}</td></tr>
                        </table>
                    </div>
                    ${servicesHtml}
                `;
            }
        } catch (error) {
            output.innerHTML = `<div class="alert alert-danger">Ошибка генерации отчета: ${error.message}</div>`;
        }
    }

    async generateSpecialistReport() {
        const output = document.getElementById('reportOutput');
        if (!output) return;

        try {
            const data = await this.api.get(`${CONFIG.ENDPOINTS.STATISTICS}?period=month`);
            if (data.success) {
                const stats = data.data;
                
                let specialistsHtml = '';
                if (stats.specialists && stats.specialists.length > 0) {
                    specialistsHtml = '<h6 class="mt-3">Статистика по специалистам:</h6><div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>Специалист</th><th>Записей</th><th>Выручка</th><th>Средний чек</th></tr></thead><tbody>';
                    stats.specialists.forEach(specialist => {
                        const avgCheck = specialist.bookings_count > 0 
                            ? (specialist.revenue / specialist.bookings_count) 
                            : 0;
                        specialistsHtml += `<tr>
                            <td>${escapeHtml(specialist.name)}</td>
                            <td>${specialist.bookings_count}</td>
                            <td>${this.formatCurrency(specialist.revenue)}</td>
                            <td>${this.formatCurrency(avgCheck)}</td>
                        </tr>`;
                    });
                    specialistsHtml += '</tbody></table></div>';
                } else {
                    specialistsHtml = '<p class="text-muted">Нет данных по специалистам</p>';
                }
                
                output.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Отчет по специалистам</h6>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.statisticsModule.exportReport('specialists')">
                            <i class="bi bi-download"></i> Экспорт
                        </button>
                    </div>
                    ${specialistsHtml}
                `;
            }
        } catch (error) {
            output.innerHTML = `<div class="alert alert-danger">Ошибка генерации отчета: ${error.message}</div>`;
        }
    }

    /**
     * Экспортирует отчет
     */
    exportReport(type) {
        // Простой экспорт в текстовый формат
        const output = document.getElementById('reportOutput');
        if (!output) return;
        
        const content = output.innerText;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.notifications.success('Отчет экспортирован');
    }
}

