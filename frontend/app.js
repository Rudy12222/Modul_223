const TOKEN_KEY = "minitwitter_token";
const USER_KEY = "minitwitter_user";
const API_BASE = "/api";

const state = {
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    currentUser: readStoredUser(),
    feedPosts: [],
    userCache: new Map()
};

const elements = {
    authView: document.getElementById("auth-view"),
    appView: document.getElementById("app-view"),
    messageBox: document.getElementById("message-box"),
    statusUser: document.getElementById("status-user"),
    accountHandle: document.getElementById("account-handle"),
    accountRole: document.getElementById("account-role"),
    accountState: document.getElementById("account-state"),
    accountAvatar: document.getElementById("account-avatar"),
    composerAvatar: document.getElementById("composer-avatar"),
    summaryAvatar: document.getElementById("summary-avatar"),
    summaryName: document.getElementById("summary-name"),
    summaryHandle: document.getElementById("summary-handle"),
    summaryRole: document.getElementById("summary-role"),
    summaryState: document.getElementById("summary-state"),
    summaryPostCount: document.getElementById("summary-post-count"),
    summaryCommentCount: document.getElementById("summary-comment-count"),
    profileAvatar: document.getElementById("profile-avatar"),
    profileBannerName: document.getElementById("profile-banner-name"),
    profileBannerHandle: document.getElementById("profile-banner-handle"),
    profileRoleLabel: document.getElementById("profile-role-label"),
    profileStateLabel: document.getElementById("profile-state-label"),
    profilePostCount: document.getElementById("profile-post-count"),
    profileCommentCount: document.getElementById("profile-comment-count"),
    adminNavButton: document.getElementById("admin-nav-button"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    profileForm: document.getElementById("profile-form"),
    postForm: document.getElementById("post-form"),
    logoutButton: document.getElementById("logout-button"),
    reloadFeedButton: document.getElementById("reload-feed-button"),
    reloadAdminButton: document.getElementById("reload-admin-button"),
    feedList: document.getElementById("feed-list"),
    activityPosts: document.getElementById("activity-posts"),
    activityComments: document.getElementById("activity-comments"),
    adminUsers: document.getElementById("admin-users"),
    profileUsername: document.getElementById("profile-username"),
    profilePassword: document.getElementById("profile-password"),
    navButtons: Array.from(document.querySelectorAll("[data-view-target]")),
    sections: {
        feed: document.getElementById("feed-section"),
        profile: document.getElementById("profile-section"),
        admin: document.getElementById("admin-section")
    }
};

document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    initialize().catch(handleError);
});

function bindEvents() {
    elements.loginForm.addEventListener("submit", onLogin);
    elements.registerForm.addEventListener("submit", onRegister);
    elements.postForm.addEventListener("submit", onCreatePost);
    elements.profileForm.addEventListener("submit", onSaveProfile);
    elements.logoutButton.addEventListener("click", logout);
    elements.reloadFeedButton.addEventListener("click", () => loadFeed().catch(handleError));
    elements.reloadAdminButton.addEventListener("click", () => loadAdminUsers().catch(handleError));
    elements.feedList.addEventListener("click", onFeedClick);
    elements.feedList.addEventListener("submit", onFeedSubmit);
    elements.adminUsers.addEventListener("click", onAdminClick);

    for (const button of elements.navButtons) {
        button.addEventListener("click", () => {
            const viewName = button.dataset.viewTarget;

            if (viewName) {
                switchView(viewName);
            }
        });
    }
}

async function initialize() {
    if (!state.token || !state.currentUser) {
        showAuthView();
        return;
    }

    try {
        const { user } = await apiRequest(`/users/${state.currentUser.id}`);
        saveSession(state.token, user);
        showAppView();
        await loadInitialData();
    } catch {
        clearSession();
        showAuthView();
        showMessage("Bitte erneut einloggen.", "error");
    }
}

