// Groups: list, create, join, group page (text/photo/voice posts), manage (admin), leave.
// Roles live in group_members.role ('admin' | 'member'); security is enforced by the SQL policies in groups-setup.sql.
(function () {
  const G = {
    en: {
      newroom: "New group",
      gname: "Group name",
      create: "Create",
      join: "Join",
      enter: "Enter",
      none: "No groups yet",
      members: "Members",
      manage: "Manage",
      cover: "Change cover",
      write: "Write something...",
      photo: "Photo",
      voice: "Voice",
      post: "Post",
      noposts: "No posts yet.",
      rec: "Record",
      stop: "Stop",
      leave: "Leave group",
      leave_q: "Leave this group?",
      admin_only: "Make another member admin before leaving.",
      rename: "Save name",
      del: "Delete group",
      del_q: "Delete this group for everyone?",
      remove: "Remove",
      mkadmin: "Make admin",
      admin: "Admin",
      member: "Member",
      nopost: "Write or attach something.",
      delp: "Delete",
      attached: "Attached ✓",
      uploading: "Uploading...",
    },
    bn: {
      newroom: "নতুন গ্রুপ",
      gname: "গ্রুপের নাম",
      create: "তৈরি করুন",
      join: "যুক্ত হোন",
      enter: "প্রবেশ",
      none: "এখনো কোনো গ্রুপ নেই",
      members: "সদস্য",
      manage: "ম্যানেজ",
      cover: "কভার বদলান",
      write: "কিছু লিখুন...",
      photo: "ছবি",
      voice: "ভয়েস",
      post: "পোস্ট",
      noposts: "এখনো কোনো পোস্ট নেই।",
      rec: "রেকর্ড",
      stop: "থামান",
      leave: "গ্রুপ ছাড়ুন",
      leave_q: "গ্রুপ ছেড়ে যাবেন?",
      admin_only: "ছাড়ার আগে অন্য কাউকে এডমিন বানান।",
      rename: "নাম সেভ করুন",
      del: "গ্রুপ মুছুন",
      del_q: "সবার জন্য গ্রুপটি মুছে ফেলবেন?",
      remove: "বের করুন",
      mkadmin: "এডমিন বানান",
      admin: "এডমিন",
      member: "সদস্য",
      nopost: "কিছু লিখুন বা সংযুক্ত করুন।",
      delp: "মুছুন",
      attached: "সংযুক্ত ✓",
      uploading: "আপলোড হচ্ছে...",
    },
  };
  const gx = (k) => (G[lang] || G.en)[k] || G.en[k] || k;
  const q = (id) => document.getElementById(id);
  const bg = (u) =>
    'url("' +
    String(u).replace(
      /["\\()\s']/g,
      (c) => "%" + c.charCodeAt(0).toString(16)
    ) +
    '")';
  const safe = (u, kind) =>
    u && (/^https?:\/\//.test(u) || u.startsWith("data:" + kind + "/"))
      ? esc(u)
      : "";
  const names = async (ids) => {
    const m = {};
    if (ids.length) {
      const { data } = await sb
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", ids);
      (data || []).forEach((p) => (m[p.id] = p));
    }
    return m;
  };
  const overlay = (id, z, html) => {
    const o = q(id);
    if (o) o.remove();
    const d = document.createElement("div");
    d.id = id;
    d.style.cssText =
      "position:fixed;inset:0;z-index:" +
      z +
      ";background:var(--bg);overflow-y:auto;color:var(--text)";
    d.innerHTML = html;
    document.body.appendChild(d);
    return d;
  };

  // ---------- list ----------
  window.loadGroupRooms = async function () {
    const list = q("group-rooms-list");
    if (!list) return;
    list.innerHTML = '<div class="empty">' + esc(t("loading")) + "</div>";
    const { data: rooms, error } = await sb
      .from("group_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      list.innerHTML = '<div class="empty">' + esc(error.message) + "</div>";
      return;
    }
    if (!rooms.length) {
      list.innerHTML = '<div class="empty">' + esc(gx("none")) + "</div>";
      return;
    }
    const { data: mine } = currentUser
      ? await sb
          .from("group_members")
          .select("group_id")
          .eq("user_id", currentUser.id)
      : { data: [] };
    const joined = new Set((mine || []).map((m) => m.group_id));
    list.innerHTML = rooms
      .map(
        (r) =>
          '<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:14px;margin-bottom:10px"><b>' +
          esc(r.name) +
          "</b>" +
          '<button class="btn" style="width:auto;padding:6px 14px" data-room="' +
          esc(r.id) +
          '" data-joined="' +
          (joined.has(r.id) ? 1 : 0) +
          '" type="button">' +
          esc(gx(joined.has(r.id) ? "enter" : "join")) +
          "</button></div>"
      )
      .join("");
  };
  q("group-rooms-list").onclick = async (e) => {
    const b = e.target.closest("[data-room]");
    if (!b) return;
    if (b.dataset.joined === "1") return openActiveGroupRoom(b.dataset.room);
    const { error } = await sb
      .from("group_members")
      .insert({
        group_id: Number(b.dataset.room),
        user_id: currentUser.id,
        role: "member",
      });
    if (error && error.code !== "23505") return toast(t("err") + error.message);
    openActiveGroupRoom(b.dataset.room);
  };

  // ---------- create ----------
  window.openCreateGroupRoomModal = function () {
    const o = overlay(
      "group-modal",
      1150,
      '<div style="max-width:420px;margin:60px auto;padding:20px"><h3>🎙️ ' +
        esc(gx("newroom")) +
        '</h3><div class="field"><input id="gr-name" maxlength="60" placeholder="' +
        esc(gx("gname")) +
        '"></div>' +
        '<button class="btn" id="gr-ok" type="button">' +
        esc(gx("create")) +
        '</button><button class="btn ghost" id="gr-x" type="button" style="margin-top:10px">' +
        esc(t("btn_cancel")) +
        "</button></div>"
    );
    q("gr-x").onclick = () => o.remove();
    q("gr-ok").onclick = async () => {
      const name = q("gr-name").value.trim();
      if (!name) return;
      q("gr-ok").disabled = true;
      const { data, error } = await sb
        .from("group_rooms")
        .insert({ name, creator_id: currentUser.id })
        .select()
        .single();
      if (error) {
        q("gr-ok").disabled = false;
        return toast(t("err") + error.message);
      }
      const m = await sb
        .from("group_members")
        .insert({ group_id: data.id, user_id: currentUser.id, role: "admin" });
      if (m.error) toast(t("err") + m.error.message);
      o.remove();
      loadGroupRooms();
      openActiveGroupRoom(data.id);
    };
  };
  q("btn-create-room").onclick = openCreateGroupRoomModal;

  // ---------- group page ----------
  window.openActiveGroupRoom = async function (rid) {
    const id = Number(rid);
    const [r1, r2] = await Promise.all([
      sb.from("group_rooms").select("*").eq("id", id).maybeSingle(),
      sb
        .from("group_members")
        .select("role")
        .eq("group_id", id)
        .eq("user_id", currentUser.id)
        .maybeSingle(),
    ]);
    const room = r1.data,
      me = r2.data;
    if (!room || !me)
      return toast(
        t("err") + (r1.error || r2.error || { message: "not a member" }).message
      );
    const admin = me.role === "admin";
    const o = overlay(
      "active-room-modal",
      1200,
      '<div id="rm-cover" style="position:relative;height:160px;background:linear-gradient(135deg,#2b3a55,#121826) center/cover"><button id="rm-back" type="button" style="position:absolute;top:12px;inset-inline-start:12px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff">←</button>' +
        (admin
          ? '<button id="rm-cover-btn" type="button" style="position:absolute;bottom:12px;inset-inline-end:12px;background:rgba(0,0,0,.7);color:#fff;padding:6px 12px;border-radius:8px;font-size:12px">📷 ' +
            esc(gx("cover")) +
            '</button><input type="file" id="rm-cover-file" accept="image/*" hidden>'
          : "") +
        "</div>" +
        '<div style="padding:16px;border-bottom:1px solid var(--line)"><h2 id="rm-title" style="margin:0 0 6px"></h2><div class="muted" style="font-size:13px;margin-bottom:12px">' +
        esc(gx(admin ? "admin" : "member")) +
        "</div>" +
        '<button class="btn" id="rm-manage" type="button" style="background:var(--surface2);color:var(--text)">' +
        (admin ? "⚙️ " + esc(gx("manage")) : esc(gx("leave"))) +
        "</button></div>" +
        '<div style="max-width:600px;margin:0 auto;padding:16px"><div class="card" style="padding:14px;margin-bottom:16px"><textarea id="gp-text" maxlength="1000" placeholder="' +
        esc(gx("write")) +
        '" style="width:100%;min-height:70px;padding:12px;border-radius:10px;background:var(--surface2);border:1px solid var(--line);color:var(--text);outline:none"></textarea>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><button class="btn ghost" id="gp-photo" type="button" style="width:auto;padding:6px 12px;font-size:13px">📷 ' +
        esc(gx("photo")) +
        '</button><input type="file" id="gp-file" accept="image/*" hidden>' +
        '<button class="btn ghost" id="gp-voice" type="button" style="width:auto;padding:6px 12px;font-size:13px">🎤 ' +
        esc(gx("voice")) +
        '</button><span id="gp-st" class="muted" style="flex:1;font-size:12px"></span><button class="btn" id="gp-post" type="button" style="width:auto;padding:6px 18px">' +
        esc(gx("post")) +
        "</button></div></div>" +
        '<div id="gp-feed"></div></div>'
    );
    q("rm-title").textContent = room.name;
    if (room.cover_url)
      q("rm-cover").style.backgroundImage = bg(room.cover_url);
    q("rm-back").onclick = () => {
      stopRec();
      o.remove();
      loadGroupRooms();
    };
    if (admin) {
      q("rm-cover-btn").onclick = () => q("rm-cover-file").click();
      q("rm-cover-file").onchange = async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        toast(gx("uploading"));
        try {
          const url = await uploadMedia(f, "grp-cover");
          const { error } = await sb
            .from("group_rooms")
            .update({ cover_url: url })
            .eq("id", id);
          if (error) throw error;
          q("rm-cover").style.backgroundImage = bg(url);
          toast(t("saved"));
        } catch (err) {
          toast(t("err") + err.message);
        }
      };
    }
    q("rm-manage").onclick = () => openManage(room, admin, o);

    // attachments
    let photo = null,
      voice = null,
      rec = null,
      stream = null,
      timer = null;
    const st = () => {
      q("gp-st").textContent = [
        photo ? "📷 " + gx("attached") : "",
        voice ? "🎤 " + gx("attached") : "",
      ]
        .filter(Boolean)
        .join(" ");
    };
    function stopRec() {
      if (rec && rec.state === "recording") rec.stop();
    }
    q("gp-photo").onclick = () => q("gp-file").click();
    q("gp-file").onchange = (e) => {
      photo = e.target.files[0] || null;
      st();
    };
    q("gp-voice").onclick = async () => {
      if (rec && rec.state === "recording") {
        rec.stop();
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        return toast(t("mic_err"));
      }
      const ch = [];
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (x) => ch.push(x.data);
      rec.onstop = () => {
        clearTimeout(timer);
        stream.getTracks().forEach((tr) => tr.stop());
        voice = new Blob(ch, { type: rec.mimeType || "audio/webm" });
        q("gp-voice").textContent = "🎤 " + gx("voice");
        st();
      };
      rec.start();
      q("gp-voice").textContent = "⏹ " + gx("stop");
      timer = setTimeout(stopRec, 120000);
    };
    q("gp-post").onclick = async () => {
      const text = q("gp-text").value.trim();
      if (!text && !photo && !voice) return toast(gx("nopost"));
      q("gp-post").disabled = true;
      q("gp-st").textContent = gx("uploading");
      try {
        const row = {
          group_id: id,
          user_id: currentUser.id,
          content: text,
          media_url: "",
          audio_url: "",
          status: "published",
        };
        if (photo) row.media_url = await uploadMedia(photo, "grp-img");
        if (voice) row.audio_url = await uploadMedia(voice, "grp-voice");
        const { error } = await sb.from("group_posts").insert(row);
        if (error) throw error;
        q("gp-text").value = "";
        photo = voice = null;
        q("gp-file").value = "";
        st();
        loadPosts();
      } catch (err) {
        toast(t("err") + err.message);
      }
      q("gp-post").disabled = false;
    };
    async function loadPosts() {
      const feed = q("gp-feed");
      if (!feed) return;
      const { data: posts, error } = await sb
        .from("group_posts")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        feed.innerHTML = '<div class="empty">' + esc(error.message) + "</div>";
        return;
      }
      if (!posts.length) {
        feed.innerHTML = '<div class="empty">' + esc(gx("noposts")) + "</div>";
        return;
      }
      const nm = await names([...new Set(posts.map((p) => p.user_id))]);
      feed.innerHTML = posts
        .map(
          (p) =>
            '<div class="card" style="padding:14px;margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><b data-profile-id="' +
            esc(p.user_id) +
            '" style="cursor:pointer">' +
            esc((nm[p.user_id] || {}).display_name || t("user")) +
            '</b><span class="muted">' +
            esc(timeAgo(p.created_at)) +
            "</span></div>" +
            (p.content
              ? '<p style="margin:0 0 10px;white-space:pre-wrap">' +
                esc(p.content) +
                "</p>"
              : "") +
            (safe(p.media_url, "image")
              ? '<img alt="" src="' +
                safe(p.media_url, "image") +
                '" style="width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin-bottom:8px">'
              : "") +
            (safe(p.audio_url, "audio")
              ? '<audio controls src="' +
                safe(p.audio_url, "audio") +
                '" style="width:100%"></audio>'
              : "") +
            (admin || p.user_id === currentUser.id
              ? '<button class="btn danger" data-delp="' +
                esc(p.id) +
                '" type="button" style="width:auto;padding:4px 12px;font-size:12px;margin-top:8px">' +
                esc(gx("delp")) +
                "</button>"
              : "") +
            "</div>"
        )
        .join("");
    }
    q("gp-feed").onclick = async (e) => {
      const b = e.target.closest("[data-delp]");
      if (!b) return;
      const { error } = await sb
        .from("group_posts")
        .delete()
        .eq("id", b.dataset.delp);
      if (error) toast(t("err") + error.message);
      loadPosts();
    };
    loadPosts();
  };

  // ---------- manage / leave ----------
  async function openManage(room, admin, roomOverlay) {
    const id = room.id,
      isOwner = room.creator_id === currentUser.id;
    const { data: ms } = await sb
      .from("group_members")
      .select("user_id,role")
      .eq("group_id", id);
    const nm = await names((ms || []).map((m) => m.user_id)),
      admins = (ms || []).filter((m) => m.role === "admin").length;
    const o = overlay(
      "group-manage",
      1300,
      '<div style="max-width:520px;margin:0 auto;padding:20px"><div style="display:flex;justify-content:space-between;align-items:center"><h3>⚙️ ' +
        esc(gx("manage")) +
        '</h3><button id="mg-x" type="button" style="font-size:20px">✕</button></div>' +
        (admin
          ? '<div class="field" style="display:flex;gap:8px"><input id="mg-name" maxlength="60" value="' +
            esc(room.name) +
            '" style="flex:1;min-width:0"><button class="btn" id="mg-save" type="button" style="width:auto">' +
            esc(gx("rename")) +
            "</button></div>"
          : "") +
        "<h4>" +
        esc(gx("members")) +
        " (" +
        (ms || []).length +
        ')</h4><div id="mg-list">' +
        (ms || [])
          .map(
            (m) =>
              '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)"><span>' +
              esc((nm[m.user_id] || {}).display_name || t("user")) +
              ' <small class="muted">' +
              esc(gx(m.role === "admin" ? "admin" : "member")) +
              "</small></span><span>" +
              (admin && m.user_id !== currentUser.id
                ? (m.role !== "admin"
                    ? '<button data-mk="' +
                      esc(m.user_id) +
                      '" type="button" class="btn ghost" style="width:auto;padding:4px 10px;font-size:12px">' +
                      esc(gx("mkadmin")) +
                      "</button> "
                    : "") +
                  '<button data-rm="' +
                  esc(m.user_id) +
                  '" type="button" class="btn danger" style="width:auto;padding:4px 10px;font-size:12px">' +
                  esc(gx("remove")) +
                  "</button>"
                : "") +
              "</span></div>"
          )
          .join("") +
        "</div>" +
        '<button class="btn danger" id="mg-leave" type="button" style="margin-top:18px">' +
        esc(gx("leave")) +
        "</button>" +
        (isOwner
          ? '<button class="btn danger" id="mg-del" type="button" style="margin-top:10px">' +
            esc(gx("del")) +
            "</button>"
          : "") +
        "</div>"
    );
    q("mg-x").onclick = () => o.remove();
    if (admin)
      q("mg-save").onclick = async () => {
        const name = q("mg-name").value.trim();
        if (!name) return;
        const { error } = await sb
          .from("group_rooms")
          .update({ name })
          .eq("id", id);
        if (error) return toast(t("err") + error.message);
        q("rm-title").textContent = name;
        toast(t("saved"));
      };
    q("mg-list").onclick = async (e) => {
      const rm = e.target.closest("[data-rm]"),
        mk = e.target.closest("[data-mk]");
      const r = rm
        ? await sb
            .from("group_members")
            .delete()
            .eq("group_id", id)
            .eq("user_id", rm.dataset.rm)
        : mk
        ? await sb
            .from("group_members")
            .update({ role: "admin" })
            .eq("group_id", id)
            .eq("user_id", mk.dataset.mk)
        : null;
      if (!r) return;
      if (r.error) return toast(t("err") + r.error.message);
      o.remove();
      openManage(room, admin, roomOverlay);
    };
    q("mg-leave").onclick = async () => {
      if (admin && admins <= 1 && (ms || []).length > 1)
        return toast(gx("admin_only"));
      if (!confirm(gx("leave_q"))) return;
      const { error } = await sb
        .from("group_members")
        .delete()
        .eq("group_id", id)
        .eq("user_id", currentUser.id);
      if (error) return toast(t("err") + error.message);
      o.remove();
      roomOverlay.remove();
      loadGroupRooms();
    };
    if (isOwner)
      q("mg-del").onclick = async () => {
        if (!confirm(gx("del_q"))) return;
        for (const [tb, col] of [
          ["group_posts", "group_id"],
          ["group_members", "group_id"],
          ["group_rooms", "id"],
        ]) {
          const { error } = await sb.from(tb).delete().eq(col, id);
          if (error) return toast(t("err") + error.message);
        }
        o.remove();
        roomOverlay.remove();
        loadGroupRooms();
      };
  }
})();
