const state = {
  tab: "apps",
  query: "",
  items: []
};

const grid = document.querySelector("#grid");
const empty = document.querySelector("#empty");
const count = document.querySelector("#count");
const status = document.querySelector("#syncStatus");
const sectionTitle = document.querySelector("#sectionTitle");
const search = document.querySelector("#search");

const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}


/* =========================================================
   NORMALIZE CATEGORY
   ========================================================= */

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}


/* =========================================================
   DRIVE URL
   ========================================================= */

function driveUrl(id) {
  return `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
}


/* =========================================================
   CATEGORY CHECK
   ========================================================= */

function isCorrectCategory(item) {

  const category =
    normalizeCategory(item.category);

  const type =
    normalizeCategory(item.type);


  if (state.tab === "apps") {

    return (
      category === "apps" ||
      type === "apk"
    );

  }


  if (state.tab === "exploits") {

    return (
      category === "exploit" ||
      category === "exploits" ||
      type === "security research" ||
      type === "exploit"
    );

  }


  return false;
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

  const query =
    state.query
      .trim()
      .toLowerCase();


  const filtered =
    state.items.filter(item => {

      if (!isCorrectCategory(item)) {
        return false;
      }


      if (!query) {
        return true;
      }


      const searchableText = `
        ${item.name || ""}
        ${item.description || ""}
        ${item.type || ""}
        ${item.version || ""}
        ${item.category || ""}
      `.toLowerCase();


      return searchableText.includes(query);

    });


  if (sectionTitle) {

    sectionTitle.textContent =
      state.tab === "apps"
        ? "Apps & utilities"
        : "Exploits & security research";

  }


  if (count) {

    count.textContent =
      `${filtered.length} item${
        filtered.length === 1
          ? ""
          : "s"
      }`;

  }


  if (empty) {
    empty.hidden =
      filtered.length !== 0;
  }


  grid.innerHTML =
    filtered
      .map(item => {

        const category =
          normalizeCategory(
            item.category
          );


        const icon =
          item.iconPath

            ? `
              <img
                src="${escapeHtml(item.iconPath)}"
                alt=""
                loading="lazy"
              >
            `

            : `
              <div class="fallback">
                ${
                  category === "exploit" ||
                  category === "exploits"
                    ? "🛡️"
                    : "📦"
                }
              </div>
            `;


        const download =
          item.downloadUrl ||
          (
            item.driveId
              ? driveUrl(item.driveId)
              : "#"
          );


        return `
          <article class="card">

            <div class="cover">
              ${icon}
            </div>


            <div class="card-body">

              <span class="kicker">
                ${escapeHtml(
                  item.type ||
                  item.category ||
                  "Item"
                )}
              </span>


              <h3>
                ${escapeHtml(
                  item.name ||
                  "Untitled item"
                )}
              </h3>


              <p class="description">
                ${escapeHtml(
                  item.description ||
                  "No description provided."
                )}
              </p>


              <div class="meta">

                ${
                  item.version
                    ? `
                      <span class="pill">
                        v${escapeHtml(
                          item.version
                        )}
                      </span>
                    `
                    : ""
                }


                ${
                  item.size
                    ? `
                      <span class="pill">
                        ${escapeHtml(
                          item.size
                        )}
                      </span>
                    `
                    : ""
                }

              </div>


              <a
                class="download"
                href="${escapeHtml(download)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open download ↗
              </a>

            </div>

          </article>
        `;

      })
      .join("");

}


/* =========================================================
   LOAD CATALOG
   ========================================================= */

async function loadCatalog() {

  try {

    const response =
      await fetch(
        `./data/catalog.json?cache=${Date.now()}`
      );


    if (!response.ok) {

      throw new Error(
        `Catalog request failed: ${response.status}`
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "catalog.json is not an array."
      );

    }


    state.items = data;


    console.log(
      "FireForge catalog:",
      state.items
    );


    if (status) {
      status.textContent =
        "Catalog synced";
    }


  } catch (error) {

    console.error(
      "FireForge catalog error:",
      error
    );


    state.items = [];


    if (status) {
      status.textContent =
        "Catalog unavailable";
    }

  }


  render();

}


/* =========================================================
   TABS
   ========================================================= */

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        state.tab =
          button.dataset.tab;


        document
          .querySelectorAll(".tab")
          .forEach(tab => {

            tab.classList.toggle(
              "active",
              tab === button
            );

          });


        render();

      }
    );

  });


/* =========================================================
   SEARCH
   ========================================================= */

if (search) {

  search.addEventListener(
    "input",
    event => {

      state.query =
        event.target.value;

      render();

    }
  );

}


/* =========================================================
   "/" SEARCH SHORTCUT
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "/" &&
      document.activeElement !== search
    ) {

      event.preventDefault();

      if (search) {
        search.focus();
      }

    }

  }
);


/* =========================================================
   START
   ========================================================= */

loadCatalog();
