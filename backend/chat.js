import readline from "readline";
import fetch from "node-fetch";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Chat com IA (digite 'sair' para encerrar)\n");

async function enviarMensagem(mensagem) {
  try {
    const res = await fetch("'http://localhost:3000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: mensagem })
    });
    
    const data = await res.json();
    console.log(`IA: ${data.reply}\n`);
  } catch (err) {
    console.error("Erro ao conectar com o servidor:", err);
  }
}

function perguntar() {
  rl.question("Você: ", async (mensagem) => {
    if (mensagem.toLowerCase() === "sair") {
      rl.close();
      return;
    }

    await enviarMensagem(mensagem);
    perguntar();
  });
}

perguntar();
