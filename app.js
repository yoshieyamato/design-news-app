const articlesEl = document.getElementById("articles");
const loadingEl = document.getElementById("loading");
const filterBtns = document.querySelectorAll(".filter-btn");

// 記事を取得して表示する
async function fetchArticles(tag) {
  loadingEl.style.display = "block";
  articlesEl.innerHTML = "";

  try {
    const res = await fetch(
      `https://qiita.com/api/v2/items?query=tag:${tag}&per_page=12`
    );
    const articles = await res.json();

    loadingEl.style.display = "none";

    if (!Array.isArray(articles) || articles.length === 0) {
      articlesEl.innerHTML = "<p style='text-align:center;color:#888;padding:40px'>記事が見つかりませんでした</p>";
      return;
    }

    articles.forEach((article) => {
      const card = createCard(article);
      articlesEl.appendChild(card);
    });
  } catch (err) {
    loadingEl.textContent = "記事の読み込みに失敗しました。時間をおいて再試行してください。";
  }
}

// カード要素を作成する
function createCard(article) {
  const a = document.createElement("a");
  a.href = article.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.className = "card";

  const tags = article.tags.slice(0, 3).map((t) => t.name);
  const date = new Date(article.created_at).toLocaleDateString("ja-JP");

  a.innerHTML = `
    <div class="card-body">
      <div class="card-title">${article.title}</div>
      <div class="card-tags">
        ${tags.map((t) => `<span class="tag">${t}</span>`).join("")}
      </div>
      <div class="card-meta">
        <span>by ${article.user.id}</span>
        <span>${date}</span>
      </div>
    </div>
  `;

  return a;
}

// フィルターボタンのクリックイベント
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    fetchArticles(btn.dataset.tag);
  });
});

// 初期表示
fetchArticles("Design");
