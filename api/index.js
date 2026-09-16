/*
|--------------------------------------------------------------------------
| 𝗙𝗥𝗘𝗘 𝗦𝗧𝗔𝗥 𝗟𝗜𝗦 (100% INDEPENDENT & ISOLATED ENGINE)
| - Bot Name: 𝗙𝗥𝗘𝗘 𝗦𝗧𝗔𝗥 𝗟𝗜𝗦
| - Bot Username: @FREE_STAR_LIS_3_BOT
| - Database Namespace: free_star_bot (সম্পূর্ণ আলাদা ডেটাবেস পাথ)
| - Super Admin: 8045367594
| - Developer: SΛKIB 〆 DΞVΞLOPΞR
|--------------------------------------------------------------------------
*/

const express = require('express');

// =========================================================================
// ⚙️ কনফিগারেশন
// =========================================================================
const BOT_TOKEN = process.env.BOT_TOKEN || '8492480571:AAFkYjzubr0OojxM_DlqgJ-RTnZnBLr9dhQ';
const BOT_USERNAME = process.env.BOT_USERNAME || 'FREE_STAR_LIS_3_BOT';
const BOT_NAME = '𝗙𝗥𝗘𝗘 𝗦𝗧𝗔𝗥 𝗟𝗜𝗦';
const APP_URL = process.env.APP_URL || 'https://rj-copy-star.onrender.com';
const SUPER_ADMIN_ID = '8045367594';

// ডিফল্ট লিংক ও তথ্য
const DEFAULT_SUPPORT_URL = 'https://t.me/AuraSupportsBot';
const DEFAULT_PAYMENT_CHANNEL_ID = '-1003945593094';
const DEVELOPER_NAME = 'SΛKIB 〆 DΞVΞLOPΞR';
const DEVELOPER_LINK = 'https://t.me/Sakib_Developer1';

// =========================================================================
// ⚡ FIREBASE CONFIGURATION (rj-copy-4b4b0)
// =========================================================================
let ACTIVE_FIREBASE_URL = 'https://rj-copy-4b4b0-default-rtdb.firebaseio.com';
const FIREBASE_FALLBACK_URL = 'https://rj-copy-4b4b0-default-rtdb.firebaseio.com';
const FIREBASE_API_KEY = 'AIzaSyBR3vKn89BAo8IWtHpwlXUDdLJpT6shePQ';
const FIREBASE_AUTH_EMAIL = 'tasin301210@gmail.com';
const FIREBASE_AUTH_PASSWORD = '#mayabiri';

// 🔒 এই বটের সম্পূর্ণ আলাদা ডেটাবেস রুট (যাতে অন্য বটের সাথে কোনো কানেকশন না থাকে)
const DB_NAMESPACE = 'free_star_bot';

/*
|--------------------------------------------------------------------------
| ULTRA-FAST LOCAL RAM ENGINE
|--------------------------------------------------------------------------
*/
const cache = {
    users: new Map(),
    settings: new Map(),
    userChannels: new Map(),
    forceChannels: {},
    giftCodes: {},
    admins: {},
    blacklist: {},
    whitelist: {},
    botActive: true,
    whitelistOnly: false,
    adminStates: new Map(),
    userStates: new Map()
};

const channelAlertCooldown = new Map();

function invalidateUserCache(userId) {
    cache.users.delete(String(userId));
    cache.userChannels.delete(String(userId));
}

/*
|--------------------------------------------------------------------------
| FORMATTING & PARSING HELPERS
|--------------------------------------------------------------------------
*/
function escapeHtml(text) {
    if (typeof text !== 'string') text = String(text ?? '');
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatNumber(number) {
    const num = Number(number);
    if (!isFinite(num) || isNaN(num)) return '0.0';
    return (Math.round(num * 10) / 10).toFixed(1);
}

function normalizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function isNumericAmount(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    const str = String(value).trim();
    return str !== '' && !isNaN(Number(str)) && isFinite(Number(str));
}

function formatAlertTimestamp(timestampInSeconds) {
    if (!timestampInSeconds) return 'N/A';
    const d = new Date(Number(timestampInSeconds) * 1000);
    const options = {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(d);
    let day = '', month = '', year = '', hour = '', minute = '', second = '', dayPeriod = '';
    for (const p of parts) {
        if (p.type === 'day') day = p.value;
        if (p.type === 'month') month = p.value;
        if (p.type === 'year') year = p.value;
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
        if (p.type === 'second') second = p.value;
        if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase();
    }
    return `${day}/${month}/${year} ${hour}:${minute}:${second} ${dayPeriod}`;
}

function normalizeChannelInput(input) {
    input = normalizeText(input).trim();
    if (!input) return '';
    if (input.startsWith('-100')) return input;
    const linkMatch = input.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{4,32})/i);
    if (linkMatch) return '@' + linkMatch[1];
    if (input.startsWith('@')) return input;
    if (/^[A-Za-z0-9_]{4,32}$/.test(input)) return '@' + input;
    return input;
}

function normalizeWithdrawTarget(input) {
    input = normalizeText(input).trim();
    if (!input) return '';

    const postLinkMatch = input.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/(?:[A-Za-z0-9_]{4,32}|c\/\d+)\/(\d+)\/?$/i);
    if (postLinkMatch) {
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
            input = 'https://' + input.replace(/^\/+/, '');
        }
        return input;
    }

    const channelLinkMatch = input.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{4,32})\/?$/i);
    if (channelLinkMatch) return '@' + channelLinkMatch[1];

    if (input.startsWith('@')) return input;
    if (/^[A-Za-z0-9_]{4,32}$/.test(input)) return '@' + input;
    return input;
}

function isValidWithdrawTarget(target) {
    if (!target) return false;
    if (/^@[A-Za-z0-9_]{4,32}$/.test(target)) return true;
    if (/^https?:\/\/t\.me\/(?:[A-Za-z0-9_]{4,32}|c\/\d+)\/\d+\/?$/i.test(target)) return true;
    return false;
}

/*
|--------------------------------------------------------------------------
| FIREBASE REST CLIENT (ISOLATED PATH)
|--------------------------------------------------------------------------
*/
let cachedToken = null;
let tokenExpiresAt = 0;

async function getFirebaseToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedToken && now < tokenExpiresAt) return cachedToken;

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: FIREBASE_AUTH_EMAIL,
                password: FIREBASE_AUTH_PASSWORD,
                returnSecureToken: true,
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.idToken) return null;

        cachedToken = data.idToken;
        tokenExpiresAt = now + Math.max(60, (parseInt(data.expiresIn) || 3600) - 60);
        return cachedToken;
    } catch {
        return null;
    }
}

async function firebaseRequest(path, method = 'GET', data = null) {
    path = path.replace(/^\/+|\/+$/g, '');
    if (!path) return null;

    // 🌟 সম্পূর্ণ আলাদা ফোল্ডারে ডেটা সেভ হবে
    const isolatedPath = `${DB_NAMESPACE}/${path}`;

    const token = await getFirebaseToken();
    let url = `${ACTIVE_FIREBASE_URL.replace(/\/+$/, '')}/${isolatedPath}.json${token ? `?auth=${encodeURIComponent(token)}` : ''}`;

    const options = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' }
    };
    if (data !== null) options.body = JSON.stringify(data);

    try {
        let res = await fetch(url, options);
        if (!res.ok && token && (res.status === 401 || res.status === 403)) {
            const noAuthUrl = `${ACTIVE_FIREBASE_URL.replace(/\/+$/, '')}/${isolatedPath}.json`;
            const retryRes = await fetch(noAuthUrl, options);
            if (retryRes.ok) {
                const text = await retryRes.text();
                return (text === 'null' || text === '') ? null : JSON.parse(text);
            }
        }
        if (!res.ok) return null;
        const text = await res.text();
        return (text === 'null' || text === '') ? null : JSON.parse(text);
    } catch {
        return null;
    }
}

/*
|--------------------------------------------------------------------------
| TELEGRAM API CLIENT
|--------------------------------------------------------------------------
*/
async function telegramApi(method, params = {}) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        const json = await res.json().catch(() => null);
        return json || { ok: false, description: `HTTP ${res.status}` };
    } catch (e) {
        return { ok: false, description: e.message || 'Network error' };
    }
}

async function sendMessage(chatId, text, replyMarkup = null) {
    const params = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };
    if (replyMarkup) params.reply_markup = replyMarkup;
    return await telegramApi('sendMessage', params);
}

async function editMessageText(chatId, messageId, text, replyMarkup = null) {
    const params = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    };
    if (replyMarkup) params.reply_markup = replyMarkup;
    return await telegramApi('editMessageText', params);
}

async function copyMessage(chatId, fromChatId, messageId, replyMarkup = null) {
    const params = {
        chat_id: chatId,
        from_chat_id: fromChatId,
        message_id: messageId
    };
    if (replyMarkup) params.reply_markup = replyMarkup;
    return await telegramApi('copyMessage', params);
}

async function deleteMessage(chatId, messageId) {
    return await telegramApi('deleteMessage', { chat_id: chatId, message_id: messageId });
}

async function answerCallback(callbackId, text = '', showAlert = false) {
    return await telegramApi('answerCallbackQuery', {
        callback_query_id: callbackId,
        text: text,
        show_alert: showAlert
    });
}

async function sendLongMessage(chatId, text, extra = null) {
    const max = 3800;
    if (text.length <= max) return await sendMessage(chatId, text, extra);
    let offset = 0;
    while (offset < text.length) {
        let chunk = text.slice(offset, offset + max);
        offset += chunk.length;
        await sendMessage(chatId, chunk, offset >= text.length ? extra : null);
    }
}

/*
|--------------------------------------------------------------------------
| IN-MEMORY DATABASE OPERATIONS
|--------------------------------------------------------------------------
*/
async function getUser(userId) {
    const uidStr = String(userId);
    const cached = cache.users.get(uidStr);
    if (cached) return cached;

    const res = await firebaseRequest(`users/${uidStr}`);
    const user = res && typeof res === 'object' ? res : null;
    if (user) cache.users.set(uidStr, user);
    return user;
}

function setUser(userId, data) {
    const uidStr = String(userId);
    cache.users.set(uidStr, data);
    firebaseRequest(`users/${uidStr}`, 'PUT', data).catch(console.error);
    return true;
}

