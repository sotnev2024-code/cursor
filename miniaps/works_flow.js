// Раздел "Наши работы" для мини-приложения

const WORKS_FLOW_ITEMS = [
    {
        title: 'Окрашивание и укладка',
        description: 'Современное окрашивание и лёгкая волна.',
        image: 'https://images.pexels.com/photos/3993444/pexels-photo-3993444.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
        title: 'Маникюр',
        description: 'Аккуратный маникюр с нюдовым покрытием.',
        image: 'https://images.pexels.com/photos/3738341/pexels-photo-3738341.jpeg?auto=compress&cs=tinysrgb&w=800'
    },
    {
        title: 'Причёска для мероприятия',
        description: 'Собранная причёска для особого случая.',
        image: 'https://images.pexels.com/photos/3738345/pexels-photo-3738345.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
];

function renderWorksSection(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div id="works-flow-section" style="
            position: fixed;
            inset: 0;
            max-width: 500px;
            margin: 0 auto;
            background-color: #f9f9f9;
            padding: 20px;
            overflow-y: auto;
            z-index: 1000;
        ">
            <div class="section-title" style="justify-content: space-between; margin-bottom: 10px;">
                <span><i class="fas fa-images"></i> Наши работы</span>
                <button id="wf-close" style="
                    border: none;
                    background: transparent;
                    color: #7f8c8d;
                    font-size: 14px;
                    cursor: pointer;
                ">Закрыть</button>
            </div>

            <div id="wf-content"></div>
        </div>
    `;

    const content = document.getElementById('wf-content');
    if (!content) return;

    let html = '';
    WORKS_FLOW_ITEMS.forEach(item => {
        html += `
            <div class="info-section" style="padding:15px;margin-bottom:15px;">
                <div style="
                    border-radius:12px;
                    overflow:hidden;
                    margin-bottom:8px;
                    background:#eee;
                ">
                    <img src="${item.image}" alt="${item.title}" style="width:100%;display:block;object-fit:cover;max-height:220px;">
                </div>
                <h3 style="font-size:16px;margin-bottom:4px;">${item.title}</h3>
                <p style="font-size:13px;color:#666;margin:0;">${item.description}</p>
            </div>
        `;
    });

    content.innerHTML = html || '<p>Пока нет примеров работ</p>';

    const closeBtn = document.getElementById('wf-close');
    const section = document.getElementById('works-flow-section');
    if (closeBtn && section) {
        closeBtn.addEventListener('click', () => {
            section.remove();
        });
    }
}

// Публичная функция
function initWorksFlowSection(containerId) {
    renderWorksSection(containerId);
}


