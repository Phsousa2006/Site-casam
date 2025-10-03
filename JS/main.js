// main.js - Versão ATUALIZADA FINAL para BUSCA POR _ID

// --- Configurações da API ---
const API_BASE_URL = 'https://cha-panela-api.onrender.com/api/v1/gifts';
const WEDDING_ID = 'noiva-noivo-teste-1'; // ID do casamento que inserimos no MongoDB Atlas

let gifts = []; // A lista de presentes atual, carregada do servidor
let currentGiftIndex = -1;

// Configuração do formatador de moeda (BRL)
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
});

// --- Funções Comuns (Load/Save/Format) ---

// FUNÇÃO DE CARREGAMENTO AGORA LÊ DA API
async function loadGifts() {
    try {
        const response = await fetch(`${API_BASE_URL}/${WEDDING_ID}`);
        
        if (!response.ok) {
             throw new Error(`Erro ao carregar dados do casamento. Status: ${response.status}`);
        }
        
        const serverData = await response.json();
        
        if (serverData && serverData.gifts) {
            gifts = serverData.gifts;
        } else {
             gifts = [];
        }

    } catch (error) {
        console.error("Erro ao carregar lista de presentes do servidor:", error);
        alert("Não foi possível carregar a lista de presentes. Verifique o servidor.");
        gifts = []; 
    }
}

// Formata o telefone (DD) 99999-9999
function formatPhoneNumber(value) {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, ''); 
    const length = phoneNumber.length;

    if (length <= 2) return `(${phoneNumber.substring(0, 2)}`;
    if (length <= 7) return `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 7)}`;
    if (length <= 11) {
        return `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 7)}-${phoneNumber.substring(7, 11)}`;
    }
    return `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 3)} ${phoneNumber.substring(3, 7)}-${phoneNumber.substring(7, 11)}`;
}

// Formata o valor como moeda
function formatCurrencyInput(value) {
    if (!value) return '';
    
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 0) return '';
    
    cleanValue = cleanValue.padStart(3, '0');

    const cents = parseInt(cleanValue);
    return currencyFormatter.format(cents / 100).replace('R$', '').trim();
}

// --- Lógica Específica para Convidados (index.html) ---

function renderGifts(giftsToRender = gifts) {
    if (document.getElementById('giftsGrid') === null) return;

    const giftsGrid = document.getElementById('giftsGrid');
    giftsGrid.innerHTML = '';

    giftsToRender.forEach((gift, index) => {
        const originalIndex = index; 
        const isGroupGift = gift.isGroupGift;
        
        let cardClass = isGroupGift ? 'group-gift' : '';
        const giftCard = document.createElement('div');
        giftCard.setAttribute('data-index', originalIndex);

        if (isGroupGift) {
            const isCompleted = gift.currentAmount >= gift.maxAmount;
            if (isCompleted) cardClass += ' selected';
            
            const percentage = Math.min(100, (gift.currentAmount / gift.maxAmount) * 100);
            const buttonDisabled = isCompleted ? 'disabled' : '';
            const buttonText = isCompleted ? 'Meta Atingida' : 'CONTRIBUIR AGORA';
            const contributorsCount = gift.contributions ? gift.contributions.length : 0;

            let statusHtml = `
                <div class="gift-status ${isCompleted ? 'status-completed' : 'status-available'}">
                    ${isCompleted ? '⭐ Concluído!' : '✅ Contribua!'}
                </div>
            `;
            
            let progressHtml = `
                <div class="group-gift-details">
                    <div style="text-align: center; margin-bottom: 10px;">
                        Meta: ${currencyFormatter.format(gift.maxAmount)}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <div class="progress-text">
                        <span>${currencyFormatter.format(gift.currentAmount).replace('R$', 'R$ ')}</span>
                        <span>${percentage.toFixed(0)}%</span>
                    </div>
                </div>
                <div class="selected-by">
                    ${contributorsCount > 0 ? `${contributorsCount} contribuiç(ões)` : 'Seja o primeiro a ajudar!'}
                </div>
            `;

            giftCard.innerHTML = `
                <div class="gift-icon">${gift.icon}</div>
                <h3 class="gift-name">${gift.name}</h3>
                ${statusHtml}
                ${progressHtml}
                <button class="gift-button" onclick="selectGift(${originalIndex})" ${buttonDisabled}>
                    ${buttonText}
                </button>
            `;

        } else {
            // Lógica para presente individual
            const buttonDisabled = gift.selected ? 'disabled' : '';
            const buttonText = gift.selected ? 'Indisponível' : 'ESCOLHER PRESENTE';
            const statusClass = gift.selected ? 'status-taken' : 'status-available';

            let statusHtml = `
                <div class="gift-status ${statusClass}">
                    ${gift.selected ? '<i class="fas fa-times"></i> Reservado' : '✅ Disponível'}
                </div>
            `;
            
            let detailsHtml = `<div class="selected-by">Reservado: ${gift.selected ? 'Sim' : 'Não'}</div>`;
                
            giftCard.innerHTML = `
                <div class="gift-icon">${gift.icon}</div>
                <h3 class="gift-name">${gift.name}</h3>
                ${statusHtml}
                ${detailsHtml}
                <button class="gift-button" onclick="selectGift(${originalIndex})" ${buttonDisabled}>
                    ${buttonText}
                </button>
            `;

            if (gift.selected) cardClass += ' selected';
        }

        giftCard.className = `gift-card ${cardClass}`; 
        giftsGrid.appendChild(giftCard);
    });

    updateStats();
    setTimeout(checkVisibility, 50); 
}

