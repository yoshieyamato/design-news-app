const articlesEl = document.getElementById("articles");
const loadingEl = document.getElementById("loading");
const sourceBtns = document.querySelectorAll(".source-btn");
const zennFilters = document.getElementById("zenn-filters");
const devtoFilters = document.getElementById("devto-filters");

let currentSource = "zenn";
let currentSort = "latest";

// ========== Zenn ==========
async function fetchZenn(tag) {
  const order = currentSort === "popular" ? "trending" : "latest";
  const res = await fetch(
    `https://zenn.dev/api/articles?topic=${encodeURIComponent(tag)}&order=${order}&count=15`
  );
  if (!res.ok) throw new Error(`Zenn API error: ${res.status}`);
  const data = await res.json();
  const articles = data.articles || [];
  return articles.map((a) => ({
    title: a.title,
    url: `https://zenn.dev${a.path}`,
    author: a.user?.username || "",
    date: new Date(a.published_at).toLocaleDateString("ja-JP"),
    tags: [tag],
    likes: a.liked_count,
    source: "Zenn",
  }));
}

// ========== Dev.to ==========
async function fetchDevto(tag) {
  // 人気順はtopパラメータで直近30日の人気記事を取得
  const url = currentSort === "popular"
    ? `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=15&top=30`
    : `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=15`;
  const res = await fetch(url);
  const data = await res.json();
  return data.map((a) => ({
    title: a.title,
    url: a.url,
    author: a.user.name,
    date: new Date(a.published_at).toLocaleDateString("ja-JP"),
    tags: a.tag_list.slice(0, 4),
    likes: a.positive_reactions_count,
    source: "Dev.to",
  }));
}

// ========== 記事表示 ==========
async function fetchArticles(tag) {
  loadingEl.style.display = "block";
  articlesEl.innerHTML = "";

  try {
    const articles =
      currentSource === "zenn"
        ? await fetchZenn(tag)
        : await fetchDevto(tag);

    loadingEl.style.display = "none";

    if (articles.length === 0) {
      articlesEl.innerHTML =
        "<p class='empty'>記事が見つかりませんでした</p>";
      return;
    }

    articles.forEach((a) => articlesEl.appendChild(createCard(a)));
  } catch (err) {
    loadingEl.textContent = `エラー: ${err.message}`;
    console.error(err);
  }
}

// ========== カード作成 ==========
function createCard(article) {
  const a = document.createElement("a");
  a.href = article.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "card";

  a.innerHTML = `
    <div class="card-body">
      <div class="card-header">
        <span class="card-source ${article.source === "Zenn" ? "zenn" : "devto"}">${article.source}</span>
        <span class="card-likes">♥ ${article.likes}</span>
      </div>
      <div class="card-title">${article.title}</div>
      <div class="card-tags">
        ${article.tags.map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
      <div class="card-meta">
        <span>by ${article.author}</span>
        <span>${article.date}</span>
      </div>
    </div>
  `;

  return a;
}

// ========== 並べ替え ==========
const sortBtns = document.querySelectorAll(".sort-btn");
sortBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    sortBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    const filters = currentSource === "zenn" ? zennFilters : devtoFilters;
    fetchArticles(filters.querySelector(".filter-btn.active").dataset.tag);
  });
});

// ========== ソース切り替え ==========
sourceBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    sourceBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentSource = btn.dataset.source;

    if (currentSource === "zenn") {
      zennFilters.style.display = "flex";
      devtoFilters.style.display = "none";
      fetchArticles(zennFilters.querySelector(".filter-btn.active").dataset.tag);
    } else {
      zennFilters.style.display = "none";
      devtoFilters.style.display = "flex";
      fetchArticles(devtoFilters.querySelector(".filter-btn.active").dataset.tag);
    }
  });
});

// ========== フィルター切り替え ==========
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("filter-btn")) return;
  const parent = e.target.closest(".filters");
  parent.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  e.target.classList.add("active");
  fetchArticles(e.target.dataset.tag);
});

// 初期表示
fetchArticles("design");
