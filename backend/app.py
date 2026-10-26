from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__, template_folder="../frontend/templates", static_folder="../frontend/static")

@app.route("/", methods=["GET", "POST"])
def inicio():
    if request.method == "POST":
        nome_usuario = request.form.get("nomeusuario")
        senha = request.form.get("senha")
        
        print(f"Usuário: {nome_usuario}")
        
        return redirect(url_for('inicio'))
        
    return render_template("login.html") # ou logim.html

if __name__ == "__main__":
    app.run(debug=True)

# OBS: por enquanto após digitar usuário e senha, atualizar a página não faz nada
