const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("usernameInput");

const battleForm = document.getElementById("battleForm");
const firstUserInput = document.getElementById("firstUserInput");
const secondUserInput = document.getElementById("secondUserInput");

const singleModeBtn = document.getElementById("singleModeBtn");
const battleModeBtn = document.getElementById("battleModeBtn");
const singleSearchPanel = document.getElementById("singleSearchPanel");
const battlePanel = document.getElementById("battlePanel");

const loader = document.getElementById("loader");
const messageBox = document.getElementById("messageBox");
const profileContainer = document.getElementById("profileContainer");
const reposContainer = document.getElementById("reposContainer");
const battleResult = document.getElementById("battleResult");

const API_BASE_URL = "https://api.github.com/users/";

function showLoader() {
    loader.classList.remove("hidden");
}

function hideLoader() {
    loader.classList.add("hidden");
}

function showMessage(message) {
    messageBox.textContent = message;
    messageBox.classList.remove("hidden");
}

function clearMessage() {
    messageBox.textContent = "";
    messageBox.classList.add("hidden");
}

function clearUI() {
    profileContainer.innerHTML = "";
    reposContainer.innerHTML = "";
    battleResult.innerHTML = "";
    clearMessage();
}

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "short"
    });
}

async function fetchGitHubUser(username) {
    const response = await fetch(`${API_BASE_URL}${username}`);

    if (!response.ok) {
        throw new Error("User Not Found");
    }

    return response.json();
}

async function fetchUserRepos(reposUrl) {
    const response = await fetch(`${reposUrl}?sort=updated&per_page=100`);

    if (!response.ok) {
        throw new Error("Repositories not found");
    }

    return response.json();
}

function renderProfile(user) {
    const portfolioUrl = user.blog
        ? user.blog.startsWith("http")
            ? user.blog
            : `https://${user.blog}`
        : "";

    profileContainer.innerHTML = `
    <article class="profile-card">
      <img src="${user.avatar_url}" alt="${user.login} avatar">

      <div class="profile-info">
        <h2>${user.name || user.login}</h2>
        <p>${user.bio || "No bio available."}</p>
        <p><strong>Joined:</strong> ${formatDate(user.created_at)}</p>
        <p><strong>Public Repos:</strong> ${user.public_repos}</p>

        <p>
          <strong>Portfolio:</strong>
          ${portfolioUrl
            ? `<a href="${portfolioUrl}" target="_blank" rel="noopener noreferrer">Visit Website</a>`
            : "Not available"
        }
        </p>

        <p>
          <a href="${user.html_url}" target="_blank" rel="noopener noreferrer">
            View GitHub Profile
          </a>
        </p>
      </div>
    </article>
  `;
}

function renderRepos(repos) {
    const latestRepos = repos.slice(0, 5);

    if (latestRepos.length === 0) {
        reposContainer.innerHTML = `
      <section class="repos-card">
        <h3>Latest Repositories</h3>
        <p>No repositories found.</p>
      </section>
    `;
        return;
    }

    const repoItems = latestRepos
        .map((repo) => {
            return `
        <div class="repo-item">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
            ${repo.name}
          </a>
          <p>Updated: ${formatDate(repo.updated_at)}</p>
          <p>⭐ ${repo.stargazers_count} stars</p>
        </div>
      `;
        })
        .join("");

    reposContainer.innerHTML = `
    <section class="repos-card">
      <h3>Top 5 Latest Repositories</h3>
      <div class="repo-list">
        ${repoItems}
      </div>
    </section>
  `;
}

async function handleProfileSearch(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();

    if (!username) {
        showMessage("Please enter a GitHub username.");
        return;
    }

    clearUI();
    showLoader();

    try {
        const user = await fetchGitHubUser(username);
        const repos = await fetchUserRepos(user.repos_url);

        renderProfile(user);
        renderRepos(repos);
    } catch (error) {
        showMessage("User Not Found. Please try another username.");
    } finally {
        hideLoader();
    }
}

function calculateTotalStars(repos) {
    return repos.reduce((total, repo) => total + repo.stargazers_count, 0);
}

async function getBattleData(username) {
    const user = await fetchGitHubUser(username);
    const repos = await fetchUserRepos(user.repos_url);

    return {
        user,
        totalStars: calculateTotalStars(repos)
    };
}

function renderBattleCard(data, status) {
    return `
    <article class="battle-card ${status}">
      <h3>${data.user.name || data.user.login}</h3>
      <p>${data.user.bio || "No bio available."}</p>
      <p><strong>Total Stars:</strong> ${data.totalStars}</p>
      <p><strong>Public Repos:</strong> ${data.user.public_repos}</p>
      <p><strong>Status:</strong> ${status === "winner" ? "Winner" : "Loser"}</p>
    </article>
  `;
}

async function handleBattleSearch(event) {
    event.preventDefault();

    const firstUsername = firstUserInput.value.trim();
    const secondUsername = secondUserInput.value.trim();

    if (!firstUsername || !secondUsername) {
        showMessage("Please enter both GitHub usernames.");
        return;
    }

    clearUI();
    showLoader();

    try {
        const [firstData, secondData] = await Promise.all([
            getBattleData(firstUsername),
            getBattleData(secondUsername)
        ]);

        const firstStatus =
            firstData.totalStars >= secondData.totalStars ? "winner" : "loser";

        const secondStatus =
            secondData.totalStars > firstData.totalStars ? "winner" : "loser";

        battleResult.innerHTML = `
      <section class="battle-grid">
        ${renderBattleCard(firstData, firstStatus)}
        ${renderBattleCard(secondData, secondStatus)}
      </section>
    `;
    } catch (error) {
        showMessage("One or both GitHub users were not found.");
    } finally {
        hideLoader();
    }
}

singleModeBtn.addEventListener("click", () => {
    singleSearchPanel.classList.remove("hidden");
    battlePanel.classList.add("hidden");

    singleModeBtn.classList.add("active");
    battleModeBtn.classList.remove("active");

    clearUI();
});

battleModeBtn.addEventListener("click", () => {
    battlePanel.classList.remove("hidden");
    singleSearchPanel.classList.add("hidden");

    battleModeBtn.classList.add("active");
    singleModeBtn.classList.remove("active");

    clearUI();
});

searchForm.addEventListener("submit", handleProfileSearch);
battleForm.addEventListener("submit", handleBattleSearch);