async function onRegister(event) {
    event.preventDefault();

    const formData = new FormData(elements.registerForm);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await apiRequest("/auth/register", {
        method: "POST",
        body: { username, password },
        auth: false
    });

    elements.registerForm.reset();
    elements.loginForm.querySelector("[name='username']").value = username;
    showMessage(result.message ?? "Registrierung erfolgreich. Bitte einloggen.", "success");
}

async function onLogin(event) {
    event.preventDefault();

    const formData = new FormData(elements.loginForm);
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await apiRequest("/auth/login", {
        method: "POST",
        body: { username, password },
        auth: false
    });

    saveSession(result.token, result.user);
    elements.loginForm.reset();
    showAppView();
    await loadInitialData();
    showMessage("Login erfolgreich.", "success");
}

async function onCreatePost(event) {
    event.preventDefault();

    const formData = new FormData(elements.postForm);
    const content = String(formData.get("content") ?? "");

    const result = await apiRequest("/posts", {
        method: "POST",
        body: { content }
    });

    elements.postForm.reset();
    showMessage(result.message ?? "Beitrag erstellt.", "success");
    await loadFeed();
}

async function onSaveProfile(event) {
    event.preventDefault();

    const formData = new FormData(elements.profileForm);
    const username = String(formData.get("username") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "").trim();

    const result = await apiRequest(`/users/${state.currentUser.id}/profile`, {
        method: "PATCH",
        body: {
            username,
            newPassword: newPassword || undefined
        }
    });

    saveSession(state.token, result.user);
    elements.profilePassword.value = "";
    showMessage(result.message ?? "Profil gespeichert.", "success");
    await loadProfile();
    await loadFeed();
}

async function onFeedClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const postId = Number(button.dataset.postId);
    const commentId = Number(button.dataset.commentId);

    if (action === "edit-post") {
        const post = findPost(postId);
        const content = prompt("Beitrag bearbeiten", post?.content ?? "");

        if (content !== null) {
            await apiRequest(`/posts/${postId}`, { method: "PATCH", body: { content } });
            showMessage("Beitrag aktualisiert.", "success");
            await loadFeed();
        }
    }

    if (action === "delete-post" && confirm("Möchtest du diesen Beitrag wirklich löschen?")) {
        await apiRequest(`/posts/${postId}`, { method: "DELETE" });
        showMessage("Beitrag gelöscht.", "success");
        await loadFeed();
    }

    if (action === "like" || action === "dislike") {
        await apiRequest("/reactions", {
            method: "POST",
            body: { type: action === "like" ? "LIKE" : "DISLIKE", postId }
        });
        await loadFeed();
    }

    if (action === "edit-comment") {
        const comment = findComment(commentId);
        const content = prompt("Kommentar bearbeiten", comment?.content ?? "");

        if (content !== null) {
            await apiRequest(`/comments/${commentId}`, { method: "PATCH", body: { content } });
            showMessage("Kommentar aktualisiert.", "success");
            await loadFeed();
        }
    }

    if (action === "delete-comment" && confirm("Möchtest du diesen Kommentar wirklich löschen?")) {
        await apiRequest(`/comments/${commentId}`, { method: "DELETE" });
        showMessage("Kommentar gelöscht.", "success");
        await loadFeed();
    }
}

async function onFeedSubmit(event) {
    const form = event.target.closest(".comment-form");

    if (!form) {
        return;
    }

    event.preventDefault();

    const formData = new FormData(form);
    const content = String(formData.get("content") ?? "");
    const postId = Number(form.dataset.postId);

    await apiRequest("/comments", {
        method: "POST",
        body: { content, postId }
    });

    showMessage("Kommentar erstellt.", "success");
    await loadFeed();
}

