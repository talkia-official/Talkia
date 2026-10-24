// 4-language support: Bengali (default), English, Arabic (RTL), Hindi. Missing keys fall back to English.
const I18N = {
  bn: {
    tagline:'আওয়াজের ভুবন', login:'লগইন', signup:'সাইন আপ', name:'আপনার নাম', email:'ইমেইল', password:'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)',
    t_home:'হোম ফিড', t_prompt:'আজকের প্রশ্ন', t_groups:'গ্রুপ ভয়েস রুম', n_home:'হোম', n_prompt:'আজকের প্রশ্ন', n_record:'পোস্ট', n_groups:'গ্রুপ', n_profile:'আমি',
    answer_prompt:'উত্তর দিন', no_prompt:'আজকের প্রশ্ন উপলব্ধ নেই।', feed_empty:'এখনো কোনো পোস্ট নেই। প্রথম আওয়াজটি আপনার হোক!',
    language:'ভাষা', logout:'লগআউট', rec_title:'নতুন পোস্ট', close:'বন্ধ করুন', btn_back:'পিছনে যান', btn_cancel:'ক্যান্সেল',
    check_email:'আপনার ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্ট নিশ্চিত করুন।', loading:'লোড হচ্ছে...',
    sec:'সেকেন্ড', anon:'বেনামী', user:'ব্যবহারকারী',
    edit_profile:'প্রোফাইল এডিট', username:'ইউজারনেম (ইংরেজি অক্ষর, সংখ্যা, _)', bio:'আপনার সম্পর্কে', country:'দেশ', save:'সেভ করুন',
    saved:'সেভ হয়েছে', people:'আমার বন্ধু', recent:'সাম্প্রতিক সার্চ', clear:'মুছুন', posts_h:'পোস্ট', people_h:'মানুষ', search_ph:'নাম বা ইউজারনেম লিখে খুঁজুন', requests:'অনুরোধ', friends:'বন্ধুরা', blocked_list:'ব্লক করা', none_yet:'এখনো কেউ নেই', no_results:'কাউকে পাওয়া যায়নি',
    add_friend:'🤝 Add Friend', cancel_req:'অনুরোধ বাতিল', accept:'গ্রহণ করুন', decline:'প্রত্যাখ্যান', unfriend:'আনফ্রেন্ড', block:'ব্লক করুন', unblock:'আনব্লক করুন', report:'রিপোর্ট করুন', report_ask:'রিপোর্টের কারণ লিখুন', reported:'রিপোর্ট পাঠানো হয়েছে',
    avatar_change:'ছবি বদলান', settings:'সেটিংস', rec_start:'রেকর্ড শুরু করুন', rec_stop:'থামান', rec_again:'আবার রেকর্ড করুন', rec_post:'পোস্ট করুন', rec_cap:'ক্যাপশন বা আপনার পোস্ট...', anon_toggle:'বেনামে পোস্ট করুন', all:'সব', comments_h:'কমেন্ট', cm_ph:'কমেন্ট লিখুন...', send:'পাঠান', mic_err:'মাইক্রোফোন চালু করা যায়নি।', too_short:'কমপক্ষে ৩ সেকেন্ড রেকর্ড করুন।', too_big:'রেকর্ডিং বেশি বড়।', posted:'পোস্ট হয়েছে',
    c_BD:'বাংলাদেশ', c_IN:'ভারত', c_SA:'সৌদি', c_AE:'আমিরাত', c_GLOBAL:'বিশ্ব', l_bn:'বাংলা', l_en:'English', l_ar:'العربية', l_hi:'हिन्दी', search_btn:'খুঁজুন', min2:'কমপক্ষে ২টা অক্ষর লিখুন', uploading:'ছবি আপলোড হচ্ছে...', upload_fail:'ছবি আপলোড হয়নি: ', bad_username:'ইউজারনেম ৩-২০ অক্ষরের হতে হবে।', taken:'এই ইউজারনেম আগে থেকেই আছে।',
    cover_change:'📷 কভার ছবি', lbl_edu:'🎓 শিক্ষা:', lbl_rel:'💍 সম্পর্ক:', lbl_relig:'🕌 ধর্ম:', lbl_hobby:'🎨 শখ:', lbl_city:'📍 বর্তমান শহর:', not_added:'যোগ করা হয়নি', all_cats:'সকল ক্যাটাগরি', all_countries:'সকল দেশ', p_info:'Personal Information', privacy_pass:'Privacy Settings',
    posts_tab:'পোস্টসমূহ', photos_tab:'ফটো গ্যালারি', img_opts:'ছবির অপশন', view_large:'🔍 বড় করে দেখুন', chg_photo:'📷 ছবি পরিবর্তন করুন', no_img:'কোনো ছবি নেই',
    lbl_text:'লেখা', lbl_voice:'ভয়েস', lbl_image:'ছবি', post_ph:'আপনার মনে কি চলছে, তা এখানে লিখুন...',
    pv_title:'প্রোফাইল ভিজিটর', visited_at:'ভিজিট করেছেন: ', no_visitors:'আজ কেউ আপনার প্রোফাইল ভিজিট করেনি।',
    g_desc:'৫ থেকে ১০ জন একসাথে একটি গ্রুপ রুমে যুক্ত হয়ে লাইভ কথা বলতে পারেন।', g_create_btn:'+ নতুন রুম তৈরি করুন', g_title:'গ্রুপ ভয়েস রুম', g_modal_title:'নতুন গ্রুপ রুম', g_room_name_lbl:'রুমের নাম:', g_placeholder:'যেমন: আড্ডা ও আলোচনা', g_create:'তৈরি করুন', g_join:'যুক্ত হোন', g_empty:'বর্তমানে কোনো লাইভ রুম নেই।', g_success:'গ্রুপ রুম তৈরি হয়েছে!',
    inbox_title:'ইনবক্স ও চ্যাট', inbox_empty:'আপনার কোনো চ্যাট বা মেসেজ নেই। বন্ধুদের সাথে চ্যাট শুরু করুন!',
    notif_title:'নোটিফিকেশন', notif_empty:'আপনার কোনো নতুন নোটিফিকেশন নেই।',
    member_limit:'সদস্য সীমা: ১০ জন', chat_start:'💬 Inbox', room_joined:'গ্রুপ রুমে যুক্ত হয়েছেন (লাইভ ভয়েস চ্যাট)',
    room_created:'গ্রুপ রুম তৈরি হয়েছে!', req_already_sent:'আগে থেকেই রিকোয়েস্ট পাঠানো হয়েছে', req_sent:'ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে!',
    send_friend_req:'🤝 Add Friend', start_chat_hint:'• চ্যাট শুরু করুন',
    v_filter:'ভয়েস ফিল্টার', vf_normal:'Normal (স্বাভাবিক)', vf_deep:'Deep Voice (গম্ভীর)', vf_echo:'Echo (প্রতিধ্বনি)',
    time_just_now:'এই মাত্র', time_m_ago:' মিনিট আগে', time_h_ago:' ঘণ্টা আগে', time_d_ago:' দিন আগে', views_count:'জন দেখেছেন',
    del_post:'ডিলিট করুন', del_confirm:'পোস্টটি ডিলিট করতে চান?'
  },
  en: {
    tagline:'The Voice Universe', login:'Log in', signup:'Sign up', name:'Your name', email:'Email', password:'Password (min 6 characters)',
    t_home:'Home Feed', t_prompt:'Daily Prompt', t_groups:'Group Rooms', n_home:'Home', n_prompt:'Prompt', n_record:'Post', n_groups:'Groups', n_profile:'Me',
    answer_prompt:'Answer Prompt', no_prompt:"Today's prompt is not available.", feed_empty:'No posts yet. Be the first voice!',
    language:'Language', logout:'Log out', rec_title:'New Post', close:'Close', btn_back:'Back', btn_cancel:'Cancel',
    check_email:'Please confirm your account via email link.', loading:'Loading...',
    sec:'sec', anon:'Anonymous', user:'User',
    edit_profile:'Edit profile', username:'Username (a-z, 0-9, _)', bio:'About you', country:'Country', save:'Save changes',
    saved:'Saved', people:'My friends', recent:'Recent searches', clear:'Clear', posts_h:'Posts', people_h:'People', search_ph:'Search by name or username', requests:'Requests', friends:'Friends', blocked_list:'Blocked', none_yet:'Nobody yet', no_results:'No one found',
    add_friend:'🤝 Add Friend', cancel_req:'Cancel request', accept:'Accept', decline:'Decline', unfriend:'Unfriend', block:'Block', unblock:'Unblock', report:'Report', report_ask:'Why are you reporting?', reported:'Report sent',
    avatar_change:'Change photo', settings:'Settings', rec_start:'Start recording', rec_stop:'Stop', rec_again:'Record again', rec_post:'Post', rec_cap:'Caption or post details...', anon_toggle:'Post anonymously', all:'All', comments_h:'Comments', cm_ph:'Write a comment...', send:'Send', mic_err:'Could not use microphone.', too_short:'Record at least 3 seconds.', too_big:'Recording too large.', posted:'Posted',
    c_BD:'Bangladesh', c_IN:'India', c_SA:'Saudi Arabia', c_AE:'UAE', c_GLOBAL:'Global', l_bn:'বাংলা', l_en:'English', l_ar:'العربية', l_hi:'हिन्दी', search_btn:'Search', min2:'Type at least 2 characters', uploading:'Uploading photo...', upload_fail:'Upload failed: ', bad_username:'Username must be 3-20 chars.', taken:'Username taken.',
    cover_change:'📷 Cover Photo', lbl_edu:'🎓 Education:', lbl_rel:'💍 Relationship:', lbl_relig:'🕌 Religion:', lbl_hobby:'🎨 Hobbies:', lbl_city:'📍 Current City:', not_added:'Not added yet', all_cats:'All Categories', all_countries:'All Countries', p_info:'Personal Information', privacy_pass:'Privacy Settings',
    posts_tab:'Posts', photos_tab:'Photo Gallery', img_opts:'Photo Options', view_large:'🔍 View Large', chg_photo:'📷 Change Photo', no_img:'No image',
    lbl_text:'Text', lbl_voice:'Voice', lbl_image:'Image', post_ph:"What's on your mind...",
    pv_title:'Profile Visitors', visited_at:'Visited at: ', no_visitors:'No visitors today.',
    g_desc:'5 to 10 members can join a group room together to talk live.', g_create_btn:'+ Create New Room', g_title:'Group Voice Rooms', g_modal_title:'New Group Room', g_room_name_lbl:'Room Name:', g_placeholder:'e.g. Chill & Chat', g_create:'Create', g_join:'Join', g_empty:'No live rooms available.', g_success:'Group room created!',
    inbox_title:'Inbox & Chats', inbox_empty:'No chats or messages yet. Start chatting with friends!',
    notif_title:'Notifications', notif_empty:'No new notifications yet.',
    member_limit:'Member limit: 10', chat_start:'💬 Inbox', room_joined:'Joined group room (Live Voice Chat)',
    room_created:'Group room created!', req_already_sent:'Friend request already sent', req_sent:'Friend request sent!',
    send_friend_req:'🤝 Add Friend', start_chat_hint:'• Start chat',
    v_filter:'Voice Filter', vf_normal:'Normal', vf_deep:'Deep Voice', vf_echo:'Echo',
    time_just_now:'Just now', time_m_ago:'m ago', time_h_ago:'h ago', time_d_ago:'d ago', views_count:'views',
    del_post:'Delete', del_confirm:'Delete this post?'
  }
};