function updateUser(userId, data) {
    const uidStr = String(userId);
    const current = cache.users.get(uidStr) || {};
    const updated = { ...current, ...data };
    cache.users.set(uidStr, updated);
    firebaseRequest(`users/${uidStr}`, 'PATCH', data).catch(console.error);
    return true;
}

function getSetting(key, defaultValue = '') {
    if (cache.settings.has(key)) {
        return cache.settings.get(key);
    }
    return defaultValue;
}

function setSetting(key, value) {
    cache.settings.set(key, value);
    if (key === 'bot_power_status') cache.botActive = value !== 'off';
    if (key === 'whitelist_only_mode') cache.whitelistOnly = value === 'on';
    firebaseRequest(`settings/${key}`, 'PUT', value).catch(console.error);
    return true;
}

async function getAllUsers() {
    const res = await firebaseRequest('users');
    return res && typeof res === 'object' ? res : {};
}

function isSuperAdmin(userId) {
    return String(userId).trim() === SUPER_ADMIN_ID;
}

function isAdmin(userId) {
    const uidStr = String(userId).trim();
    if (isSuperAdmin(uidStr)) return true;
    return Boolean(cache.admins[uidStr]?.active === true);
}

function checkUserAccess(userId) {
    const uidStr = String(userId).trim();
    if (isAdmin(uidStr)) return { allowed: true };
    if (cache.blacklist[uidStr]) return { allowed: false, reason: 'blocked' };
    if (cache.whitelistOnly && !cache.whitelist[uidStr]) return { allowed: false, reason: 'blocked' };
    if (!cache.botActive) return { allowed: false, reason: 'bot_off' };
    return { allowed: true };
}

async function sendAccessBlockedMessage(chatId) {
    const supportUrl = getSetting('support_url', DEFAULT_SUPPORT_URL);
    const text = 
        `⛔ <b>Bot access blocked!</b>\n\n` +
        `Your access to this bot has been restricted. If you believe this is an error, please reach out to our support.`;
    const keyboard = {
        inline_keyboard: [[{ text: '🎧 Support', url: supportUrl }]]
    };
    return await sendMessage(chatId, text, keyboard);
}

async function sendBotOffMessage(chatId) {
    const supportUrl = getSetting('support_url', DEFAULT_SUPPORT_URL);
    const text = 
        `⛔ <b>Bot currently off!</b>\n\n` +
        `🔧 <b>Source:</b> <a href="${DEVELOPER_LINK}">${escapeHtml(DEVELOPER_NAME)}</a>\n` +
        `Support: @${escapeHtml(supportUrl.split('/').pop().replace('@', ''))}`;
    const keyboard = {
        inline_keyboard: [
            [{ text: `🔧 Source: ${DEVELOPER_NAME}`, url: DEVELOPER_LINK }],
            [{ text: '🎧 Support', url: supportUrl }]
        ]
    };
    return await sendMessage(chatId, text, keyboard);
}

/*
|--------------------------------------------------------------------------
| LIVE CHANNEL CHECK & LEAVER DETECTOR
|--------------------------------------------------------------------------
*/
async function alertSuperAdminBotRemoved(channel, index) {
    const now = Date.now();
    const lastAlert = channelAlertCooldown.get(channel.channel_id) || 0;
    if (now - lastAlert < 3 * 60 * 1000) return;
    channelAlertCooldown.set(channel.channel_id, now);

    let channelUsername = channel.channel_username || '';
    if (!channelUsername && channel.channel_link) {
        channelUsername = normalizeChannelInput(channel.channel_link);
    }
    if (!channelUsername) channelUsername = `ID: ${channel.channel_id}`;

    const alertText =
        `🚨 <b>সুপার এডমিন সতর্কতা: চ্যানেল থেকে বট রিমুভ হয়েছে!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ <b>সমস্যা:</b> একজন ইউজার ভেরিফাই করতে গিয়ে আটকে গেছে, কারণ বটটিকে নিচের চ্যানেল থেকে রিমুভ করা হয়েছে!\n\n` +
        `🔢 <b>চ্যানেল #${index}</b>\n` +
        `📢 <b>চ্যানেলের নাম:</b> <b>${escapeHtml(channel.channel_name || 'N/A')}</b>\n` +
        `🔗 <b>ইউজারনেম/লিংক:</b> <code>${escapeHtml(channelUsername)}</code>\n` +
        `🆔 <b>আইডি:</b> <code>${escapeHtml(channel.channel_id)}</code>\n\n` +
        `<i>💡 সমাধান: চ্যানেলটিতে বটকে পুনরায় Admin পারমিশন দিন অথবা রিমুভ করুন।</i>`;

    sendMessage(SUPER_ADMIN_ID, alertText).catch(() => {});
}

async function verifyChannelAndBotAdmin(targetInput) {
    const normalized = normalizeChannelInput(targetInput);
    if (!normalized) return { ok: false, error: "❌ সঠিক Channel ID বা Username দিন।" };

    const chatRes = await telegramApi('getChat', { chat_id: normalized });
    if (!chatRes?.ok || !chatRes.result) {
        return { 
            ok: false, 
            error: `❌ <b>চ্যানেলটি খুঁজে পাওয়া যায়নি!</b>\n\nনিশ্চিত করুন বটটি চ্যানেলে যুক্ত রয়েছে।` 
        };
    }

    const chat = chatRes.result;
    const botId = BOT_TOKEN.split(':')[0];
    const memberRes = await telegramApi('getChatMember', { chat_id: chat.id, user_id: botId });

    if (!memberRes?.ok || !memberRes.result) {
        return { 
            ok: false, 
            error: `❌ <b>বট এই চ্যানেলে যুক্ত নেই!</b>` 
        };
    }

    const status = memberRes.result.status;
    const isBotAdmin = ['administrator', 'creator'].includes(status);

    if (!isBotAdmin) {
        return { 
            ok: false, 
            error: `⚠️ <b>বট চ্যানেলে অ্যাডমিন নয়!</b>` 
        };
    }

    let channelLink = chat.username ? `https://t.me/${chat.username}` : (chat.invite_link || '');

    return {
        ok: true,
        channel_id: String(chat.id),
        channel_title: chat.title || 'Channel',
        channel_username: chat.username ? `@${chat.username}` : '',
        channel_link: channelLink
    };
}

async function isJoinedChannel(channelId, userId) {
    if (!channelId) return false;
    const res = await telegramApi('getChatMember', { chat_id: channelId, user_id: userId });
    if (!res?.ok) return false;
    const status = res.result?.status;
    if (['creator', 'administrator', 'member'].includes(status)) return true;
    if (status === 'restricted') return Boolean(res.result?.is_member);
    return false;
}

async function isBotAdminInChat(chatId) {
    const botId = BOT_TOKEN.split(':')[0];
    const res = await telegramApi('getChatMember', { chat_id: chatId, user_id: botId });
    return res && res.ok && ['administrator', 'creator'].includes(res.result?.status);
}

async function isUserJoinedAllChannels(userId, bypassCache = false) {
    const uidStr = String(userId);
    const now = Date.now();

    if (!bypassCache) {
        const cached = cache.userChannels.get(uidStr);
        if (cached && now < cached.expiresAt) return cached.isMember;
    }

    const channelEntries = Object.entries(cache.forceChannels).filter(([_, ch]) => ch && ch.channel_id);

    if (!channelEntries.length) {
        cache.userChannels.set(uidStr, { isMember: true, expiresAt: now + 30000 });
        return true;
    }

    const checks = await Promise.all(channelEntries.map(async ([key, ch], idx) => {
        const botIsAdmin = await isBotAdminInChat(ch.channel_id);
        if (!botIsAdmin) {
            alertSuperAdminBotRemoved(ch, idx + 1);
            return false;
        }
        return await isJoinedChannel(ch.channel_id, uidStr);
    }));

    const allJoined = checks.every(Boolean);
    cache.userChannels.set(uidStr, { isMember: allJoined, expiresAt: now + (allJoined ? 15000 : 5000) });
    return allJoined;
}

async function getTelegramUsername(userId) {
    const res = await telegramApi('getChat', { chat_id: userId });
    return res && res.ok && res.result?.username ? '@' + res.result.username : `@user_${userId}`;
}

/*
|--------------------------------------------------------------------------
| POST-JOIN REFERRAL REWARD & VERIFICATION ENGINE
|--------------------------------------------------------------------------
*/
async function verifyAndRewardUser(fromId, callbackUser = null) {
    invalidateUserCache(fromId);
    const joinedAll = await isUserJoinedAllChannels(fromId, true);
    if (!joinedAll) return { success: false };

    let user = await getUser(fromId);
    const now = Math.floor(Date.now() / 1000);
    const coinName = getSetting('coin_name', 'STAR');

    if (!user) {
        user = {
            telegram_id: fromId,
            first_name: callbackUser?.first_name || 'User',
            username: callbackUser?.username || '',
            balance: 0,
            verification_status: 'verified',
            is_verified: true,
            referral_rewarded: false,
            created_at: now
        };
        setUser(fromId, user);
    }

    const welcomeBonus = Number(getSetting('welcome_bonus', 0));
    let newBalance = Number(user.balance || 0);
    const userUpdates = {
        verification_status: 'verified',
        is_verified: true,
        verified_at: now
    };

    if (!user.welcome_claimed && welcomeBonus > 0) {
        newBalance += welcomeBonus;
        userUpdates.balance = newBalance;
        userUpdates.welcome_claimed = true;
    }

    // 🌟 STAR REWARD TO REFERRER
    if (user.referred_by && !user.referral_rewarded && String(user.referred_by) !== String(fromId)) {
        const ref = await getUser(user.referred_by);
        if (ref) {
            const refBonus = Number(getSetting('referral_bonus', 1));
            const newTotalRefs = Number(ref.total_referrals || 0) + 1;
            const newRefBalance = Number(ref.balance || 0) + refBonus;

            updateUser(user.referred_by, {
                balance: newRefBalance,
                total_referrals: newTotalRefs
            });

            userUpdates.referral_rewarded = true;

            const rewardAlert =
                `🌟 <b>Star Reward Received!</b>\n` +
                `✅ You earned ${formatNumber(refBonus)} ${escapeHtml(coinName)}\n` +
                ` 🙌 Thanks to your invite: <code>${fromId}</code>.`;

            sendMessage(user.referred_by, rewardAlert).catch(() => {});
        }
    }

    updateUser(fromId, userUpdates);
    return { success: true };
}