async function onAdminClick(event) {
    const button = event.target.closest("button[data-admin-action]");

    if (!button) {
        return;
    }

    const action = button.dataset.adminAction;
    const userId = Number(button.dataset.userId);

    if (action === "block") {
        await apiRequest(`/users/${userId}/block`, { method: "PATCH" });
        showMessage("Benutzer gesperrt.", "success");
        await loadAdminUsers();
    }

    if (action === "unblock") {
        await apiRequest(`/users/${userId}/unblock`, { method: "PATCH" });
        showMessage("Benutzer entsperrt.", "success");
        await loadAdminUsers();
    }
}

function showAuthView() {
    elements.authView.classList.remove("hidden");
    elements.appView.classList.add("hidden");
    updateUserUI();
}

function showAppView() {
    elements.authView.classList.add("hidden");
    elements.appView.classList.remove("hidden");
    updateUserUI();
    updateAdminVisibility();
}

function switchView(viewName) {
    for (const [name, section] of Object.entries(elements.sections)) {
        section.classList.toggle("hidden", name !== viewName);
    }

    for (const button of elements.navButtons) {
        button.classList.toggle("active", button.dataset.viewTarget === viewName);
    }

    if (viewName === "profile") {
        loadProfile().catch(handleError);
    }

    if (viewName === "admin") {
        loadAdminUsers().catch(handleError);
    }
}

async function loadInitialData() {
    switchView("feed");
    await loadFeed();
    await loadProfile();

    if (isAdmin()) {
        await loadAdminUsers();
    }
}

async function loadFeed() {
    elements.feedList.innerHTML = `<div class="empty-card"><p class="muted">Feed wird geladen...</p></div>`;
    const { posts } = await apiRequest("/posts/feed");

    state.feedPosts = await Promise.all(posts.map(async (post) => {
        const [author, commentResult, reactionCounts] = await Promise.all([
            fetchUser(post.userId),
            apiRequest(`/comments/post/${post.id}`),
            apiRequest(`/reactions/post/${post.id}/counts`)
        ]);

        const comments = await Promise.all(commentResult.comments.map(async (comment) => ({
            ...comment,
            author: await fetchUser(comment.userId)
        })));

        return { ...post, author, comments, reactionCounts };
    }));

    renderFeed();
}

async function loadProfile() {
    elements.profileUsername.value = state.currentUser.username;
    const activity = await apiRequest(`/users/${state.currentUser.id}/activity`);

    renderActivity(elements.activityPosts, activity.posts, "Noch keine Beiträge.");
    renderActivity(elements.activityComments, activity.comments, "Noch keine Kommentare.");
    updateActivitySummary(activity.posts.length, activity.comments.length);
}

async function loadAdminUsers() {
    if (!isAdmin()) {
        elements.adminUsers.innerHTML = `<div class="empty-card"><p class="muted">Nur Administratoren können Benutzer sehen.</p></div>`;
        return;
    }

    const { users } = await apiRequest("/users");

    elements.adminUsers.innerHTML = users.map((user) => {
        const isSelf = user.id === state.currentUser.id;
        const actionButton = user.blocked
            ? `<button class="button small primary" data-admin-action="unblock" data-user-id="${user.id}" ${isSelf ? "disabled" : ""}>Entsperren</button>`
            : `<button class="button small warn" data-admin-action="block" data-user-id="${user.id}" ${isSelf ? "disabled" : ""}>Sperren</button>`;

        return `
            <article class="admin-user-row">
                <div class="admin-user-main">
                    <div class="avatar-badge">${escapeHtml(getInitials(user.username))}</div>
                    <div class="admin-user-info">
                        <strong>${escapeHtml(user.username)}</strong>
                        <span class="muted">${formatHandle(user.username)} · Rolle ${user.role}</span>
                    </div>
                </div>
                <div class="inline-actions">
                    <span class="pill ${user.blocked ? "blocked" : ""}">${user.blocked ? "Gesperrt" : "Aktiv"}</span>
                    ${actionButton}
                </div>
            </article>
        `;
    }).join("") || `<div class="empty-card"><p class="muted">Keine Benutzer gefunden.</p></div>`;
}