Object.assign(I18N.bn, { more:'আরও দেখুন', err:'সমস্যা: ', vf_chipmunk:'Chipmunk (চিকন)', vf_robot:'Robot (রোবট)', vf_slowed:'Slowed & Reverb', vf_denoise:'Noise Cancel', p_who_posts:'কে আপনার পোস্ট দেখবে', theme:'থিম (ডার্ক/লাইট)', export_data:'আমার ডেটা এক্সপোর্ট', phone:'ফোন নম্বর', privacy_comments:'কে কমেন্ট করতে পারবে', privacy_messages:'কে মেসেজ করতে পারবে', opt_everyone:'সবাই', opt_friends:'শুধু বন্ধু', opt_nobody:'কেউ না', show_online:'অনলাইন স্ট্যাটাস দেখান' });
Object.assign(I18N.en, { more:'Show more', err:'Problem: ', vf_chipmunk:'Chipmunk', vf_robot:'Robot', vf_slowed:'Slowed & Reverb', vf_denoise:'Noise Cancel', p_who_posts:'Who can see your posts', theme:'Theme (dark/light)', export_data:'Export my data', phone:'Phone number', privacy_comments:'Who can comment', privacy_messages:'Who can message you', opt_everyone:'Everyone', opt_friends:'Friends only', opt_nobody:'Nobody', show_online:'Show online status' });
I18N.ar = { tagline:'عالم الأصوات', login:'تسجيل الدخول', signup:'إنشاء حساب', name:'اسمك', email:'البريد الإلكتروني', password:'كلمة المرور (6 أحرف على الأقل)', t_home:'الرئيسية', t_prompt:'سؤال اليوم', t_groups:'غرف صوتية', n_home:'الرئيسية', n_prompt:'السؤال', n_record:'نشر', n_groups:'الغرف', n_profile:'أنا', language:'اللغة', logout:'تسجيل الخروج', rec_title:'منشور جديد', btn_back:'رجوع', btn_cancel:'إلغاء', loading:'جارٍ التحميل...', edit_profile:'تعديل الملف', people:'أصدقائي', settings:'الإعدادات', save:'حفظ', send:'إرسال', posts_tab:'المنشورات', photos_tab:'الصور', rec_start:'ابدأ التسجيل', rec_stop:'إيقاف', rec_post:'نشر', posted:'تم النشر', all_cats:'كل الفئات', all_countries:'كل الدول', none_yet:'لا أحد بعد', accept:'قبول', decline:'رفض', add_friend:'🤝 إضافة صديق', unfriend:'إلغاء الصداقة', unblock:'إلغاء الحظر', blocked_list:'المحظورون', requests:'الطلبات', friends:'الأصدقاء', search_btn:'بحث', search_ph:'ابحث بالاسم أو اسم المستخدم', comments_h:'التعليقات', cm_ph:'اكتب تعليقًا...', lbl_text:'نص', lbl_voice:'صوت', lbl_image:'صورة', anon_toggle:'النشر بشكل مجهول', anon:'مجهول', user:'مستخدم', g_create_btn:'+ غرفة جديدة', g_join:'انضم', inbox_title:'الرسائل', notif_title:'الإشعارات', not_added:'غير مضاف', views_count:'مشاهدة', time_just_now:'الآن', time_m_ago:' د', time_h_ago:' س', time_d_ago:' ي', feed_empty:'لا منشورات بعد. كن أول صوت!' };
I18N.hi = { tagline:'आवाज़ों की दुनिया', login:'लॉग इन', signup:'साइन अप', name:'आपका नाम', email:'ईमेल', password:'पासवर्ड (कम से कम 6 अक्षर)', t_home:'होम फ़ीड', t_prompt:'आज का सवाल', t_groups:'ग्रुप वॉइस रूम', n_home:'होम', n_prompt:'सवाल', n_record:'पोस्ट', n_groups:'ग्रुप', n_profile:'मैं', language:'भाषा', logout:'लॉग आउट', rec_title:'नई पोस्ट', btn_back:'वापस', btn_cancel:'रद्द करें', loading:'लोड हो रहा है...', edit_profile:'प्रोफ़ाइल एडिट', people:'मेरे दोस्त', settings:'सेटिंग्स', save:'सेव करें', send:'भेजें', posts_tab:'पोस्ट', photos_tab:'फ़ोटो गैलरी', rec_start:'रिकॉर्ड शुरू करें', rec_stop:'रोकें', rec_post:'पोस्ट करें', posted:'पोस्ट हो गया', all_cats:'सभी श्रेणियाँ', all_countries:'सभी देश', none_yet:'अभी कोई नहीं', accept:'स्वीकार', decline:'अस्वीकार', add_friend:'🤝 दोस्त जोड़ें', unfriend:'अनफ़्रेंड', unblock:'अनब्लॉक', blocked_list:'ब्लॉक किए गए', requests:'अनुरोध', friends:'दोस्त', search_btn:'खोजें', search_ph:'नाम या यूज़रनेम से खोजें', comments_h:'कमेंट', cm_ph:'कमेंट लिखें...', lbl_text:'लेख', lbl_voice:'आवाज़', lbl_image:'फ़ोटो', anon_toggle:'गुमनाम पोस्ट करें', anon:'गुमनाम', user:'उपयोगकर्ता', g_create_btn:'+ नया रूम', g_join:'जुड़ें', inbox_title:'इनबॉक्स', notif_title:'नोटिफ़िकेशन', not_added:'जोड़ा नहीं गया', views_count:'व्यू', time_just_now:'अभी', time_m_ago:' मिनट पहले', time_h_ago:' घंटे पहले', time_d_ago:' दिन पहले', feed_empty:'अभी कोई पोस्ट नहीं। पहली आवाज़ आपकी हो!' };
let lang = 'bn';
try { lang = localStorage.getItem('talkia_lang') || 'bn'; } catch(e) {}
if (!I18N[lang]) lang = 'bn';
const t = k => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
  if (currentUser) { renderProfile(); if (currentTab === 'prompt') loadPrompt(); if (currentTab === 'home') loadFeed(); }
}
function setLang(code) {
  lang = code;
  try { localStorage.setItem('talkia_lang', code); } catch(e) {}
  applyLang();
  populateFilterDropdowns();
}

function renderLangButtons() {
  document.querySelectorAll('[data-langs]').forEach(container => {
    container.innerHTML = ['bn', 'en', 'ar', 'hi'].map(l => `<button type="button" class="${lang === l ? 'on' : ''}" onclick="setLang('${l}')">${t('l_' + l)}</button>`).join('');
  });
}

