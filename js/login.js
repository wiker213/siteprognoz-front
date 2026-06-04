function showStatus(type, text) {
  const el = document.getElementById("loginStatus");
  el.className = "out " + (type || "");
  el.textContent = text;
}

document.getElementById("btnLogin").addEventListener("click", async () => {
  const login = document.getElementById("login").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!login || !password) {
    showStatus("err", "Введите логин и пароль");
    return;
  }

  try {
    const res = await apiPost("/auth/login", {
      login,
      password
    });

    if (res.access_token) {
      saveAccessToken(res.access_token);
    }

    showStatus("ok", "Успешный вход. Перенаправляю...");

    setTimeout(() => {
      if (res.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "account.html";
      }
    }, 500);

  } catch (e) {
    showStatus("err", e.message || "Ошибка входа");
  }
});
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  // можно менять глазик на закрытый глаз при скрытии
  this.textContent = type === "password" ? "\u{1F441}" : "\u{1F441}\u{200D}\u{1F5E8}"; 
});