/*
|--------------------------------------------------------------------------
| UI KEYBOARDS & ALERTS
|--------------------------------------------------------------------------
*/
function getUserMenu(userId) {
    const isAdm = isAdmin(userId);
    const keyboard = [
        [
            { text: '👥 Account' },
            { text: '📮 Referral' }
        ],
        [
            { text: '🎁 Gift Code' },
            { text: '📊 Statistics' }
        ],
        [
            { text: '🛒 Withdraw' }
        ]
    ];
    if (isAdm) {
        keyboard.push([
            { text: '🛠 Admin Panel' }
        ]);
    }
    return { keyboard: keyboard, resize_keyboard: true, is_persistent: true };
}

function getAdminMenu(superAdmin) {
    const botActive = cache.botActive;
    const wlMode = cache.whitelistOnly;

    const keyboard = [
        [
            { text: botActive ? '🟢 Bot: Active (ON)' : '🔴 Bot: OFF (Maintenance)' },
            { text: '⚙️ Central Settings' }
        ],
        [
            { text: '👥 User & Balance' },
            { text: '📢 Channel Broadcast' }
        ],
        [
            { text: '📢 Users Broadcast' },
            { text: `🛡️ Security (${wlMode ? 'Whitelist Only' : 'Standard'})` }
        ],
        [
            { text: '📢 Force Channels' },
            { text: '⭐ সেট Payouts Done' }
        ],
        [
            { text: '🎁 Gift Codes' }
        ]
    ];
    if (superAdmin) {
        keyboard.push([
            { text: '👮 এডমিন ম্যানেজমেন্ট' }
        ]);
    }
    keyboard.push([
        { text: '🔙 Back to User Panel' }
    ]);
    return { keyboard: keyboard, resize_keyboard: true, is_persistent: true };
}

function getCancelKeyboard() {
    return { keyboard: [[{ text: '/cancel' }]], resize_keyboard: true, one_time_keyboard: true };
}

function centralSettingsKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '🎧 Support Bot Link', callback_data: 'cfg_support' },
                { text: '💳 Payment Channel', callback_data: 'cfg_pay_channel' }
            ],
            [
                { text: '🪙 Coin Name', callback_data: 'cfg_coin' },
                { text: '👥 Referral Reward', callback_data: 'cfg_referral' }
            ],
            [
                { text: '💰 Fixed Withdraw', callback_data: 'cfg_withdraw' },
                { text: '🎯 1st Withdraw Refs', callback_data: 'cfg_first_refs' }
            ],
            [
                { text: '🎁 Welcome Bonus', callback_data: 'cfg_welcome' },
                { text: '📊 Withdraw Fee (%)', callback_data: 'cfg_fee' }
            ]
        ]
    };
}

function securityKeyboard() {
    const wlMode = cache.whitelistOnly;
    return {
        inline_keyboard: [
            [
                { text: wlMode ? '🔒 Mode: Whitelist Only (Active)' : '🔓 Mode: Standard (All allowed)', callback_data: 'sec_toggle_wl_mode' }
            ],
            [
                { text: '🚫 Add Blacklist', callback_data: 'sec_add_bl' },
                { text: '✅ Add Whitelist', callback_data: 'sec_add_wl' }
            ],
            [
                { text: '❌ Remove Blacklist', callback_data: 'sec_rem_bl' },
                { text: '❌ Remove Whitelist', callback_data: 'sec_rem_wl' }
            ],
            [
                { text: '📋 Blacklist Users', callback_data: 'sec_list_bl' },
                { text: '📋 Whitelist Users', callback_data: 'sec_list_wl' }
            ]
        ]
    };
}

function adminManagementKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '➕ এডমিন যোগ করুন', callback_data: 'admin_add' },
                { text: '➖ এডমিন রিমুভ করুন', callback_data: 'admin_remove' }
            ],
            [
                { text: '👮 এডমিন তালিকা', callback_data: 'admin_list' }
            ]
        ]
    };
}

function forceJoinKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '➕ চ্যানেল যোগ করুন', callback_data: 'force_add' },
                { text: '➖ চ্যানেল রিমুভ করুন', callback_data: 'force_remove' }
            ],
            [
                { text: '📋 চ্যানেল তালিকা', callback_data: 'force_list' }
            ]
        ]
    };
}

function balanceKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '➕ ব্যালেন্স যোগ করুন', callback_data: 'balance_add' },
                { text: '➖ ব্যালেন্স কাটুন', callback_data: 'balance_cut' }
            ]
        ]
    };
}

function withdrawActionKeyboard(withdrawId) {
    return {
        inline_keyboard: [
            [
                { text: '✅ Approve', callback_data: `withdraw_approve_${withdrawId}` },
                { text: '⛔ Reject', callback_data: `withdraw_reject_${withdrawId}` }
            ]
        ]
    };
}

function showForceJoin(chatId, firstName = 'User') {
    const channelList = Object.values(cache.forceChannels).filter(ch => ch && ch.channel_link);
    const inlineKeyboard = [];
    const total = channelList.length;

    for (let i = 0; i < total; i += 2) {
        if (i + 1 < total) {
            inlineKeyboard.push([
                { text: channelList[i].channel_name || 'Join', url: channelList[i].channel_link },
                { text: channelList[i + 1].channel_name || 'Join', url: channelList[i + 1].channel_link }
            ]);
        } else {
            inlineKeyboard.push([
                { text: channelList[i].channel_name || 'Join', url: channelList[i].channel_link }
            ]);
        }
    }

    inlineKeyboard.push([
        { text: 'Claim', callback_data: 'verify_join' }
    ]);

    const text =
        `👋 <b>Hello, ${escapeHtml(firstName)}!</b>\n\n` +
        `📢 <b>Join All Channels To Continue.</b>\n` +
        `<i>(You must be a member of all channels to access ${escapeHtml(BOT_NAME)})</i>`;

    return sendMessage(chatId, text, { inline_keyboard: inlineKeyboard });
}

async function getUserWithdrawals(userId) {
    const all = await firebaseRequest('withdrawals');
    if (!all || typeof all !== 'object') return [];
    const result = [];
    for (const [id, withdraw] of Object.entries(all)) {
        if (withdraw && String(withdraw.user_id) === String(userId)) {
            withdraw._id = String(id);
            result.push(withdraw);
        }
    }
    result.sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
    return result.slice(0, 10);
}

// Payment Channel Alert Formats
function buildPendingAlertText(withdraw) {
    const amount = Number(withdraw.amount || 0);
    const fee = Number(withdraw.fee_percent || 0);
    const afterFee = Number(withdraw.after_fee || amount);

    return `🔔 <b>New Stars Request Pending Alert!</b>\n\n` +
        `📌 <b>User :</b> <code>${escapeHtml(withdraw.user_id)}</code>\n\n` +
        `💳 <b>Stars :</b> <code>${formatNumber(amount)}</code>🌟 (Fee: ${formatNumber(fee)}%:\n` +
        `   After Fee <code>${formatNumber(afterFee)}</code>🌟)\n\n` +
        `📬 <b>Send To (Address):</b> <b>${escapeHtml(withdraw.withdraw_username)}</b>\n\n` +
        `🧾 <b>Transaction ID:</b> <code>${escapeHtml(withdraw.transaction_id)}</code>`;
}

function buildApprovedAlertText(withdraw, adminUsername, nowTimestamp) {
    const amount = Number(withdraw.amount || 0);
    const fee = Number(withdraw.fee_percent || 0);
    const afterFee = Number(withdraw.after_fee || amount);

    return `🔔 <b>New Stars Request Processed Alert!</b>\n` +
        `📌 <b>User :</b> <code>${escapeHtml(withdraw.user_id)}</code>\n` +
        `💳 <b>Stars :</b> <code>${formatNumber(amount)}</code>🌟 (Fee ${formatNumber(fee)}% :\n` +
        `After Fee <code>${formatNumber(afterFee)}</code>🌟)\n` +
        `📬 <b>Send To (Address):</b> <b>${escapeHtml(withdraw.withdraw_username)}</b>\n` +
        `🧾 <b>Transaction ID:</b> <code>${escapeHtml(withdraw.transaction_id)}</code>\n` +
        `🟢 <b>Approved by ${escapeHtml(adminUsername)} at ${formatAlertTimestamp(nowTimestamp)}</b>`;
}

function buildRejectedAlertText(withdraw, adminUsername, nowTimestamp) {
    const amount = Number(withdraw.amount || 0);
    const fee = Number(withdraw.fee_percent || 0);
    const afterFee = Number(withdraw.after_fee || amount);

    return `🔔 <b>New Stars Request Processed Alert!</b>\n` +
        `📌 <b>User :</b> <code>${escapeHtml(withdraw.user_id)}</code>\n` +
        `💳 <b>Stars :</b> <code>${formatNumber(amount)}</code>🌟 (Fee ${formatNumber(fee)}% :\n` +
        `After Fee <code>${formatNumber(afterFee)}</code>🌟)\n` +
        `📬 <b>Send To (Address):</b> <b>${escapeHtml(withdraw.withdraw_username)}</b>\n` +
        `🧾 <b>Transaction ID:</b> <code>${escapeHtml(withdraw.transaction_id)}</code>\n` +
        `🔴 <b>Rejected by ${escapeHtml(adminUsername)} at ${formatAlertTimestamp(nowTimestamp)}</b>`;
}