function updateStats() {
    if (document.getElementById('totalGifts') === null) return;

    const total = gifts.length;
    
    const availableCount = gifts.filter(g => 
        (g.isGroupGift && g.currentAmount < g.maxAmount) || (!g.isGroupGift && !g.selected)
    ).length;

    const reservedCount = gifts.filter(g => 
        g.isGroupGift || g.selected
    ).length;

    document.getElementById('totalGifts').textContent = total;
    document.getElementById('availableGifts').textContent = availableCount;
    document.getElementById('selectedGifts').textContent = reservedCount; 
}

window.selectGift = function(index) {
    const gift = gifts[index];
    const isGroupGift = gift.isGroupGift;
    const modal = document.getElementById('confirmModal');
    const valueInputGroup = document.getElementById('valueInputGroup');
    const confirmButtonText = document.getElementById('confirmButtonText');
    
    if (!isGroupGift && gift.selected) return;
    
    currentGiftIndex = index;
    document.getElementById('selectedGiftName').textContent = gift.name;
    
    document.getElementById('guestName').value = '';
    document.getElementById('guestPhone').value = '';
    document.getElementById('contributionValue').value = '';

    if (isGroupGift) {
        valueInputGroup.style.display = 'block';
        confirmButtonText.textContent = 'Contribuir';
        setTimeout(() => document.getElementById('contributionValue').focus(), 350);
    } else {
        valueInputGroup.style.display = 'none';
        confirmButtonText.textContent = 'Reservar Agora';
        setTimeout(() => document.getElementById('guestName').focus(), 350);
    }
    
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
}

window.closeModal = function() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        currentGiftIndex = -1;
    }, 300);
}

// FUNÇÃO ATUALIZADA PARA CHAMAR A API - ENVIA O _ID
window.confirmSelection = async function() {
    const gift = gifts[currentGiftIndex];
    const isGroupGift = gift.isGroupGift;
    
    const guestName = document.getElementById('guestName').value.trim();
    const guestPhone = document.getElementById('guestPhone').value.trim();
    const rawPhone = guestPhone.replace(/\D/g, ''); 
    
    if (!guestName || guestName.length < 2) {
        alert('❗ Por favor, digite seu nome completo!');
        return;
    }
    
    if (rawPhone.length < 10) {
        alert('❗ Por favor, digite um número de telefone/WhatsApp válido com DDD (mínimo 10 dígitos)!');
        return;
    }

    // Lógica de validação do valor
    let contributionValue = 0;
    if (isGroupGift) {
        const valueInput = document.getElementById('contributionValue').value;
        const cleanValue = valueInput.replace(/\D/g, '');
        contributionValue = parseInt(cleanValue) / 100;

        if (contributionValue <= 0 || isNaN(contributionValue)) {
            alert('❗ Por favor, digite um valor de contribuição válido.');
            return;
        }
        
        // Validação no Frontend:
        if (gift.currentAmount + contributionValue > gift.maxAmount) {
            const diff = gift.maxAmount - gift.currentAmount;
            alert(`❗ O valor máximo restante é de ${currencyFormatter.format(diff)}. Sua contribuição excede o necessário.`);
            return;
        }
    }
    
    // Preparação da Requisição para a API
    let endpoint = '';
    let method = 'POST';
    let body = {
        // AGORA ENVIAMOS O ID ÚNICO DO MONGO, ELIMINANDO O ERRO DE CARACTERE NO NOME
        giftId: gift._id, 
        guestName: guestName,
        phone: guestPhone,
    };

    if (isGroupGift) {
        endpoint = `/contribute/${WEDDING_ID}`;
        body.amount = contributionValue; // Valor em moeda (Ex: 100.00)
    } else {
        endpoint = `/reserve/${WEDDING_ID}`;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Falha na comunicação com o servidor.');
        }

        // Se o salvamento for bem-sucedido, recarrega a lista do servidor
        await loadGifts(); 
        
        if (isGroupGift) {
            alert(`🎉 Contribuição de ${currencyFormatter.format(contributionValue)} reservada com sucesso, ${guestName.split(' ')[0]}!`);
        } else {
            alert(`🎉 Reservado com sucesso, ${guestName.split(' ')[0]}!`);
        }

        closeModal();

    } catch (e) {
        console.error('Erro de Reserva/Contribuição:', e.message);
        alert(`Ocorreu um erro: ${e.message}.`);
    }
}