function renderFeed() {
    if (!state.feedPosts.length) {
        elements.feedList.innerHTML = `<div class="empty-card"><p class="muted">Noch keine Beiträge vorhanden.</p></div>`;
        return;
    }

    elements.feedList.innerHTML = state.feedPosts.map((post) => {
        const postActions = canManage(post.userId) ? `
            <div class="inline-actions">
                <button class="button small subtle" data-action="edit-post" data-post-id="${post.id}">Bearbeiten</button>
                <button class="button small warn" data-action="delete-post" data-post-id="${post.id}">Löschen</button>
            </div>
        ` : "";

        const comments = post.comments.map((comment) => `
            <article class="comment-card">
                <div class="comment-layout">
                    <div class="avatar-badge">${escapeHtml(getInitials(comment.author.username))}</div>
                    <div class="comment-body">
                        <div class="comment-head">
                            <div>
                                <strong>${escapeHtml(comment.author.username)}</strong>
                                <p class="comment-meta">${formatHandle(comment.author.username)} · ${formatDate(comment.createdAt)}</p>
                            </div>
                            ${canManage(comment.userId) ? `
                                <div class="inline-actions">
                                    <button class="button small subtle" data-action="edit-comment" data-comment-id="${comment.id}">Bearbeiten</button>
                                    <button class="button small warn" data-action="delete-comment" data-comment-id="${comment.id}">Löschen</button>
                                </div>
                            ` : ""}
                        </div>
                        <p class="comment-content">${escapeHtml(comment.content)}</p>
                    </div>
                </div>
            </article>
        `).join("") || `<div class="empty-card"><p class="muted">Noch keine Kommentare.</p></div>`;

        return `
            <article class="post-card">
                <div class="post-layout">
                    <div class="avatar-badge avatar-large">${escapeHtml(getInitials(post.author.username))}</div>
                    <div class="post-body">
                        <div class="post-head">
                            <div>
                                <div class="identity-line">
                                    <strong class="identity-name">${escapeHtml(post.author.username)}</strong>
                                    <span class="pill">${post.author.role}</span>
                                </div>
                                <p class="post-meta">${formatHandle(post.author.username)} · ${formatDate(post.createdAt)}</p>
                            </div>
                            ${postActions}
                        </div>

                        <p class="post-content">${escapeHtml(post.content)}</p>

                        <div class="post-toolbar">
                            <div class="reaction-buttons">
                                <button class="button small subtle" data-action="like" data-post-id="${post.id}">Like · ${post.reactionCounts.likes}</button>
                                <button class="button small subtle" data-action="dislike" data-post-id="${post.id}">Dislike · ${post.reactionCounts.dislikes}</button>
                            </div>
                            <span class="muted">${post.comments.length} Kommentar(e)</span>
                        </div>

                        <div class="comment-list">${comments}</div>

                        <form class="comment-form" data-post-id="${post.id}">
                            <label>
                                Antwort schreiben
                                <textarea name="content" rows="2" required placeholder="Kommentar schreiben..."></textarea>
                            </label>
                            <div class="inline-actions">
                                <button type="submit" class="button primary small">Kommentieren</button>
                            </div>
                        </form>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

function renderActivity(container, items, emptyText) {
    container.innerHTML = items.length
        ? items.map((item) => `<li>${escapeHtml(item.content)}</li>`).join("")
        : `<li class="muted">${escapeHtml(emptyText)}</li>`;
}

async function fetchUser(userId) {
    if (state.userCache.has(userId)) {
        return state.userCache.get(userId);
    }

    const { user } = await apiRequest(`/users/${userId}`);
    state.userCache.set(userId, user);
    return user;
}

async function apiRequest(path, options = {}) {
    const headers = {};

    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (options.auth !== false && state.token) {
        headers.Authorization = `Bearer ${state.token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            clearSession();
            showAuthView();
        }

        throw new Error(data.error || "Unbekannter Fehler.");
    }

    return data;
}

function saveSession(token, user) {
    state.token = token;
    state.currentUser = user;
    state.userCache.set(user.id, user);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    updateUserUI();
}

function clearSession() {
    state.token = "";
    state.currentUser = null;
    state.feedPosts = [];
    state.userCache.clear();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    updateUserUI();
    updateActivitySummary(0, 0);
}

function logout() {
    clearSession();
    showAuthView();
    showMessage("Abgemeldet.", "success");
}

function updateUserUI() {
    const user = state.currentUser;
    const username = user ? user.username : "Nicht eingeloggt";
    const handle = user ? formatHandle(user.username) : "@guest";
    const role = user ? user.role : "";
    const status = user ? (user.blocked ? "Gesperrt" : "Aktiv") : "";
    const initials = user ? getInitials(user.username) : "MT";

    elements.statusUser.textContent = username;
    elements.accountHandle.textContent = handle;
    elements.summaryName.textContent = username;
    elements.summaryHandle.textContent = handle;
    elements.profileBannerName.textContent = user ? user.username : "Profil";
    elements.profileBannerHandle.textContent = handle;

    elements.accountAvatar.textContent = initials;
    elements.composerAvatar.textContent = initials;
    elements.summaryAvatar.textContent = initials;
    elements.profileAvatar.textContent = initials;

    setPill(elements.accountRole, role, false);
    setPill(elements.accountState, status, user?.blocked === true);
    setPill(elements.summaryRole, role, false);
    setPill(elements.summaryState, status, user?.blocked === true);

    elements.profileRoleLabel.textContent = role || "-";
    elements.profileStateLabel.textContent = status || "-";

    updateAdminVisibility();
}

function updateActivitySummary(postCount, commentCount) {
    elements.summaryPostCount.textContent = String(postCount);
    elements.summaryCommentCount.textContent = String(commentCount);
    elements.profilePostCount.textContent = String(postCount);
    elements.profileCommentCount.textContent = String(commentCount);
}

function setPill(element, text, blocked) {
    if (!element) {
        return;
    }

    if (!text) {
        element.classList.add("hidden");
        element.textContent = "";
        element.classList.remove("blocked");
        return;
    }

    element.classList.remove("hidden");
    element.textContent = text;
    element.classList.toggle("blocked", Boolean(blocked));
}

function updateAdminVisibility() {
    elements.adminNavButton.classList.toggle("hidden", !isAdmin());
}

function isAdmin() {
    return state.currentUser?.role === "ADMIN";
}

function canManage(ownerId) {
    return Boolean(
        state.currentUser
        && (state.currentUser.id === ownerId || state.currentUser.role === "MODERATOR" || state.currentUser.role === "ADMIN")
    );
}

function findPost(postId) {
    return state.feedPosts.find((post) => post.id === postId);
}

function findComment(commentId) {
    for (const post of state.feedPosts) {
        const comment = post.comments.find((entry) => entry.id === commentId);

        if (comment) {
            return comment;
        }
    }

    return null;
}

function handleError(error) {
    showMessage(error instanceof Error ? error.message : "Unbekannter Fehler.", "error");
}

function showMessage(text, type) {
    elements.messageBox.textContent = text;
    elements.messageBox.className = `message ${type}`;
}

function formatDate(value) {
    const parsedDate = parseAppDate(value);

    return parsedDate.toLocaleString("de-CH");
}

function formatHandle(username) {
    return `@${String(username).trim().toLowerCase()}`;
}

function parseAppDate(value) {
    const text = String(value).trim();

    if (!text) {
        return new Date();
    }

    if (text.includes("T") || text.endsWith("Z")) {
        return new Date(text);
    }

    const sqliteUtcValue = text.replace(" ", "T") + "Z";

    return new Date(sqliteUtcValue);
}

function getInitials(username) {
    const cleaned = String(username).trim();

    if (!cleaned) {
        return "?";
    }

    return cleaned.slice(0, 2).toUpperCase();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
}

function readStoredUser() {
    const value = localStorage.getItem(USER_KEY);

    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}
