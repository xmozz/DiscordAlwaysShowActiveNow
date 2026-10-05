/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import definePlugin, { OptionType } from "@utils/types";

import activeNowStyle from "./style.css?managed";

function updateVisibility() {
    const shouldHide = window.innerWidth < settings.store.hideBelowWidth;
    document.body.classList.toggle("asa-hide-now", shouldHide);
}

function applySettings() {
    document.documentElement.style.setProperty("--asa-width", `${settings.store.columnWidth}px`);
    document.body.classList.toggle("asa-compact", settings.store.compactMode);
    updateVisibility();
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
});

export default definePlugin({
    name: "AlwaysShowActiveNow",
    description: "Lowers the breakpoint at which Discord hides the Active Now column.",
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
    },

    stop() {
        window.removeEventListener("resize", updateVisibility);
        disableStyle(activeNowStyle);
        document.documentElement.style.removeProperty("--asa-width");
        document.body.classList.remove("asa-compact", "asa-hide-now");
    },
});