/*
|--------------------------------------------------------------------------
| MAIN EVENT DISPATCHER WITH STRICT LEAVER DETECTION
|--------------------------------------------------------------------------
*/
async function handleUpdate(update) {
    // -------------------------------------------------------------
    // 1. CALLBACK QUERIES
    // -------------------------------------------------------------
    if (update.callback_query) {
        const callback = update.callback_query;
        const fromId = String(callback.from.id);
        const data = callback.data || '';
        const chatId = callback.message?.chat?.id;
        const messageId = callback.message?.message_id;

        const access = checkUserAccess(fromId);
        if (!access.allowed) {
            if (access.reason === 'bot_off') {
                answerCallback(callback.id, "⛔ Bot currently off!", true);
                sendBotOffMessage(fromId);
            } else {
                answerCallback(callback.id, "⛔ Bot access blocked!", true);
                sendAccessBlockedMessage(fromId);
            }
            return;
        }

        // STRICT LEAVER CHECK
        if (!isAdmin(fromId) && data !== 'verify_join') {
            const joinedAll = await isUserJoinedAllChannels(fromId);
            if (!joinedAll) {
                answerCallback(callback.id, "⚠️ Please join all channels first!", true);
                showForceJoin(fromId, callback.from.first_name);
                return;
            }
        }

        // Verify Join Channels
        if (data === 'verify_join') {
            answerCallback(callback.id);
            const check = await verifyAndRewardUser(fromId, callback.from);
            if (!check.success) {
                if (chatId && messageId) deleteMessage(chatId, messageId).catch(() => {});
                sendMessage(fromId, "⚠️ <b>Please join all channels first!</b>");
                showForceJoin(fromId, callback.from.first_name);
                return;
            }

            if (chatId && messageId) deleteMessage(chatId, messageId).catch(() => {});
            sendMessage(fromId, `✅ <b>Verification Successful!</b>\n\nWelcome to ${escapeHtml(BOT_NAME)}! 🎉`, getUserMenu(fromId));
            return;
        }

        // Referral Summary (My Invites Button)
        if (data === 'my_invites') {
            const allUsers = await getAllUsers();
            let started = 0;
            let pending = 0;
            let verified = 0;

            for (const u of Object.values(allUsers)) {
                if (u && String(u.referred_by) === String(fromId)) {
                    started++;
                    if (u.is_verified || u.referral_rewarded) {
                        verified++;
                    } else {
                        pending++;
                    }
                }
            }

            const summaryText =
                `📢 Referral Summary\n` +
                `👣 Started via your link: ${started}\n` +
                `⛔ Pending channel join: ${pending}\n` +
                `🎁 Verified & Credited referrals: ${verified}`;

            answerCallback(callback.id, summaryText, true);
            return;
        }

        // Withdraw Approve / Reject
        const match = data.match(/^withdraw_(approve|reject)_([A-Za-z0-9_-]+)$/);
        if (match) {
            answerCallback(callback.id);
            if (!isAdmin(fromId)) {
                sendMessage(fromId, "⛔ <b>Permission Denied!</b>");
                return;
            }
            const action = match[1];
            const withdrawId = match[2];
            const withdraw = await firebaseRequest(`withdrawals/${withdrawId}`);
            const coinName = getSetting('coin_name', 'STAR');

            if (!withdraw || withdraw.status !== 'pending') {
                sendMessage(fromId, "⚠️ <b>Request already processed!</b>");
                return;
            }

            const adminUsername = await getTelegramUsername(fromId);
            const now = Math.floor(Date.now() / 1000);

            if (action === 'approve') {
                firebaseRequest(`withdrawals/${withdrawId}`, 'PATCH', {
                    status: 'approved',
                    processed_by: fromId,
                    processed_by_username: adminUsername,
                    processed_at: now
                }).catch(() => {});
                
                updateUser(withdraw.user_id, { has_withdrawn: true });
                sendMessage(withdraw.user_id, `🎉 <b>Withdrawal Approved!</b>\n\n💰 Amount: <b>${formatNumber(withdraw.after_fee)} ${escapeHtml(coinName)}</b>\n🧾 ID: <code>${withdraw.transaction_id}</code>\n🕒 Approved At: <code>${formatAlertTimestamp(now)}</code>`);

                if (chatId && messageId) {
                    editMessageText(chatId, messageId, buildApprovedAlertText(withdraw, adminUsername, now));
                }
                return;
            }

            if (action === 'reject') {
                const target = await getUser(withdraw.user_id);
                if (target) {
                    updateUser(withdraw.user_id, {
                        balance: Number(target.balance || 0) + Number(withdraw.amount || 0)
                    });
                }
                firebaseRequest(`withdrawals/${withdrawId}`, 'PATCH', {
                    status: 'rejected',
                    processed_by: fromId,
                    processed_by_username: adminUsername,
                    processed_at: now,
                    refunded: true
                }).catch(() => {});

                sendMessage(withdraw.user_id, `❌ <b>Withdrawal Rejected</b>\n\n${formatNumber(withdraw.amount)} ${escapeHtml(coinName)} has been refunded to your balance.\n🕒 Rejected At: <code>${formatAlertTimestamp(now)}</code>`);

                if (chatId && messageId) {
                    editMessageText(chatId, messageId, buildRejectedAlertText(withdraw, adminUsername, now));
                }
                return;
            }
        }

        // ADMIN CALLBACKS
        if (isAdmin(fromId)) {
            if (data === 'cfg_support') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_support' });
                const cur = getSetting('support_url', DEFAULT_SUPPORT_URL);
                sendMessage(fromId, `🎧 <b>Support Bot Link</b>\n\nবর্তমান লিংক: <code>${escapeHtml(cur)}</code>\n\nনতুন লিংক পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_pay_channel') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_pay_channel' });
                const cur = getSetting('withdraw_request_channel', DEFAULT_PAYMENT_CHANNEL_ID);
                sendMessage(fromId, `💳 <b>Payment Request Channel</b>\n\nবর্তমান আইডি: <code>${escapeHtml(cur)}</code>\n\nনতুন চ্যানেল আইডি বা ইউজারনেম পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_coin') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_coin' });
                const cur = getSetting('coin_name', 'STAR');
                sendMessage(fromId, `🪙 <b>Coin / Currency Name</b>\n\nবর্তমান নাম: <b>${escapeHtml(cur)}</b>\n\nনতুন নাম পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_referral') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_referral' });
                const cur = getSetting('referral_bonus', 1);
                const coin = getSetting('coin_name', 'STAR');
                sendMessage(fromId, `👥 <b>Referral Reward</b>\n\nবর্তমান রিওয়ার্ড: <b>${formatNumber(cur)} ${escapeHtml(coin)}</b>\n\nনতুন অ্যামাউন্ট পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_withdraw') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_withdraw' });
                const cur = getSetting('min_withdraw', 3);
                const coin = getSetting('coin_name', 'STAR');
                sendMessage(fromId, `💰 <b>Fixed Minimum Withdraw</b>\n\nবর্তমান অ্যামাউন্ট: <b>${formatNumber(cur)} ${escapeHtml(coin)}</b>\n\nনতুন অ্যামাউন্ট পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_first_refs') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_first_refs' });
                const cur = getSetting('first_withdraw_refs', 4);
                sendMessage(fromId, `🎯 <b>First Withdraw Referral Requirement</b>\n\nবর্তমানে প্রথম উইথড্র করতে রেফার প্রয়োজন: <b>${cur} টি</b>\n\nনতুন সংখ্যা লিখুন:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_welcome') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_welcome' });
                const cur = getSetting('welcome_bonus', 0);
                const coin = getSetting('coin_name', 'STAR');
                sendMessage(fromId, `🎁 <b>Welcome Bonus</b>\n\nবর্তমান বোনাস: <b>${formatNumber(cur)} ${escapeHtml(coin)}</b>\n\nনতুন অ্যামাউন্ট পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'cfg_fee') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cfg_fee' });
                const cur = getSetting('withdraw_fee_percent', 0);
                sendMessage(fromId, `📊 <b>Withdrawal Fee (%)</b>\n\nবর্তমান ফি: <b>${formatNumber(cur)}%</b>\n\nনতুন পার্সেন্টেজ লিখুন (0-100):`, getCancelKeyboard());
                return;
            }

            if (data === 'sec_toggle_wl_mode') {
                const newMode = cache.whitelistOnly ? 'off' : 'on';
                setSetting('whitelist_only_mode', newMode);
                answerCallback(callback.id, `Whitelist Mode: ${newMode.toUpperCase()}`);
                if (chatId && messageId) {
                    editMessageText(chatId, messageId, "🛡️ <b>Security Management</b>\nব্লকলিস্ট ও হোয়াইটলিস্ট কন্ট্রোল:", securityKeyboard());
                }
                return;
            }

            if (data === 'sec_add_bl') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'sec_add_bl' });
                sendMessage(fromId, "🚫 <b>Add to Blacklist</b>\n\nইউজারের Telegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'sec_add_wl') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'sec_add_wl' });
                sendMessage(fromId, "✅ <b>Add to Whitelist</b>\n\nইউজারের Telegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'sec_rem_bl') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'sec_rem_bl' });
                sendMessage(fromId, "❌ <b>Remove from Blacklist</b>\n\nরিমুভ করতে Telegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'sec_rem_wl') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'sec_rem_wl' });
                sendMessage(fromId, "❌ <b>Remove from Whitelist</b>\n\nরিমুভ করতে Telegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'sec_list_bl') {
                answerCallback(callback.id);
                const ids = Object.keys(cache.blacklist);
                let txt = `🚫 <b>Blacklist Users (${ids.length})</b>\n━━━━━━━━━━━━━━━━━━\n`;
                if (!ids.length) txt += "কোনো ইউজার ব্ল্যাকলিস্টে নেই।";
                else txt += ids.map(id => `• <code>${escapeHtml(id)}</code>`).join('\n');
                sendLongMessage(fromId, txt);
                return;
            }

            if (data === 'sec_list_wl') {
                answerCallback(callback.id);
                const ids = Object.keys(cache.whitelist);
                let txt = `✅ <b>Whitelist Users (${ids.length})</b>\n━━━━━━━━━━━━━━━━━━\n`;
                if (!ids.length) txt += "কোনো ইউজার হোয়াইটলিস্টে নেই।";
                else txt += ids.map(id => `• <code>${escapeHtml(id)}</code>`).join('\n');
                sendLongMessage(fromId, txt);
                return;
            }

            const bcChMatch = data.match(/^bc_select_channel_([A-Za-z0-9_-]+)$/);
            if (bcChMatch) {
                answerCallback(callback.id);
                const chKey = bcChMatch[1];
                const target = cache.forceChannels[chKey];
                if (!target) {
                    sendMessage(fromId, "⚠️ চ্যানেলটি পাওয়া যায়নি!");
                    return;
                }

                cache.adminStates.set(fromId, {
                    action: 'awaiting_channel_single_msg',
                    target_channel_id: target.channel_id,
                    target_channel_name: target.channel_name || 'Channel'
                });

                sendMessage(fromId, `📢 <b>Selected Channel: ${escapeHtml(target.channel_name)}</b>\n\nশুধুমাত্র এই চ্যানেলে ব্রডকাস্ট করার জন্য মেসেজটি পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'bc_all_channels') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'awaiting_channel_broadcast_message' });
                sendMessage(fromId, `📢 <b>Broadcast to ALL Channels</b>\n\nসকল চ্যানেলে পাঠানোর মেসেজটি পাঠান:`, getCancelKeyboard());
                return;
            }

            if (data === 'confirm_broadcast_single_ch') {
                answerCallback(callback.id);
                const aState = cache.adminStates.get(fromId);
                if (!aState || aState.action !== 'confirm_broadcast_single_ch') return;
                cache.adminStates.delete(fromId);
                if (chatId && messageId) deleteMessage(chatId, messageId).catch(() => {});

                const res = await copyMessage(aState.target_channel_id, aState.from_chat_id, aState.message_id);
                if (res?.ok) {
                    sendMessage(chatId, `✅ <b>সফলভাবে ${escapeHtml(aState.target_channel_name)} চ্যানেলে ব্রডকাস্ট সম্পন্ন হয়েছে!</b>`, getAdminMenu(isSuperAdmin(fromId)));
                } else {
                    sendMessage(chatId, `❌ <b>পোস্ট ব্যর্থ হয়েছে!</b>\nকারণ: <code>${escapeHtml(res?.description || 'Error')}</code>`, getAdminMenu(isSuperAdmin(fromId)));
                }
                return;
            }

            if (data === 'confirm_broadcast_users') {
                answerCallback(callback.id);
                const aState = cache.adminStates.get(fromId);
                if (!aState || aState.action !== 'confirm_broadcast_users') return;
                cache.adminStates.delete(fromId);
                if (chatId && messageId) deleteMessage(chatId, messageId).catch(() => {});

                sendMessage(chatId, "🚀 <b>ইউজার ব্রডকাস্ট শুরু হচ্ছে...</b>");

                const users = await getAllUsers();
                let success = 0, failed = 0;
                for (const uid of Object.keys(users)) {
                    try {
                        const res = await copyMessage(uid, aState.from_chat_id, aState.message_id);
                        if (res?.ok) success++;
                        else failed++;
                    } catch {
                        failed++;
                    }
                }
                sendMessage(chatId, `📢 <b>User Broadcast Completed!</b>\n\n✅ সফল: <b>${success}</b>\n❌ ব্যর্থ: <b>${failed}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                return;
            }

            if (data === 'confirm_broadcast_channels') {
                answerCallback(callback.id);
                const aState = cache.adminStates.get(fromId);
                if (!aState || aState.action !== 'confirm_broadcast_channels') return;
                cache.adminStates.delete(fromId);
                if (chatId && messageId) deleteMessage(chatId, messageId).catch(() => {});

                const channelList = Object.values(cache.forceChannels).filter(ch => ch && ch.channel_id);
                let success = 0, failed = 0;

                for (const ch of channelList) {
                    try {
                        const res = await copyMessage(ch.channel_id, aState.from_chat_id, aState.message_id);
                        if (res?.ok) success++;
                        else failed++;
                    } catch {
                        failed++;
                    }
                }

                sendMessage(chatId, `📢 <b>চ্যানেল ব্রডকাস্ট সম্পন্ন!</b>\n\n✅ সফল: <b>${success}</b>\n❌ ব্যর্থ: <b>${failed}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                return;
            }

            if (data === 'cancel_broadcast') {
                answerCallback(callback.id);
                cache.adminStates.delete(fromId);
                if (chatId && messageId) deleteMessage(chatId, messageId).catch(() => {});
                sendMessage(chatId, "❌ বাতিল করা হয়েছে।", getAdminMenu(isSuperAdmin(fromId)));
                return;
            }

            if (data === 'force_add') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'add_force_channel_input' });
                sendMessage(fromId, "➕ <b>ফোর্স চ্যানেল যোগ করুন</b>\n\nচ্যানেলের <b>ID</b> অথবা <b>Username/Link</b> পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'force_remove') {
                answerCallback(callback.id);
                const channels = cache.forceChannels;
                if (!Object.keys(channels).length) {
                    sendMessage(fromId, "⚠️ কোনো চ্যানেল নেই!");
                    return;
                }
                const kb = [];
                for (const [k, c] of Object.entries(channels)) {
                    if (c) kb.push([{ text: `❌ ${c.channel_name || 'Channel'}`, callback_data: `removeforce_${k}` }]);
                }
                sendMessage(fromId, "📢 <b>ফোর্স চ্যানেল রিমুভ</b>:", { inline_keyboard: kb });
                return;
            }

            const removeMatch = data.match(/^removeforce_([A-Za-z0-9_-]+)$/);
            if (removeMatch) {
                answerCallback(callback.id);
                delete cache.forceChannels[removeMatch[1]];
                cache.userChannels.clear();
                firebaseRequest(`force_channels/${removeMatch[1]}`, 'DELETE').catch(() => {});
                sendMessage(fromId, "✅ <b>চ্যানেল রিমুভ হয়েছে!</b>", getAdminMenu(isSuperAdmin(fromId)));
                return;
            }

            if (data === 'force_list') {
                answerCallback(callback.id);
                const channels = Object.entries(cache.forceChannels).filter(([_, c]) => c && c.channel_id);
                let list = "📢 <b>ফোর্স চ্যানেল তালিকা ও স্ট্যাটাস</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
                if (!channels.length) {
                    list += "\nকোনো Force Join Channel যুক্ত নেই।";
                } else {
                    const checkedList = await Promise.all(channels.map(async ([key, c], idx) => {
                        const isAdminThere = await isBotAdminInChat(c.channel_id);
                        const statusText = isAdminThere ? "✅ Bot Admin" : "⚠️ Bot Not Admin";
                        let uName = c.channel_username || (c.channel_link ? normalizeChannelInput(c.channel_link) : `ID: ${c.channel_id}`);
                        return {
                            index: idx + 1,
                            name: c.channel_name || 'Channel',
                            id: c.channel_id,
                            username: uName,
                            statusText: statusText
                        };
                    }));

                    for (const item of checkedList) {
                        list += `\n<b>#${item.index}. ${escapeHtml(item.name)}</b> (${item.statusText})\n` +
                                `🆔 ID: <code>${escapeHtml(item.id)}</code>\n` +
                                `🔗 Link: <code>${escapeHtml(item.username)}</code>\n`;
                    }
                }
                sendLongMessage(fromId, list);
                return;
            }

            if (data === 'balance_add') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'add_balance_user' });
                sendMessage(fromId, "➕ <b>ব্যালেন্স যোগ</b>\n\n👤 Telegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'balance_cut') {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'cut_balance_user' });
                sendMessage(fromId, "➖ <b>ব্যালেন্স কাটুন</b>\n\n👤 Telegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'admin_add' && isSuperAdmin(fromId)) {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'admin_add' });
                sendMessage(fromId, "➕ <b>নতুন এডমিন যোগ করুন</b>\n\nTelegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'admin_remove' && isSuperAdmin(fromId)) {
                answerCallback(callback.id);
                cache.adminStates.set(fromId, { action: 'admin_remove' });
                sendMessage(fromId, "➖ <b>এডমিন রিমুভ করুন</b>\n\nTelegram User ID পাঠান:", getCancelKeyboard());
                return;
            }

            if (data === 'admin_list' && isSuperAdmin(fromId)) {
                answerCallback(callback.id);
                let list = `👮 <b>এডমিন তালিকা</b>\n━━━━━━━━━━━━━━━━━━\n\n👑 <b>Super Admin:</b> <code>${SUPER_ADMIN_ID}</code>\n\n👮 <b>অন্যান্য Admin:</b>\n`;
                let has = false;
                for (const [aId, a] of Object.entries(cache.admins)) {
                    if (a?.active) { has = true; list += `• <code>${escapeHtml(aId)}</code>\n`; }
                }
                if (!has) list += "কোনো অতিরিক্ত Admin নেই।";
                sendMessage(fromId, list);
                return;
            }
        }
    }

    // -------------------------------------------------------------
    // 2. TEXT & COMMAND MESSAGES
    // -------------------------------------------------------------
    if (update.message) {
        const msg = update.message;
        const fromId = String(msg.from.id).trim();
        const chatId = String(msg.chat.id);
        const text = normalizeText(msg.text || '');
        const isAdm = isAdmin(fromId);

        const access = checkUserAccess(fromId);
        if (!access.allowed) {
            if (access.reason === 'bot_off') {
                sendBotOffMessage(chatId);
            } else {
                sendAccessBlockedMessage(chatId);
            }
            return;
        }

        let user = await getUser(fromId);
        if (!user) {
            let refBy = null;
            if (text) {
                const startMatch = text.match(/^\/start\s+(\d+)$/i);
                if (startMatch && startMatch[1] !== fromId) {
                    refBy = startMatch[1];
                }
            }
            user = {
                telegram_id: fromId,
                first_name: msg.from.first_name || 'User',
                username: msg.from.username || '',
                balance: 0,
                referred_by: refBy,
                referral_rewarded: false,
                verification_status: isAdm ? 'verified' : 'pending_channel',
                is_verified: isAdm,
                created_at: Math.floor(Date.now() / 1000)
            };
            setUser(fromId, user);
        }

        if (text && (text.toLowerCase() === '/cancel' || text.toLowerCase() === 'cancel')) {
            cache.adminStates.delete(fromId);
            cache.userStates.delete(fromId);
            sendMessage(chatId, "❌ Action Cancelled.", getUserMenu(fromId));
            return;
        }

        // =========================================================================
        // STRICT REAL-TIME FORCE JOIN GATE
        // =========================================================================
        if (!isAdm) {
            const joinedAll = await isUserJoinedAllChannels(fromId);
            if (!joinedAll) {
                if (user.is_verified) {
                    updateUser(fromId, { is_verified: false, verification_status: 'pending_channel' });
                }
                showForceJoin(chatId, msg.from.first_name);
                return;
            }
        }

        // ---------------------------------------------------------
        // ADMIN STATES HANDLING
        // ---------------------------------------------------------
        if (isAdm) {
            const aState = cache.adminStates.get(fromId);

            if (aState?.action === 'awaiting_channel_single_msg') {
                cache.adminStates.set(fromId, {
                    action: 'confirm_broadcast_single_ch',
                    from_chat_id: chatId,
                    message_id: msg.message_id,
                    target_channel_id: aState.target_channel_id,
                    target_channel_name: aState.target_channel_name
                });
                await copyMessage(chatId, chatId, msg.message_id);
                sendMessage(chatId, `👆 <b>প্রিভিউ দেখুন।</b>\nআপনি কি <b>${escapeHtml(aState.target_channel_name)}</b> চ্যানেলে পোস্ট করতে চান?`, {
                    inline_keyboard: [
                        [
                            { text: `✅ Send to ${aState.target_channel_name}`, callback_data: 'confirm_broadcast_single_ch' },
                            { text: '❌ Cancel', callback_data: 'cancel_broadcast' }
                        ]
                    ]
                });
                return;
            }

            if (aState?.action === 'awaiting_broadcast_message') {
                cache.adminStates.set(fromId, {
                    action: 'confirm_broadcast_users',
                    from_chat_id: chatId,
                    message_id: msg.message_id
                });
                await copyMessage(chatId, chatId, msg.message_id);
                sendMessage(chatId, "👆 <b>প্রিভিউ দেখুন।</b>\nআপনি কি সকল ইউজারকে এই মেসেজ পাঠাতে চান?", {
                    inline_keyboard: [
                        [
                            { text: '✅ Send to All Users', callback_data: 'confirm_broadcast_users' },
                            { text: '❌ Cancel', callback_data: 'cancel_broadcast' }
                        ]
                    ]
                });
                return;
            }

            if (aState?.action === 'awaiting_channel_broadcast_message') {
                cache.adminStates.set(fromId, {
                    action: 'confirm_broadcast_channels',
                    from_chat_id: chatId,
                    message_id: msg.message_id
                });
                await copyMessage(chatId, chatId, msg.message_id);
                sendMessage(chatId, "👆 <b>প্রিভিউ দেখুন।</b>\nআপনি কি সকল চ্যানেলে এই মেসেজ পাঠাতে চান?", {
                    inline_keyboard: [
                        [
                            { text: '✅ Send to All Channels', callback_data: 'confirm_broadcast_channels' },
                            { text: '❌ Cancel', callback_data: 'cancel_broadcast' }
                        ]
                    ]
                });
                return;
            }

            if (aState?.action && text) {
                const act = aState.action;

                if (act === 'cfg_support') {
                    let link = text.trim();
                    if (link.startsWith('@')) link = 'https://t.me/' + link.slice(1);
                    setSetting('support_url', link);
                    cache.adminStates.delete(fromId);
                    sendMessage(chatId, `✅ <b>Support Bot Link Updated:</b>\n<code>${escapeHtml(link)}</code>`, getAdminMenu(isSuperAdmin(fromId)));
                    return;
                }

                if (act === 'cfg_pay_channel') {
                    sendMessage(chatId, "🔍 চ্যানেল ভেরিফাই করা হচ্ছে...");
                    const check = await verifyChannelAndBotAdmin(text);
                    if (!check.ok) {
                        sendMessage(chatId, check.error, getCancelKeyboard());
                        return;
                    }
                    setSetting('withdraw_request_channel', check.channel_id);
                    cache.adminStates.delete(fromId);
                    sendMessage(chatId, `✅ <b>Payment Channel Updated!</b>\n\n📢 ${escapeHtml(check.channel_title)}\n🆔 <code>${check.channel_id}</code>`, getAdminMenu(isSuperAdmin(fromId)));
                    return;
                }

                if (act === 'add_force_channel_input') {
                    sendMessage(chatId, "🔍 চ্যানেল ভেরিফাই করা হচ্ছে...");
                    const check = await verifyChannelAndBotAdmin(text);
                    if (!check.ok) {
                        sendMessage(chatId, check.error, getCancelKeyboard());
                        return;
                    }
                    cache.adminStates.set(fromId, {
                        action: 'add_force_channel_confirm',
                        channel_id: check.channel_id,
                        channel_title: check.channel_title,
                        channel_username: check.channel_username,
                        channel_link: check.channel_link
                    });
                    sendMessage(chatId, `✅ <b>চ্যানেল ভেরিফাইড!</b>\n📢 ${escapeHtml(check.channel_title)}\n\n🔘 বাটনের নাম লিখুন (যেমন: Join):`, getCancelKeyboard());
                    return;
                }

                if (act === 'add_force_channel_confirm') {
                    const btnName = text.trim() || aState.channel_title;
                    const chObj = {
                        channel_id: aState.channel_id,
                        channel_link: aState.channel_link || `https://t.me/${aState.channel_id}`,
                        channel_name: btnName,
                        channel_username: aState.channel_username || '',
                        added_by: fromId,
                        added_at: Math.floor(Date.now() / 1000)
                    };
                    const newKey = `fc_${Date.now()}`;
                    cache.forceChannels[newKey] = chObj;
                    cache.userChannels.clear();
                    firebaseRequest(`force_channels/${newKey}`, 'PUT', chObj).catch(() => {});
                    cache.adminStates.delete(fromId);
                    sendMessage(chatId, `🎉 <b>Force Join Channel Added!</b>\n\n📢 <b>${escapeHtml(btnName)}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    return;
                }

                if (act === 'cfg_coin') {
                    setSetting('coin_name', text.trim().toUpperCase());
                    cache.adminStates.delete(fromId);
                    sendMessage(chatId, `✅ <b>Coin Name Updated: ${escapeHtml(text.trim().toUpperCase())}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    return;
                }

                if (act === 'cfg_referral') {
                    if (isNumericAmount(text) && Number(text) >= 0) {
                        setSetting('referral_bonus', Number(text));
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Referral Bonus Updated: ${formatNumber(text)}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক সংখ্যা লিখুন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'cfg_withdraw') {
                    if (isNumericAmount(text) && Number(text) > 0) {
                        setSetting('min_withdraw', Number(text));
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Fixed Withdraw Updated: ${formatNumber(text)}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক সংখ্যা লিখুন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'cfg_first_refs') {
                    if (/^\d+$/.test(text)) {
                        setSetting('first_withdraw_refs', parseInt(text));
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>First Withdraw Referral Requirement: ${text} Refs</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক পূর্ণসংখ্যা দিন (যেমন: 4):", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'cfg_welcome') {
                    if (isNumericAmount(text) && Number(text) >= 0) {
                        setSetting('welcome_bonus', Number(text));
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Welcome Bonus Updated: ${formatNumber(text)}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক সংখ্যা লিখুন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'cfg_fee') {
                    if (isNumericAmount(text) && Number(text) >= 0 && Number(text) <= 100) {
                        setSetting('withdraw_fee_percent', Number(text));
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Withdrawal Fee Updated: ${formatNumber(text)}%</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ 0 থেকে 100 এর মধ্যে সংখ্যা দিন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'sec_add_bl') {
                    if (/^\d+$/.test(text)) {
                        cache.blacklist[text] = { added_by: fromId, added_at: Math.floor(Date.now() / 1000) };
                        firebaseRequest(`security/blacklist/${text}`, 'PUT', cache.blacklist[text]).catch(() => {});
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `🚫 <b>User ${text} Blacklist করা হয়েছে!</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক Numeric User ID দিন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'sec_rem_bl') {
                    if (/^\d+$/.test(text)) {
                        delete cache.blacklist[text];
                        firebaseRequest(`security/blacklist/${text}`, 'DELETE').catch(() => {});
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>User ${text}-কে Blacklist থেকে রিমুভ করা হয়েছে!</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক Numeric User ID দিন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'sec_add_wl') {
                    if (/^\d+$/.test(text)) {
                        cache.whitelist[text] = { added_by: fromId, added_at: Math.floor(Date.now() / 1000) };
                        firebaseRequest(`security/whitelist/${text}`, 'PUT', cache.whitelist[text]).catch(() => {});
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>User ${text} Whitelist করা হয়েছে!</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক Numeric User ID দিন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'sec_rem_wl') {
                    if (/^\d+$/.test(text)) {
                        delete cache.whitelist[text];
                        firebaseRequest(`security/whitelist/${text}`, 'DELETE').catch(() => {});
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `❌ <b>User ${text}-কে Whitelist থেকে রিমুভ করা হয়েছে!</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক Numeric User ID দিন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'add_balance_user') {
                    const target = await getUser(text);
                    if (!target) {
                        sendMessage(chatId, "❌ ইউজার পাওয়া যায়নি!", getCancelKeyboard());
                        return;
                    }
                    cache.adminStates.set(fromId, { action: 'add_balance_amount', target_id: text });
                    sendMessage(chatId, `👤 <b>${escapeHtml(target.first_name || 'User')}</b>\n💰 ব্যালেন্স: <b>${formatNumber(target.balance || 0)}</b>\n\nকত যোগ করতে চান?`, getCancelKeyboard());
                    return;
                }

                if (act === 'add_balance_amount') {
                    if (!isNumericAmount(text) || Number(text) <= 0) {
                        sendMessage(chatId, "❌ সঠিক Amount দিন:", getCancelKeyboard());
                        return;
                    }
                    const amt = Number(text);
                    const targetUser = await getUser(aState.target_id);
                    const coin = getSetting('coin_name', 'STAR');
                    if (targetUser) {
                        const newBal = Number(targetUser.balance || 0) + amt;
                        updateUser(aState.target_id, { balance: newBal });
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Added +${formatNumber(amt)} ${escapeHtml(coin)}</b>\n💰 New Balance: <b>${formatNumber(newBal)} ${escapeHtml(coin)}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                        sendMessage(aState.target_id, `🎁 <b>+${formatNumber(amt)} ${escapeHtml(coin)} added to your balance!</b>\n💰 Current Balance: <b>${formatNumber(newBal)} ${escapeHtml(coin)}</b>`).catch(() => {});
                    }
                    return;
                }

                if (act === 'cut_balance_user') {
                    const target = await getUser(text);
                    if (!target) {
                        sendMessage(chatId, "❌ ইউজার পাওয়া যায়নি!", getCancelKeyboard());
                        return;
                    }
                    cache.adminStates.set(fromId, { action: 'cut_balance_amount', target_id: text });
                    sendMessage(chatId, `👤 <b>${escapeHtml(target.first_name || 'User')}</b>\n💰 ব্যালেন্স: <b>${formatNumber(target.balance || 0)}</b>\n\nকত কাটতে চান?`, getCancelKeyboard());
                    return;
                }

                if (act === 'cut_balance_amount') {
                    if (!isNumericAmount(text) || Number(text) <= 0) {
                        sendMessage(chatId, "❌ সঠিক Amount দিন:", getCancelKeyboard());
                        return;
                    }
                    const amt = Number(text);
                    const targetUser = await getUser(aState.target_id);
                    const coin = getSetting('coin_name', 'STAR');
                    if (targetUser) {
                        const newBal = Math.max(0, Number(targetUser.balance || 0) - amt);
                        updateUser(aState.target_id, { balance: newBal });
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Deducted -${formatNumber(amt)} ${escapeHtml(coin)}</b>\n💰 New Balance: <b>${formatNumber(newBal)} ${escapeHtml(coin)}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                        sendMessage(aState.target_id, `⚠️ <b>-${formatNumber(amt)} ${escapeHtml(coin)} deducted from your balance!</b>\n💰 Current Balance: <b>${formatNumber(newBal)} ${escapeHtml(coin)}</b>`).catch(() => {});
                    }
                    return;
                }

                if (act === 'set_payouts_done') {
                    if (isNumericAmount(text) && Number(text) >= 0) {
                        const val = String(text).trim();
                        setSetting('custom_payouts_done', val);
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, `✅ <b>Payouts Done সেট করা হয়েছে:</b> <b>${val}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    } else {
                        sendMessage(chatId, "❌ সঠিক সংখ্যা পাঠান:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'create_gift_code') {
                    const parts = text.split('|').map(s => s.trim());
                    if (parts.length < 2 || !isNumericAmount(parts[1])) {
                        sendMessage(chatId, "❌ ফরম্যাট: <code>CODE | REWARD | USES</code> (যেমন: <code>BONUS5 | 5 | 50</code>)", getCancelKeyboard());
                        return;
                    }
                    const code = parts[0].toUpperCase();
                    const reward = Number(parts[1]);
                    const maxUses = parseInt(parts[2] || '100');

                    const giftData = {
                        code: code,
                        reward: reward,
                        max_uses: maxUses,
                        used_count: 0,
                        claimed_by: {},
                        created_at: Math.floor(Date.now() / 1000)
                    };

                    cache.giftCodes[code] = giftData;
                    firebaseRequest(`gift_codes/${code}`, 'PUT', giftData).catch(() => {});
                    cache.adminStates.delete(fromId);
                    sendMessage(chatId, `🎁 <b>Gift Code Created!</b>\n\n🔹 Code: <code>${escapeHtml(code)}</code>\n⭐ Reward: <b>${reward}</b>\n👥 Max Uses: <b>${maxUses}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                    return;
                }

                if (act === 'admin_add') {
                    if (/^\d+$/.test(text)) {
                        cache.admins[text] = { active: true, added_by: fromId, added_at: Math.floor(Date.now() / 1000) };
                        firebaseRequest(`admins/${text}`, 'PUT', cache.admins[text]).catch(() => {});
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, "🎉 <b>Admin Added Successfully!</b>", getAdminMenu(true));
                    } else {
                        sendMessage(chatId, "❌ সঠিক Numeric ID দিন:", getCancelKeyboard());
                    }
                    return;
                }

                if (act === 'admin_remove') {
                    if (/^\d+$/.test(text) && !isSuperAdmin(text)) {
                        delete cache.admins[text];
                        firebaseRequest(`admins/${text}`, 'DELETE').catch(() => {});
                        cache.adminStates.delete(fromId);
                        sendMessage(chatId, "✅ <b>Admin Removed Successfully!</b>", getAdminMenu(true));
                    } else {
                        sendMessage(chatId, "❌ Super Admin রিমুভ করা যাবে না:", getCancelKeyboard());
                    }
                    return;
                }
            }
        }

        // ---------------------------------------------------------
        // USER STATE: WITHDRAW TARGET INPUT
        // ---------------------------------------------------------
        if (!isAdm) {
            const uState = cache.userStates.get(fromId);
            if (uState?.action === 'withdraw_username' && text) {
                const target = normalizeWithdrawTarget(text);
                if (!isValidWithdrawTarget(target)) {
                    sendMessage(chatId, "❌ Invalid address! Provide Channel Username (e.g. <code>@channel</code>) or Post Link (e.g. <code>https://t.me/channel/123</code>):", getCancelKeyboard());
                    return;
                }

                const u = await getUser(fromId);
                const fixedAmount = Number(getSetting('min_withdraw', 3));
                const coinName = getSetting('coin_name', 'STAR');
                const currentBalance = Number(u?.balance || 0);

                if (currentBalance < fixedAmount) {
                    sendMessage(chatId, 
                        `⚠️ <b>Insufficient Balance</b>\n\n` +
                        `You need at least ${formatNumber(fixedAmount)} ${escapeHtml(coinName)} in your account to make a withdrawal.`, 
                        getUserMenu(fromId)
                    );
                    cache.userStates.delete(fromId);
                    return;
                }

                const isFirstWithdraw = !u?.has_withdrawn;
                const requiredRefs = Number(getSetting('first_withdraw_refs', 4));
                const userRefs = Number(u?.total_referrals || 0);

                if (isFirstWithdraw && requiredRefs > 0 && userRefs < requiredRefs) {
                    sendMessage(chatId, 
                        `🔐 <b>Withdrawal Locked</b>\n\n` +
                        `Refer ${requiredRefs} verified users to unlock Instant Withdrawal.\n` +
                        `You're just a few invites away from full access.\n` +
                        `Start sharing now and get rewarded instantly! 🚀`,
                        getUserMenu(fromId)
                    );
                    cache.userStates.delete(fromId);
                    return;
                }

                const fee = Number(getSetting('withdraw_fee_percent', 0));
                const afterFee = Math.max(0, fixedAmount - (fixedAmount * fee / 100));
                const txId = `${fromId}${Math.floor(Date.now() / 1000)}${Math.floor(1000 + Math.random() * 9000)}`;
                const reqChannel = getSetting('withdraw_request_channel', DEFAULT_PAYMENT_CHANNEL_ID);

                const withdrawTimestamp = Math.floor(Date.now() / 1000);
                const withdrawData = {
                    user_id: fromId,
                    first_name: msg.from.first_name || 'User',
                    telegram_username: msg.from.username ? `@${msg.from.username}` : 'N/A',
                    withdraw_username: target,
                    amount: fixedAmount,
                    fee_percent: fee,
                    after_fee: afterFee,
                    transaction_id: txId,
                    status: 'pending',
                    created_at: withdrawTimestamp
                };

                updateUser(fromId, { balance: Math.max(0, currentBalance - fixedAmount) });
                cache.userStates.delete(fromId);

                const created = await firebaseRequest('withdrawals', 'POST', withdrawData);
                if (created?.name) {
                    sendMessage(reqChannel, buildPendingAlertText(withdrawData), withdrawActionKeyboard(created.name));

                    let channelLinkText = 'Check Here';
                    let channelUrl = 'https://t.me/' + String(reqChannel).replace('@', '');
                    if (reqChannel.startsWith('-100')) {
                        channelUrl = `https://t.me/c/${reqChannel.replace('-100', '')}/999999999`;
                    }

                    const withdrawConfirmText =
                        `🎉 <b>Withdraw Request Submitted Successfully!</b>\n\n` +
                        `🌟 <b>Stars:</b> ${formatNumber(fixedAmount)} (🔁 <b>Fee:</b> ${formatNumber(fee)}%)\n\n` +
                        `🆔 <b>Transaction ID:</b> <code>${txId}</code>\n\n` +
                        `⏳ <b>Status:</b> Pending Approval – You’ll be notified shortly!\n\n` +
                        `📡 <b>Payment Channel:</b> 👉 <a href="${channelUrl}">[${channelLinkText}]</a>`;

                    sendMessage(chatId, withdrawConfirmText, getUserMenu(fromId));
                } else {
                    updateUser(fromId, { balance: currentBalance });
                    sendMessage(chatId, "⚠️ Failed to submit request. Balance refunded.", getUserMenu(fromId));
                }
                return;
            }
        }

        // ---------------------------------------------------------
        // USER COMMANDS & MENUS
        // ---------------------------------------------------------
        if (text.startsWith('/start')) {
            const politeStartText = `🌟 <b>Welcome to ${escapeHtml(BOT_NAME)}, ${escapeHtml(msg.from.first_name || 'User')}!</b>\n\nEarn rewards easily and withdraw directly.`;
            sendMessage(chatId, politeStartText, getUserMenu(fromId));
            return;
        }

        if (text === '🛠 Admin Panel') {
            if (!isAdm) return;
            cache.adminStates.delete(fromId);
            sendMessage(chatId, "🛠 <b>Admin Panel Activated</b>", getAdminMenu(isSuperAdmin(fromId)));
            return;
        }

        if (text === '🔙 Back to User Panel') {
            cache.adminStates.delete(fromId);
            cache.userStates.delete(fromId);
            sendMessage(chatId, "👤 <b>User Panel Activated</b>", getUserMenu(fromId));
            return;
        }

        // ১ 👥 Account
        if (text === '👥 Account' || text === '১ 👥 Account') {
            const u = await getUser(fromId);
            const coinName = getSetting('coin_name', 'STAR');
            const accText = 
                `👤 <b>User Profile</b>\n` +
                `🔹 <b>Name:</b> ${escapeHtml(msg.from.first_name || 'User')}\n` +
                `💰 <b>Balance:</b> ⭐ ${formatNumber(u?.balance || 0)} ${escapeHtml(coinName)}`;

            sendMessage(chatId, accText);
            return;
        }

        // ২ 📮 Referral
        if (text === '📮 Referral' || text === '২ 📮 Referral') {
            const u = await getUser(fromId);
            const refCount = Number(u?.total_referrals || 0);
            const refBonus = Number(getSetting('referral_bonus', 1));
            const coinName = getSetting('coin_name', 'STAR');
            const link = `https://t.me/${BOT_USERNAME}?start=${fromId}`;
            const shareText = encodeURIComponent(`🌟 Join and earn free ${coinName} on ${BOT_NAME}!\n\nLink: ${link}`);
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${shareText}`;

            const refMessage = 
                `🎉 <b>Get +${formatNumber(refBonus)}⭐️ for Every Friend You Invite!</b>\n` +
                `📎 <b>Your Link:</b> <code>${link}</code>\n` +
                `🔗 <b>Share it in Chats, Groups, Anywhere!</b>\n` +
                `💎 <b>Total Refer Count:</b> ${refCount}\n` +
                `🚀 <b>More invites = More stars!</b>`;

            sendMessage(chatId, refMessage, {
                inline_keyboard: [
                    [{ text: '🚀 Share Your Link', url: shareUrl }],
                    [{ text: '👥 My Invites', callback_data: 'my_invites' }]
                ]
            });
            return;
        }

        // ৩ 🎁 Gift Code
        if (text === '🎁 Gift Code' || text === '৩ 🎁 Gift Code') {
            const giftMsg = 
                `⚠️ <b>No Active Gift Codes Right Now</b>\n` +
                `🕰️ Try checking again in a while!`;
            sendMessage(chatId, giftMsg);
            return;
        }

        // ৪ 📊 Statistics
        if (text === '📊 Statistics' || text === '৪ 📊 Statistics') {
            const users = await getAllUsers();
            const totalUsersCount = Object.keys(users).length;
            const customPayouts = getSetting('custom_payouts_done', '72');
            const coinName = getSetting('coin_name', 'Star');

            const statusMessage = 
                `📡 <b>SYSTEM STATUS</b>\n` +
                `👥 <b>Users Count:</b> ${totalUsersCount} Users\n` +
                `⭐ <b>Payouts Done:</b> ${escapeHtml(customPayouts)} ${escapeHtml(coinName)}\n` +
                `🔧 <b>Source:</b> <a href="${DEVELOPER_LINK}">${escapeHtml(DEVELOPER_NAME)}</a>`;

            sendMessage(chatId, statusMessage);
            return;
        }

        // ৫ 🛒 Withdraw
        if (text === '🛒 Withdraw' || text === '৫ 🛒 Withdraw') {
            const u = await getUser(fromId);
            const bal = Number(u?.balance || 0);
            const fixedAmount = Number(getSetting('min_withdraw', 3));
            const coinName = getSetting('coin_name', 'STAR');

            if (bal < fixedAmount) {
                sendMessage(chatId, 
                    `⚠️ <b>Insufficient Balance</b>\n\n` +
                    `You need at least ${formatNumber(fixedAmount)} ${escapeHtml(coinName)} in your account to make a withdrawal.`
                );
                return;
            }

            const isFirstWithdraw = !u?.has_withdrawn;
            const requiredRefs = Number(getSetting('first_withdraw_refs', 4));
            const userRefs = Number(u?.total_referrals || 0);

            if (isFirstWithdraw && requiredRefs > 0 && userRefs < requiredRefs) {
                sendMessage(chatId, 
                    `🔐 <b>Withdrawal Locked</b>\n\n` +
                    `Refer ${requiredRefs} verified users to unlock Instant Withdrawal.\n` +
                    `You're just a few invites away from full access.\n` +
                    `Start sharing now and get rewarded instantly! 🚀`
                );
                return;
            }

            cache.userStates.set(fromId, { action: 'withdraw_username' });
            sendMessage(chatId, 
                `👉 <b>Enter your Username Or Post Link To Continue.</b>\n\n` +
                `❌ Reply with Cancel to exit without any action.`, 
                getCancelKeyboard()
            );
            return;
        }

        // ---------------------------------------------------------
        // ADMIN PANEL BUTTONS
        // ---------------------------------------------------------
        if (isAdm) {
            if (text.startsWith('🟢 Bot: Active (ON)') || text.startsWith('🔴 Bot: OFF (Maintenance)')) {
                const newStatus = cache.botActive ? 'off' : 'on';
                setSetting('bot_power_status', newStatus);
                sendMessage(chatId, `🔄 <b>Bot Status:</b> <b>${newStatus === 'on' ? '🟢 ONLINE' : '🔴 OFFLINE'}</b>`, getAdminMenu(isSuperAdmin(fromId)));
                return;
            }

            if (text === '⚙️ Central Settings') {
                sendMessage(chatId, "⚙️ <b>Central Configuration</b>:", centralSettingsKeyboard());
                return;
            }

            if (text.startsWith('🛡️ Security')) {
                sendMessage(chatId, "🛡️ <b>Security Management</b>:", securityKeyboard());
                return;
            }

            if (text === '👥 User & Balance') {
                sendMessage(chatId, "👥 <b>User & Balance Management</b>", balanceKeyboard());
                return;
            }

            if (text === '📢 Force Channels') {
                const count = Object.keys(cache.forceChannels).length;
                sendMessage(chatId, `📢 <b>FORCE JOIN CHANNELS</b>\n\nমোট চ্যানেল: <b>${count}</b> টি`, forceJoinKeyboard());
                return;
            }

            if (text === '📢 Channel Broadcast') {
                const entries = Object.entries(cache.forceChannels);
                if (!entries.length) {
                    sendMessage(chatId, "⚠️ কোনো চ্যানেল নেই!");
                    return;
                }

                const checkedResults = await Promise.all(entries.map(async ([key, ch]) => {
                    const isAdminThere = await isBotAdminInChat(ch.channel_id);
                    return { key, ch, isAdminThere };
                }));

                const inlineKb = [];
                let report = "📢 <b>চ্যানেল ব্রডকাস্ট প্যানেল</b>\n━━━━━━━━━━━━━━━━━━\n\n";

                for (const item of checkedResults) {
                    const statusText = item.isAdminThere ? "✅ Bot Admin" : "⚠️ Bot Not Admin";
                    report += `• <b>${escapeHtml(item.ch.channel_name || 'Channel')}</b>: ${statusText}\n`;
                    inlineKb.push([
                        { 
                            text: `${item.isAdminThere ? '📢' : '⚠️'} ${item.ch.channel_name || 'Channel'} (${statusText})`, 
                            callback_data: `bc_select_channel_${item.key}`
                        }
                    ]);
                }

                inlineKb.push([
                    { text: '📢 Broadcast to ALL Channels', callback_data: 'bc_all_channels' }
                ]);

                sendMessage(chatId, report, { inline_keyboard: inlineKb });
                return;
            }

            if (text === '📢 Users Broadcast') {
                cache.adminStates.set(fromId, { action: 'awaiting_broadcast_message' });
                sendMessage(chatId, "📢 <b>ইউজার ব্রডকাস্ট</b>\n\nসকল ইউজারের জন্য মেসেজটি পাঠান:", getCancelKeyboard());
                return;
            }

            if (text === '⭐ সেট Payouts Done') {
                cache.adminStates.set(fromId, { action: 'set_payouts_done' });
                const cur = getSetting('custom_payouts_done', '72');
                sendMessage(chatId, `⭐ <b>Payouts Done</b>\n\nবর্তমান মান: <b>${escapeHtml(cur)}</b>\nনতুন সংখ্যা পাঠান:`, getCancelKeyboard());
                return;
            }

            if (text === '🎁 Gift Codes') {
                cache.adminStates.set(fromId, { action: 'create_gift_code' });
                sendMessage(chatId, 
                    `🎁 <b>নতুন Gift Code তৈরি করুন</b>\n\n` +
                    `ফরম্যাট: <code>CODE | REWARD | USES</code>\n` +
                    `উদাহরণ: <code>FREE5 | 5 | 100</code>`, 
                    getCancelKeyboard()
                );
                return;
            }

            if (text === '👮 এডমিন ম্যানেজমেন্ট' && isSuperAdmin(fromId)) {
                sendMessage(chatId, "👮 <b>এডমিন ম্যানেজমেন্ট</b>", adminManagementKeyboard());
                return;
            }
        }
    }
}

/*
|--------------------------------------------------------------------------
| PRELOAD CACHE & EXPRESS WEB SERVER
|--------------------------------------------------------------------------
*/
async function preloadEngine() {
    console.log('⚡ Pre-warming Cache for 0ms Execution...');
    try {
        const [settings, admins, forceCh, bl, wl, gifts] = await Promise.all([
            firebaseRequest('settings'),
            firebaseRequest('admins'),
            firebaseRequest('force_channels'),
            firebaseRequest('security/blacklist'),
            firebaseRequest('security/whitelist'),
            firebaseRequest('gift_codes')
        ]);

        if (settings && typeof settings === 'object') {
            for (const [k, v] of Object.entries(settings)) cache.settings.set(k, v);
            cache.botActive = settings.bot_power_status !== 'off';
            cache.whitelistOnly = settings.whitelist_only_mode === 'on';
        }

        if (admins && typeof admins === 'object') cache.admins = admins;
        if (forceCh && typeof forceCh === 'object') cache.forceChannels = forceCh;
        if (bl && typeof bl === 'object') cache.blacklist = bl;
        if (wl && typeof wl === 'object') cache.whitelist = wl;
        if (gifts && typeof gifts === 'object') cache.giftCodes = gifts;

        console.log(`✅ RAM Cache Warmup Complete! ${BOT_NAME} is 100% Independent & Ready!`);
    } catch (e) {
        console.error('Preload warning:', e.message);
    }
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

app.post('/api/index', (req, res) => {
    res.status(200).send('OK');
    handleUpdate(req.body || {}).catch(err => {
        console.error('Instant Handler Error:', err);
    });
});

app.get('/api/index', (req, res) => {
    res.status(200).send('Turbo Webhook Active ⚡');
});

app.get('/ping', (req, res) => {
    res.status(200).send('Pong 🏓');
});

app.get('/', (req, res) => {
    res.status(200).send(`${BOT_NAME} is running independently 🚀`);
});

// Render 24/7 Keep-Alive Worker
setInterval(() => {
    fetch(`${APP_URL}/ping`).catch(() => {});
}, 8 * 60 * 1000);

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    await preloadEngine();
    try {
        const webhookUrl = `${APP_URL}/api/index`;
        const res = await telegramApi('setWebhook', { url: webhookUrl, drop_pending_updates: true });
        console.log('Webhook Setup:', res);
    } catch (err) {
        console.error('Webhook Setup Error:', err);
    }
});