function checkVisibility() {
    const cards = document.querySelectorAll('.gift-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < (window.innerHeight - 100) && rect.bottom > 0; 
        if (isVisible) {
            card.classList.add('show');
        } else {
             card.classList.remove('show'); 
        }
    });
}


// --- Lógica Específica para Admin (admin.html) ---

async function renderAdminPanel() {
    if (document.getElementById('adminGiftList') === null) return; 
    
    // Primeiro, carrega os dados do servidor
    await loadGifts(); 
    
    const adminGiftList = document.getElementById('adminGiftList');
    adminGiftList.innerHTML = '';
    let totalAmount = 0;

    gifts.forEach((gift, index) => {
        const isGroupGift = gift.isGroupGift;
        
        // Critério de exibição no Admin: Se está reservado ou recebeu contribuição
        if ((!isGroupGift && !gift.selected) || (isGroupGift && (gift.contributions === undefined || gift.contributions.length === 0))) {
            return; 
        }

        const giftItem = document.createElement('div');
        giftItem.className = 'gift-item';

        // --- Header ---
        const headerHtml = `
            <div class="gift-header">
                <span class="gift-name-admin">${gift.icon} ${gift.name}</span>
                <span class="gift-type ${isGroupGift ? 'type-group' : 'type-individual'}">
                    ${isGroupGift ? 'VAQUINHA (AJUDA)' : 'PRESENTE INDIVIDUAL'}
                </span>
            </div>
        `;

        // --- Content (Individual Gift) ---
        let contentHtml = '';
        if (!isGroupGift) {
            // Usamos gift._id para a função de cancelamento no admin
            contentHtml = `
                <div class="details-grid">
                    <div class="detail-item"><strong>Reservado Por:</strong> ${gift.selectedBy}</div>
                    <div class="detail-item"><strong>WhatsApp:</strong> ${gift.phone}</div>
                </div>
                <button class="action-button cancel-button" onclick="cancelIndividualGift('${gift._id}')">
                    <i class="fas fa-trash"></i> Cancelar Reserva
                </button>
            `;
        } else {
            // --- Content (Group Gift/Vaquinha) ---
            totalAmount += gift.currentAmount || 0;
            const percentage = Math.min(100, ((gift.currentAmount || 0) / gift.maxAmount) * 100);

            // Garante que contributions não é nulo antes de mapear
            const contributionsHtml = (gift.contributions || []).map((contribution, cIndex) => `
                <div class="contribution-item">
                    <div class="contributor-info">
                        <span class="contributor-name">${contribution.name}</span>
                        <span class="contributor-phone">${contribution.phone}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <strong style="color: var(--color-success);">${currencyFormatter.format(contribution.amount)}</strong>
                        <button class="action-button remove-contribution" onclick="removeContribution('${gift.name}', '${contribution.name}')">
                            Remover
                        </button>
                    </div>
                </div>
            `).join('');
            
            contentHtml = `
                <div class="details-grid">
                    <div class="detail-item"><strong>Meta:</strong> ${currencyFormatter.format(gift.maxAmount)}</div>
                    <div class="detail-item"><strong>Arrecadado:</strong> ${currencyFormatter.format(gift.currentAmount || 0)}</div>
                    <div class="detail-item"><strong>Contribuições:</strong> ${(gift.contributions || []).length}</div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
                <div class="progress-text">
                    <span>Faltam: ${currencyFormatter.format(gift.maxAmount - (gift.currentAmount || 0))}</span>
                    <span>${percentage.toFixed(0)}% Concluído</span>
                </div>

                <div class="contributions-list">
                    <h4>Lista de Contribuições:</h4>
                    ${contributionsHtml.length > 0 ? contributionsHtml : '<p style="font-style: italic; color: var(--color-text-light);">Nenhuma contribuição registrada.</p>'}
                </div>
            `;
        }

        giftItem.innerHTML = headerHtml + contentHtml;
        adminGiftList.appendChild(giftItem);
    });
    
    updateStatsAdmin(totalAmount);
}

