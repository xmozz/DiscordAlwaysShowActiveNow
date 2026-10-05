/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";

import activeNowStyle from "./style.css?managed";

let filterObserver: MutationObserver | null = null;

function isVoiceCard(card: Element): boolean {
    const text = (card.textContent ?? "").toLowerCase();
    return (
        text.includes("in a voice channel") ||
        text.includes("in voice") ||
        text.includes("voice channel") ||
        text.includes("voice chat")
    );
}

function updateActivityFilters() {
    const column = document.querySelector('[class*="nowPlayingColumn_"]');
    if (!column) return;
    applyHeaderText();
    const cards = column.querySelectorAll('[class*="itemCard_"]');
    cards.forEach(card => {
        const el = card as HTMLElement;
        if (settings.store.hideEverythingExceptVoice) {
            const keep = isVoiceCard(el);
            el.style.display = keep ? "" : "none";
            if (!keep) el.dataset.asaHidden = "1";
            else delete el.dataset.asaHidden;
        } else if (el.dataset.asaHidden === "1") {
            el.style.display = "";
            delete el.dataset.asaHidden;
        }
    });
}

function startFilterObserver() {
    stopFilterObserver();
    filterObserver = new MutationObserver(() => updateActivityFilters());
    filterObserver.observe(document.body, { childList: true, subtree: true });
}

function stopFilterObserver() {
    filterObserver?.disconnect();
    filterObserver = null;
}

function clearActivityFilters() {
    document
        .querySelectorAll('[class*="nowPlayingColumn_"] [class*="itemCard_"][data-asa-hidden="1"]')
        .forEach(card => {
            const el = card as HTMLElement;
            el.style.display = "";
            delete el.dataset.asaHidden;
        });
}

function applyHeaderText() {
    const column = document.querySelector('[class*="nowPlayingColumn"]');
    if (!column) return;
    // Automatic: show "In VoiceChat now" while voice-only mode is on,
    // otherwise restore Discord's default "Active Now".
    const custom = settings.store.hideEverythingExceptVoice ? "In VoiceChat now" : "";
    const candidates = column.querySelectorAll('h1, h2, h3, [class*="header"], [class*="title"], [class*="heading"]');
    candidates.forEach(candidate => {
        const el = candidate as HTMLElement;
        // Skip containers that hold the cards themselves
        if (el.querySelector('[class*="itemCard"]')) return;
        const current = (el.textContent ?? "").trim();
        if (
            current.toLowerCase() === "active now" ||
            current.toLowerCase() === "in voicechat now" ||
            el.dataset.asaHeader === "1"
        ) {
            if (!el.dataset.asaOriginal) el.dataset.asaOriginal = current;
            if (custom) {
                el.dataset.asaHeader = "1";
                // Only replace plain-text headers to avoid wiping nested icons/buttons
                if (el.childElementCount === 0) el.textContent = custom;
                else {
                    const textNode = Array.from(el.childNodes).find(
                        n => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0
                    );
                    if (textNode) textNode.textContent = ` ${custom} `;
                }
            } else if (el.dataset.asaHeader === "1") {
                const original = el.dataset.asaOriginal ?? "Active Now";
                if (el.childElementCount === 0) el.textContent = original;
                else {
                    const textNode = Array.from(el.childNodes).find(
                        n => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0
                    );
                    if (textNode) textNode.textContent = ` ${original} `;
                }
                delete el.dataset.asaHeader;
            }
        }
    });
}

function clearHeaderText() {
    document
        .querySelectorAll('[class*="nowPlayingColumn"] [data-asa-header="1"]')
        .forEach(candidate => {
            const el = candidate as HTMLElement;
            const original = el.dataset.asaOriginal ?? "Active Now";
            if (el.childElementCount === 0) el.textContent = original;
            else {
                const textNode = Array.from(el.childNodes).find(
                    n => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0
                );
                if (textNode) textNode.textContent = ` ${original} `;
            }
            delete el.dataset.asaHeader;
            delete el.dataset.asaOriginal;
        });
}

function updateVisibility() {
    const shouldHide = window.innerWidth < settings.store.hideBelowWidth;
    document.body.classList.toggle("asa-hide-now", shouldHide);
}

function applySettings() {
    document.documentElement.style.setProperty("--asa-width", `${settings.store.columnWidth}px`);
    document.body.classList.toggle("asa-compact", settings.store.compactMode);
    document.body.classList.toggle("asa-hide-voice", !settings.store.showVoiceActivity);
    document.body.classList.toggle("asa-hide-non-voice", settings.store.hideEverythingExceptVoice);
    updateVisibility();
    updateActivityFilters();
}

const settings = definePluginSettings({
    alwaysShow: {
        type: OptionType.BOOLEAN,
        description: "Keep Active Now visible on narrower windows than Discord allows by default",
        default: true,
        onChange: v => (v ? enableStyle(activeNowStyle) : disableStyle(activeNowStyle)),
    },
    hideBelowWidth: {
        type: OptionType.NUMBER,
        description: "Hide Active Now only below this window width in px (default is roughly half of Discord's breakpoint)",
        default: 650,
        min: 400,
        max: 1200,
        step: 10,
        onChange: () => updateVisibility(),
    },
    columnWidth: {
        type: OptionType.NUMBER,
        description: "Width of the Active Now column in px",
        default: 360,
        min: 240,
        max: 480,
        step: 10,
        onChange: () => applySettings(),
    },
    compactMode: {
        type: OptionType.BOOLEAN,
        description: "More compact cards (less padding, ideal for narrow windows)",
        default: false,
        onChange: () => applySettings(),
    },
    showVoiceActivity: {
        type: OptionType.BOOLEAN,
        description: "Show Voice Channel activity in Active Now (off = hide voice cards)",
        default: true,
        onChange: () => applySettings(),
    },
    hideEverythingExceptVoice: {
        type: OptionType.BOOLEAN,
        description: "Hide everything except voice activity (games, Spotify, launcher, etc.). Header then shows \"In VoiceChat now\".",
        default: false,
        onChange: () => applySettings(),
    },
});

export default definePlugin({
    name: "AlwaysShowActiveNow",
    description: "Lowers the breakpoint at which Discord hides the Active Now column. Can also hide Voice Channel activity or hide everything except Voice Channel activity.",
    authors: [
        {
            name: "xmozz",
            id: 0n,
        },
    ],
    settings,

    start() {
        enableStyle(activeNowStyle);
        if (!settings.store.alwaysShow) disableStyle(activeNowStyle);
        applySettings();
        window.addEventListener("resize", updateVisibility);
        startFilterObserver();
    },

    stop() {
        window.removeEventListener("resize", updateVisibility);
        stopFilterObserver();
        clearActivityFilters();
        clearHeaderText();
        disableStyle(activeNowStyle);
        document.documentElement.style.removeProperty("--asa-width");
        document.body.classList.remove("asa-compact", "asa-hide-now", "asa-hide-voice", "asa-hide-non-voice");
    },
});
