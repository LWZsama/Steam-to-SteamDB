// ==UserScript==
// @name         Steam-to-SteamDB
// @namespace    https://github.com/LWZsama
// @author       Wenze(Lucas) Luo
// @license      MIT
// @version      1.0.1
// @description  Adds a native-styled button on Steam store pages to jump to the SteamDB page for quick price check.
// @match        https://store.steampowered.com/app/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/LWZsama/Steam-to-SteamDB/refs/heads/main/Steam-to-SteamDB.user.js
// @updateURL    https://raw.githubusercontent.com/LWZsama/Steam-to-SteamDB/refs/heads/main/Steam-to-SteamDB.user.js
// ==/UserScript==

(() => {
  "use strict";

  // 唯一 ID，用于识别插入的区块，防止重复插入
  const WRAP_ID = "steamdb_btn_wrapper";

  //从 URL 中提取 AppID, 例如从 /app/730/CounterStrike_2/ 中提取 730
  function getAppId() {
      const m = location.pathname.match(/^\/app\/(\d+)(\/|$)/);
      return m ? m[1] : null;
  }

  // 生成跳转到 SteamDB 的完整 URL
  function steamDbUrl(appid) {
      return `https://steamdb.info/app/${appid}/`;
  }

  // 构建 HTML 结构
  function buildWrapper(appid) {
      const wrapper = document.createElement("div");
      wrapper.className = "game_area_purchase_game_wrapper";
      wrapper.id = WRAP_ID;

      const regionId = `steamdb_region_${appid}`;
      const labelId = `steamdb_label_${appid}`;

      // 使用 Steam 官方的 CSS 类名，确保风格一致
      wrapper.innerHTML = `
      <div class="game_area_purchase_game" id="${regionId}" role="region" aria-labelledby="${labelId}">
        <h2 id="${labelId}" class="title">跳转至 SteamDB</h2>
        <div class="game_purchase_action">
          <div class="game_purchase_action_bg">
            <div class="btn_addtocart">
              <a data-panel="{&quot;focusable&quot;:true,&quot;clickOnActivate&quot;:true}"
                 role="button"
                 class="btn_green_steamui btn_medium"
                 href="${steamDbUrl(appid)}"
                 target="_blank"
                 rel="noopener noreferrer">
                <span>跳转</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
      return wrapper;
  }

  function injectOnce() {
      const appid = getAppId();
      if (!appid) return;

      // 定位 Steam 存放购买选项的容器
      const purchaseRoot = document.getElementById("game_area_purchase");
      if (!purchaseRoot) return;

      // 如果页面上已经存在该按钮，则跳过，避免重复生成
      if (document.getElementById(WRAP_ID)) return;

      // 尝试找到第一个购买选项区块，并将跳转按钮插在它前面
      const firstWrapper = purchaseRoot.querySelector(".game_area_purchase_game_wrapper");
      const node = buildWrapper(appid);

      if (firstWrapper) {
          firstWrapper.insertAdjacentElement("beforebegin", node);
      } else {
          // 如果找不到现成的区块，直接放入购买区域的最顶部
          purchaseRoot.prepend(node);
      }
  }

  // 确保 UI 操作在浏览器渲染帧时进行
  let scheduled = false;
  function scheduleInject() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
          scheduled = false;
          injectOnce();
      });
  }

  function boot() {
      injectOnce();

      // 确保购买区存在
      const purchaseRoot = document.getElementById("game_area_purchase");
      if (!purchaseRoot) return;

      // 确保页面变化后，按钮依然能存在。
      const mo = new MutationObserver(() => scheduleInject());
      mo.observe(purchaseRoot, { childList: true, subtree: true });
  }

  // 确保在页面加载完成后启动
  if (document.readyState === "complete" || document.readyState === "interactive") {
      boot();
  } else {
      window.addEventListener("DOMContentLoaded", boot, { once: true });
  }
})();