function updateStatsAdmin(totalAmount) {
    if (document.getElementById('totalGifts') === null) return; 
    
    const total = gifts.length;
    
    const availableCount = gifts.filter(g => 
        (g.isGroupGift && (g.currentAmount || 0) < g.maxAmount) || (!g.isGroupGift && !g.selected)
    ).length;

    const reservedCount = gifts.filter(g => 
        g.isGroupGift || g.selected
    ).length;

    document.getElementById('totalGifts').textContent = total;
    document.getElementById('availableGifts').textContent = availableCount;
    document.getElementById('selectedGifts').textContent = reservedCount;
    document.getElementById('totalContributions').textContent = currencyFormatter.format(totalAmount);
}

// Função Admin: Cancelar reserva de presente individual (CHAMA DELETE) - USA _ID
window.cancelIndividualGift = async function(giftId) {
    
    if (!confirm(`Tem certeza que deseja cancelar a reserva?`)) {
        return;
    }
    
    try {
        // Envia o ID para o Backend
        const response = await fetch(`${API_BASE_URL}/reserve/${WEDDING_ID}/${giftId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Falha ao cancelar reserva.');
        }

        alert(`✅ Reserva cancelada com sucesso.`);
        renderAdminPanel();

    } catch (e) {
        console.error('Erro ao cancelar reserva:', e.message);
        alert(`Ocorreu um erro: ${e.message}.`);
    }
}

// Função Admin: Remover contribuição de vaquinha (CHAMA DELETE) - Mantém nome para Contribuição
window.removeContribution = async function(giftName, contributorName) {
    // Certifica-se que os nomes enviados são limpos
    const cleanGiftName = giftName.trim();
    const cleanContributorName = contributorName.trim();
    
    if (!confirm(`Tem certeza que deseja remover a contribuição de "${cleanContributorName}" para "${cleanGiftName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/contribute/${WEDDING_ID}/${cleanGiftName}/${cleanContributorName}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Falha ao remover contribuição.');
        }

        alert(`✅ Contribuição de "${cleanContributorName}" removida com sucesso.`);
        renderAdminPanel();

    } catch (e) {
        console.error('Erro ao remover contribuição:', e.message);
        alert(`Ocorreu um erro: ${e.message}.`);
    }
}


// --- Inicialização (Determina qual função chamar) ---
document.addEventListener('DOMContentLoaded', async function() {
    
    // 1. Carrega os dados (Agora feito por loadGifts dentro de renderGifts/renderAdminPanel)
    
    // 2. Adiciona event listeners para formatação (Comuns)
    const guestPhoneInput = document.getElementById('guestPhone');
    const contributionValueInput = document.getElementById('contributionValue');

    if (guestPhoneInput) {
        guestPhoneInput.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }

    if (contributionValueInput) {
        contributionValueInput.addEventListener('input', function(e) {
            const cursorPosition = e.target.selectionStart;
            const oldValue = e.target.value;
            
            e.target.value = formatCurrencyInput(e.target.value);

            const newCursorPosition = cursorPosition + (e.target.value.length - oldValue.length);
            e.target.setSelectionRange(newCursorPosition, newCursorPosition);
        });
    }
    
    // 3. Inicializa a UI correta baseado no elemento presente no DOM
    
    // Se for a página Admin:
    if (document.getElementById('adminGiftList')) {
        renderAdminPanel(); // Chamada para renderizar o Admin (inclui o loadGifts)
    } 
    // Se for a página do Convite:
    else if (document.getElementById('giftsGrid')) {
        await loadGifts(); // Carrega os dados do servidor antes de renderizar
        renderGifts();
        
        // Adiciona listeners de UI e teclado APENAS na página do convidado
        window.addEventListener('scroll', checkVisibility);
        window.addEventListener('resize', checkVisibility);

        if (document.getElementById('confirmModal')) {
             document.getElementById('guestName').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') document.getElementById('guestPhone').focus();
            });
            document.getElementById('guestPhone').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (gifts[currentGiftIndex].isGroupGift) {
                        document.getElementById('contributionValue').focus();
                    } else {
                        confirmSelection();
                    }
                }
            });
            document.getElementById('contributionValue').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') confirmSelection();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && document.getElementById('confirmModal').style.display === 'block') closeModal();
            });
            window.addEventListener('click', (e) => {
                if (e.target === document.getElementById('confirmModal')) closeModal();
            });
        }
    }
});