const formulario = document.getElementById("formulario-cadastro-login");
const testarSenha = document.getElementById("senha");

formulario.addEventListener("submit", function(event) {
    const senha = testarSenha.value;

    /* permite no mínimo 8 caracteres com uma letra maiúscula, um número e um caractere especial*/ 
    const senhaValida =
        senha.length >= 8 &&
        /[A-Z]/.test(senha) &&
        /[0-9]/.test(senha) &&
        /[^A-Za-z0-9]/.test(senha);

    if (!senhaValida) {
        event.preventDefault();
        alert("A senha deve ter no mínimo 8 caracteres, incluindo uma letra maiúscula, um número e um caractere especial.");
    }
});
