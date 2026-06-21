document.addEventListener("DOMContentLoaded", loadAdminSidebar);

async function loadAdminSidebar() {
  const sidebar = document.querySelector("#adminSidebar");
  if (!sidebar) return;

  try {
    const response = await fetch("../components/admin-sidebar/admin-sidebar.html");
    if (!response.ok) throw new Error("Failed to load admin sidebar");

    sidebar.innerHTML = await response.text();

    setActiveAdminLink();
    bindAdminSidebarToggles();
  } catch (error) {
    console.error("Admin Sidebar Error:", error);
  }
}

function bindAdminSidebarToggles() {
  const toggles = document.querySelectorAll("#adminSidebar .admin-nav-toggle");

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const group = toggle.closest(".admin-nav-group");
      if (!group) return;

      group.classList.toggle("is-open");
    });
  });
}

function setActiveAdminLink() {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll("#adminSidebar a").forEach(link => {
    const linkPage = link.getAttribute("href")?.split("?")[0]?.split("#")[0];

    if (linkPage === currentPage) {
      link.classList.add("active");

      const group = link.closest(".admin-nav-group");
      if (group) group.classList.add("is-open");
    }
  });
}