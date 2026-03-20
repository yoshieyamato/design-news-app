const articlesEl = document.getElementById("articles");
const loadingEl = document.getElementById("loading");
const sourceBtns = document.querySelectorAll(".source-btn");
const qiitaFilters = document.getElementById("qiita-filters");
const devtoFilters = document.getElementById("devto-filters");

let currentSource = "qiita";
let currentSort = "latest";

// ========== Qiita ==========
async function fetchQiita(tag) {
  // 人気順の場合は多めに取得してlikes_countで並べ替え
  const perPage = currentSort === "popular" ? 30 : 15;
  const res = await fetch(
    `https://qiita.com/api/v2/items?query=tag:${encodeURIComponent(tag)}&per_page=${perPage}`
  );
  const data = await res.json();
  const articles = data.map((a) => ({
    title: a.title,
    url: a.url,
    author: a.user.id,
    date: new Date(a.created_at).toLocaleDateString("ja-JP"),
    tags: a.tags.slice(0, 4).map((t) => t.name),
    likes: a.likes_count,
    source: "Qiita",
  }));
  if (currentSort === "popular") {
    articles.sort((a, b) => b.likes - a.likes);
    return articles.slice(0, 15);
  }
  return articles;
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
      currentSource === "qiita"
        ? await fetchQiita(tag)
        : await fetchDevto(tag);

    loadingEl.style.display = "none";

    if (articles.length === 0) {
      articlesEl.innerHTML =
        "<p class='empty'>記事が見つかりませんでした</p>";
      return;
    }

    articles.forEach((a) => articlesEl.appendChild(createCard(a)));
  } catch (err) {
    loadingEl.textContent = "記事の読み込みに失敗しました。";
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
        <span class="card-source ${article.source === "Qiita" ? "qiita" : "devto"}">${article.source}</span>
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
    const filters = currentSource === "qiita" ? qiitaFilters : devtoFilters;
    fetchArticles(filters.querySelector(".filter-btn.active").dataset.tag);
  });
});

// ========== ソース切り替え ==========
sourceBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    sourceBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentSource = btn.dataset.source;

    if (currentSource === "qiita") {
      qiitaFilters.style.display = "flex";
      devtoFilters.style.display = "none";
      fetchArticles(qiitaFilters.querySelector(".filter-btn.active").dataset.tag);
    } else {
      qiitaFilters.style.display = "none";
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
fetchArticles("UIデザイン");
