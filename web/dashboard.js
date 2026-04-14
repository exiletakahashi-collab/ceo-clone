/**
 * 管理ダッシュボードUI
 */

async function loadStats() {
  try {
    const res = await fetch('/api/dashboard/stats');
    const data = await res.json();
    document.getElementById('totalLeads').textContent = data.totalLeads;
    document.getElementById('hotLeads').textContent = data.hotLeads;
    document.getElementById('todayLeads').textContent = data.todayLeads;
    document.getElementById('totalMessages').textContent = data.totalMessages;
    document.getElementById('lineLeads').textContent = data.lineLeads;
    document.getElementById('webLeads').textContent = data.webLeads;
  } catch (err) {
    console.error('Stats error:', err);
  }
}

async function loadLeads() {
  try {
    const res = await fetch('/api/dashboard/leads');
    const data = await res.json();
    const tbody = document.getElementById('leadsBody');

    if (!data.leads || data.leads.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-light);padding:40px;">リードはまだありません。チャットでテストしてみてください。</td></tr>';
      return;
    }

    tbody.innerHTML = data.leads.map(lead => {
      const scoreLabel = lead.score >= 80 ? 'hot' : lead.score >= 60 ? 'warm' : lead.score >= 30 ? 'cool' : 'cold';
      const scoreLabelText = lead.score >= 80 ? 'HOT' : lead.score >= 60 ? 'WARM' : lead.score >= 30 ? 'COOL' : 'COLD';
      const barColor = lead.score >= 80 ? 'var(--hot)' : lead.score >= 60 ? 'var(--warning)' : lead.score >= 30 ? 'var(--cool)' : '#ccc';
      // SQLiteの日付形式 "2026-04-15 12:34:56" をパース
      const rawDate = lead.created_at || lead.createdAt || '';
      const dateStr = rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T');
      const d = new Date(dateStr);
      const date = isNaN(d.getTime()) ? rawDate.slice(5, 16) : d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `<tr style="cursor:pointer" onclick="showConversation('${lead.id}')">
        <td>${lead.display_name || lead.company || '(未取得)'}</td>
        <td>${lead.industry || '-'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lead.pain_points || '-'}</td>
        <td>
          <span class="badge ${scoreLabel}">${scoreLabelText}</span> ${lead.score}
          <div class="score-bar"><div class="score-bar-fill" style="width:${lead.score}%;background:${barColor}"></div></div>
        </td>
        <td>${lead.status}</td>
        <td><span class="badge ${lead.channel}">${lead.channel.toUpperCase()}</span></td>
        <td>${date}</td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('Leads error:', err);
  }
}

async function showConversation(leadId) {
  try {
    const res = await fetch(`/api/dashboard/leads/${leadId}`);
    const data = await res.json();
    const lead = data.lead;

    document.getElementById('modalTitle').textContent =
      `${lead.display_name || lead.company || 'リード'} の会話ログ`;

    const logDiv = document.getElementById('convLog');
    const allMessages = lead.sessions.flatMap(s => s.messages);

    if (allMessages.length === 0) {
      logDiv.innerHTML = '<p style="color:var(--text-light)">会話はまだありません</p>';
    } else {
      logDiv.innerHTML = allMessages.map(m =>
        `<div class="msg ${m.role}">${m.content}</div>`
      ).join('');
    }

    document.getElementById('modal').classList.add('active');
  } catch (err) {
    console.error('Conversation error:', err);
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// 初期化
loadStats();
loadLeads();

// 30秒ごとに自動更新
setInterval(() => { loadStats(); loadLeads(); }, 30000);
