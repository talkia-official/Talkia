// Talkia Advanced Suite Batch 4: Privacy Settings, Nested Personal Info & Profile Actions
console.log("Talkia Advanced Suite Batch 4 Loaded Correctly");

document.addEventListener('DOMContentLoaded', () => {
  const btnSettings = document.getElementById('btn-settings');
  if (btnSettings) btnSettings.onclick = (e) => { e.preventDefault(); if(typeof openSettingsModal === 'function') openSettingsModal(); };

  const btnVisitors = document.getElementById('btn-visitors');
  if (btnVisitors) btnVisitors.onclick = (e) => { 
    e.preventDefault(); 
    if(typeof openProfileVisitorsModal === 'function') openProfileVisitorsModal(); 
  };

  const btnSearch = document.getElementById('btn-search');
  if (btnSearch) btnSearch.onclick = (e) => { e.preventDefault(); const s = document.getElementById('search'); if (s) s.classList.remove('hidden'); };

  const btnInbox = document.getElementById('btn-inbox');
  if (btnInbox) btnInbox.onclick = (e) => { e.preventDefault(); if(typeof openInboxModal === 'function') openInboxModal(); };

  const btnBell = document.getElementById('btn-bell');
  if (btnBell) btnBell.onclick = (e) => { e.preventDefault(); if(typeof openNotificationsModal === 'function') openNotificationsModal(); };

  const btnCreateRoom = document.getElementById('btn-create-room');
  if (btnCreateRoom) btnCreateRoom.onclick = (e) => { e.preventDefault(); if(typeof openCreateGroupModal === 'function') openCreateGroupModal(); };
});

window.openCreateGroupModal = function() {
  const name = prompt(typeof t === 'function' ? t('g_room_name_lbl') : 'রুমের নাম লিখুন:');
  if (!name || !name.trim()) return;

  sb.from('group_rooms').insert({ name: name.trim(), creator_id: currentUser.id })
    .then(({ error }) => {
      if (error) {
        toast('গ্রুপ রুম তৈরি করা যায়নি');
      } else {
        toast(typeof t === 'function' ? t('g_success') : 'গ্রুপ রুম তৈরি হয়েছে!');
        if (typeof window.loadGroupRooms === 'function') window.loadGroupRooms();
      }
    });
};
