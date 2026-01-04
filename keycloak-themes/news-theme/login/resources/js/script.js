document.addEventListener("DOMContentLoaded", function () {
    // Find the registration link in the standard Keycloak login form
    var registerBlock = document.getElementById("kc-registration");
    if (registerBlock) {
        var link = registerBlock.querySelector("a");
        if (link) {
            link.href = "http://localhost:5173/register";
            link.innerText = "Register New Account";
        }
    }
});
